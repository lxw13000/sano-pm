// Read-only validation. Run after generating SVGs and rendering PNGs.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const pages=JSON.parse(fs.readFileSync(path.join(__dirname,'pages.json'),'utf8'));
const ids=new Set(pages.map(p=>p.id)),files=new Set(pages.map(p=>p.file));
assert.equal(ids.size,pages.length);assert.equal(files.size,pages.length);
assert.equal(pages.length,31);
let svgLinks=0,docLinks=0;
for(const p of pages){
 assert(/^admin-\d{2}-\d{2}-\d{2}-.+$/.test(p.file),'Invalid name '+p.file);
 const svg=fs.readFileSync(path.join(root,'源文件',p.file+'.svg'),'utf8');
 assert(svg.includes('width="1672" height="941"'),'Invalid SVG size '+p.file);
 assert(!svg.includes('\\n'),'Literal newline escape '+p.file);
 for(const m of svg.matchAll(/href="([^"]+)"/g)){
  assert(fs.existsSync(path.join(root,'源文件',m[1])),'Missing SVG target '+m[1]);svgLinks++;
 }
 for(const id of p.links)assert(ids.has(id),'Missing manifest target '+id);
 if(p.parentId!==undefined)assert(ids.has(p.parentId),'Missing parent');
 if(p.kind==='drawer'){
  assert.equal(p.parentId,6);assert.deepEqual(p.links,[6,21,22,23,24,25]);
  assert(svg.indexOf('y="133"')<svg.indexOf('y="203"'),'Tabs not before summary');
  assert(svg.includes('fill-opacity="0.46"'),'Missing dimmed parent');
 }
 const png=fs.readFileSync(path.join(root,'原型图',p.file+'.png'));
 assert.equal(png.readUInt32BE(16),1672);assert.equal(png.readUInt32BE(20),941);
}
assert.equal(pages.filter(p=>p.kind==='drawer').length,5);
assert.equal(pages.find(p=>p.id===26).parentId,6);
assert.equal(pages.find(p=>p.id===27).parentId,6);
assert(pages.find(p=>p.id===6).links.includes(27),'Missing child contribution tab');
assert(pages.find(p=>p.id===27).links.includes(26),'Missing child earnings drilldown');
assert(pages.find(p=>p.id===26).links.includes(27),'Child filter cannot return to child summary');
assert(pages.find(p=>p.id===3).links.includes(26),'Child drilldown lost');
assert.equal(pages.find(p=>p.id===16).kind,'stateCollection');
for(const folder of ['源文件','原型图']){
 const assets=fs.readdirSync(path.join(root,folder)).filter(f=>/\.(svg|png)$/.test(f)&&f!=='00-原型总览.png');
 assert.equal(assets.length,pages.length,'Unexpected duplicate/old assets in '+folder);
}
const docs=[path.join(root,'README.md'),path.join(root,'..','README.md'),path.join(root,'..','需求文档','公会运营与公会画像.md')];
for(const doc of docs){
 const content=fs.readFileSync(doc,'utf8');
 for(const m of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
  if(/^(https?:|#)/.test(m[1]))continue;
  assert(fs.existsSync(path.resolve(path.dirname(doc),m[1])),'Missing Markdown target '+m[1]);docLinks++;
 }
}
const html=fs.readFileSync(path.join(root,'原型导航.html'),'utf8');
for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g))assert(fs.existsSync(path.join(root,m[1])),'Missing gallery asset '+m[1]);
const commission=fs.readFileSync(path.join(root,'源文件',pages.find(p=>p.id===6).file+'.svg'),'utf8');
for(const value of ['直属主播贡献','直属子公会贡献','本公会分层合计','本公会奖励','本公会自身收益','公会周榜奖励','超级主播达标公会奖励','其他公会奖励'])assert(commission.includes(value),'Missing summary/source '+value);
assert(commission.includes('任何主播奖励均不向公会分层'),'Reward commission exclusion missing');
assert.equal(496+330+250+424,1500);assert.equal(160+48+32,240);
assert.equal(1500+240,1740);assert.equal(1740+600,2340);assert.equal(7500+1160+2340,11000);
assert.equal(4000*.16+120+100,860);assert.equal(4000*(.20-.16).toFixed(2),160);
// Role states share templates; static links are not a server-side permission test.
for(const [id,parent] of [[28,0],[29,1],[32,2]])assert.equal(pages.find(p=>p.id===id).parentId,parent);
const read=id=>fs.readFileSync(path.join(root,'源文件',pages.find(p=>p.id===id).file+'.svg'),'utf8');
const manager=read(0),operator=read(28),myList=read(29),myPortrait=read(32);
for(const value of ['公会总数','正向发展','高风险公会','平台超级主播','平台优质主播','公会自身收益','平台贡献净收益','平台奖励成本','平台贡献Top10','主播供给价值','用户经营价值'])assert(manager.includes(value),'Missing manager fact '+value);
for(const value of ['公会运营 Nina','我的公会（18个）','查看我的公会','平台贡献Top10'])assert(operator.includes(value),'Missing operator scope '+value);
assert(!operator.includes('平台超级主播')&&!operator.includes('平台优质主播'),'Operator leaks global identity totals');
assert(!operator.includes('运营与BD业绩'),'Ordinary operator links to cross-owner performance');
assert(myList.includes('责任范围（固定）')&&myList.includes('我负责 / Nina'),'My list lacks fixed owner');
assert(myPortrait.includes('返回列表')&&myPortrait.includes('公会运营 Nina'),'My portrait loses role/return context');
for(const [id,target] of [[0,1],[28,29],[28,32],[29,28],[29,32],[32,29],[32,28]])assert(pages.find(p=>p.id===id).links.includes(target),'Missing role/ranking route '+id+' -> '+target);
// Each workbench contains three independent, metric-only rankings.
function ranking(id,key){
 const match=read(id).match(new RegExp('<g id="ranking-'+key+'"[^>]*>([\\s\\S]*?)</g>'));
 assert(match,'Missing flat ranking '+id+' / '+key);
 const svg=match[1],texts=Array.from(svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)).map(m=>m[1]);
 assert(!/风险|60日|30日|评估|审核|超级|优质/.test(svg),'Risk/identity leaked into ranking '+key);
 for(const text of ['排名','公会','操作'])assert(texts.includes(text),'Missing column '+text);
 const values={};for(let i=0;i<texts.length;i++)if(/ G\d+$/.test(texts[i])){values[texts[i]]=texts[i+1];assert.equal(texts[i+2],'详情','Unexpected row action');}
 const links=Array.from(svg.matchAll(/href="([^"]+)"/g)).map(m=>m[1]);
 assert(links.every(link=>/公会画像概览|运营者查看公会状态/.test(link)),'Ranking jumps outside portrait');
 return {svg,texts,values};
}
for(const id of [0,28])for(const key of ['value','income','growth']){
 const rank=ranking(id,key);
 assert.equal(Object.keys(rank.values).length,id===28&&key==='growth'?9:10,'Wrong Top10 length '+id+' / '+key);
}
for(const key of ['value','income','growth']){
 const all=ranking(0,key).values,mine=ranking(28,key).values;
 for(const name of Object.keys(mine))if(all[name])assert.equal(all[name],mine[name],'Role changes per-guild metric '+name);
}
assert.equal(ranking(28,'value').values['星河 G1024'],'$1,600.00');
assert.equal(ranking(28,'income').values['星河 G1024'],'$1,200.00');
assert.equal(ranking(28,'growth').values['星河 G1024'],'+12%');
assert.equal(Object.keys(ranking(0,'income').values)[2],'海蓝 G3120');
assert.equal(Object.keys(ranking(0,'growth').values)[2],'银月 G2100');
assert(!ids.has(30)&&!ids.has(31),'Obsolete ranking tab states still active');

assert.equal(400000+132400+150000,682400);
assert.equal(Number((400000*.16+132400*.011+150000*.02).toFixed(2)),68456.4);
assert.equal(35570+7500+1200,44270);assert.equal(Number((68456.4-44270).toFixed(2)),24186.4);
assert.equal(89410+35570,124980);assert.equal(15020+7500,22520);
assert.equal(Number((70000*.16+28460*.011+20000*.02).toFixed(2)),11913.06);
assert.equal(5600+1000+1186.86,7786.86);assert.equal(Number((11913.06-7786.86).toFixed(2)),4126.2);
assert.equal(18+56+206,280);assert.equal(96+284+1260,1640);assert.equal(1640+260,1900);
assert.equal(44+18+32+18+8,120);assert.equal(7+4+4+1+2,18);

console.log(JSON.stringify({pages:pages.length,drawers:5,svgLinks,docLinks,names:'valid',sizes:'1672x941',duplicates:0},null,2));

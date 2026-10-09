// Read-only validation. Run after generating SVGs and rendering PNGs.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const pages=JSON.parse(fs.readFileSync(path.join(__dirname,'pages.json'),'utf8'));
const ids=new Set(pages.map(p=>p.id)),files=new Set(pages.map(p=>p.file));
assert.equal(ids.size,pages.length);assert.equal(files.size,pages.length);
assert.equal(pages.length,28);
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
console.log(JSON.stringify({pages:pages.length,drawers:5,svgLinks,docLinks,names:'valid',sizes:'1672x941',duplicates:0},null,2));

'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('url');
const {chromium,sharp,chrome}=require('./runtime');
const root=path.resolve(__dirname,'..'),out=path.join(root,'原型图');
const scenes=JSON.parse(fs.readFileSync(path.join(__dirname,'scenes.json'),'utf8'));
const url=pathToFileURL(path.join(root,'源文件/index.html')).href;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:chrome});
 const errors=[];
 try{
  for(const s of scenes){
   const page=await browser.newPage({viewport:s.mobile?{width:430,height:1080}:{width:1760,height:1120},deviceScaleFactor:1});
   page.on('pageerror',e=>errors.push(s.id+': '+e.message));
   await page.goto(url+'?scene='+s.id);await page.waitForFunction(()=>window.prototypeReady);await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>document.activeElement?.blur());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,s.id+' 整页横向溢出');
   await page.screenshot({path:path.join(out,s.file+'.png'),fullPage:s.mobile&&!await page.locator('#layer').isVisible()});
   await page.close();console.log('Rendered '+s.file);
  }
  assert.deepEqual(errors,[]);
  const thumbW=440,thumbH=405,cols=4,composite=[];
  for(let i=0;i<scenes.length;i++){
   const s=scenes[i];const thumb=await sharp(path.join(out,s.file+'.png')).resize(thumbW-20,350,{fit:'contain',background:'#f7f7fb'}).toBuffer();
   composite.push({input:thumb,left:i%cols*thumbW+10,top:Math.floor(i/cols)*thumbH+10});
   const label=Buffer.from(`<svg width="${thumbW}" height="38"><text x="12" y="25" font-size="13" fill="#192b46" font-family="Microsoft YaHei,sans-serif">${esc(s.file.split('-')[0]+' · '+s.title)}</text></svg>`);
   composite.push({input:label,left:i%cols*thumbW,top:Math.floor(i/cols)*thumbH+365});
  }
  await sharp({create:{width:cols*thumbW,height:Math.ceil(scenes.length/cols)*thumbH,channels:4,background:'#edf1f7'}}).composite(composite).png().toFile(path.join(out,'00-原型总览.png'));
  const cards=scenes.map(s=>`<article data-type="${s.mobile?'h5':'admin'}"><a class="preview ${s.mobile?'mobile':''}" href="源文件/index.html?scene=${s.id}"><img loading="lazy" src="原型图/${s.file}.png" alt="${esc(s.title)}"></a><div class="content"><small>${s.type}</small><h2>${esc(s.file.split('-')[0]+' · '+s.title)}</h2><p>${esc(s.note)}</p><div class="links"><a href="源文件/index.html?scene=${s.id}">打开交互场景 →</a><a href="原型图/${s.file}.png">查看 PNG</a></div></div></article>`).join('');
  fs.writeFileSync(path.join(root,'原型导航.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SANO 万圣节活动 · 原型导航</title><style>*{box-sizing:border-box}body{margin:0;font:14px "Microsoft YaHei",sans-serif;background:#f5f7fb;color:#192b46}header{background:#0b1c35;color:white;padding:38px max(28px,calc((100vw - 1500px)/2))}header small{letter-spacing:2px;color:#a8b7cf}h1{font-size:30px;margin:12px 0}header p{line-height:1.9;color:#b4c4db}nav{display:flex;gap:12px;flex-wrap:wrap;margin-top:23px}nav a{padding:11px 18px;background:#6545e8;border-radius:6px;color:white}nav a:nth-child(2){background:#ac6c32}nav a:nth-child(n+3){background:#1c3554}main{max-width:1556px;margin:26px auto;padding:0 28px}.note{padding:15px 18px;background:#fff6e5;color:#97631c;line-height:1.9;border-radius:7px;margin-bottom:24px}.filter{display:flex;gap:10px;margin-bottom:24px}button{border:1px solid #dce3ee;border-radius:6px;background:white;padding:10px 20px;cursor:pointer;color:#192b46}button.active{background:#6545e8;color:white}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}article{background:white;border:1px solid #e5eaf2;border-radius:9px;overflow:hidden}.preview{height:260px;background:#e9edf4;display:flex;justify-content:center;align-items:flex-start;overflow:hidden}.preview img{width:100%;display:block}.preview.mobile img{width:210px}.content{padding:19px}small{color:#6545e8;font-size:11px}h2{font-size:16px;margin:8px 0 10px}.content p{font-size:12px;line-height:1.8;color:#6b7c93;min-height:44px}.links{display:flex;gap:20px;margin-top:16px;font-size:12px}a{color:#6545e8;text-decoration:none}footer{margin:32px 0;color:#6b7c93;font-size:12px;line-height:2}[hidden]{display:none!important}@media(max-width:1000px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.grid{grid-template-columns:1fr}}</style></head><body><header><small>SANO · PRODUCT DESIGN / 2026.10.26</small><h1>万圣节活动 · 持续积分与地区榜单</h1><p>当天任意单场达到 1,000 分，手动领取当日 200 金币与南瓜灯，每天一份，多场分数不合并。活动内可跨天补领，结束后每日奖励失效。<br>三类地区榜单结束定榜，次日发放待领取奖励；页面保留期仍可领取最终榜单奖励。</p><nav><a href="源文件/index.html?scene=h5-live">H5 交互原型 →</a><a href="源文件/index.html?scene=admin-config">管理端交互原型 →</a><a href="../需求文档/万圣节活动产品设计.md">产品设计文档</a><a href="原型图/00-原型总览.png">原型总览</a><a href="README.md">演示说明</a></nav></header><main><div class="note">${scenes.length} 个关键页面与状态 · V1.2 · 与 sano提现管理 同级维护。管理端沿用深蓝导航、紫色主操作、浅色卡片；H5 采用万圣节紫金主题。<br>所有日期、国家映射、排名金币、头像框及有效期均为演示。正式排期、第三地区名称及国家清单、名次奖励待确认。全部时间使用 Sano Time · UTC+8。<br>V1.2：每日资格采用单场达标，今日领奖与历史补领分开。H5 直接展示配置奖励，管理端新增商城头像框选择及区域投入汇总。总投入（USD）=（金币投放 + 南瓜灯投放 × 200）÷ 10000。<br>直接打开即可交互，不连接真实钱包、游戏、商城或后台。刷新重置示例数据。</div><div class="filter"><button class="active" data-filter="all">全部 ${scenes.length}</button><button data-filter="h5">H5 · ${scenes.filter(s=>s.mobile).length}</button><button data-filter="admin">管理端 · ${scenes.filter(s=>!s.mobile).length}</button></div><div class="grid">${cards}</div><footer><a href="交互关系说明.md">交互关系说明</a> · <a href="验证记录.md">验证记录</a> · <a href="源文件/index.html">可编辑原型源文件</a><br>PNG 从同一交互源文件渲染。可通过生成工具重新导出。</footer></main><script>document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('article').forEach(a=>a.hidden=b.dataset.filter!=='all'&&a.dataset.type!==b.dataset.filter)});</script></body></html>`,'utf8');
  console.log('Complete: '+scenes.length+' scenes + overview + navigation.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('url');
const {chromium,chrome}=require('./runtime');
const scenes=require('./scenes');
const root=path.resolve(__dirname,'..'),out=path.join(root,'原型图');
const url=pathToFileURL(path.join(root,'源文件/index.html')).href;
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:chrome});
 const errors=[];
 try{
  for(const s of scenes){
   const page=await browser.newPage({viewport:{width:390,height:1060},deviceScaleFactor:2});
   page.on('pageerror',e=>errors.push(s.id+': '+e.message));
   await page.goto(url+'?scene='+s.id+'&capture=1');await page.waitForFunction(()=>window.prototypeReady);await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>document.activeElement?.blur());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,s.id+' 整页横向溢出');
   await page.screenshot({path:path.join(out,s.file+'.png'),fullPage:true});
   await page.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'pages.json'),JSON.stringify(scenes.map(s=>({...s,width:390,height:1060,source:'源文件/index.html?scene='+s.id})),null,2));
  const cards=scenes.map((s,i)=>`<article><a href="源文件/index.html?scene=${s.id}" class="preview"><img src="原型图/${s.file}.png" alt="${s.title}" loading="eager"></a><h2>${i+1}. ${s.title}</h2><p><a href="源文件/index.html?scene=${s.id}">操作交互原型 →</a> · <a href="原型图/${s.file}.png">PNG</a></p></article>`).join('');
  fs.writeFileSync(path.join(root,'原型导航.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>优质主播 · HTML交互原型</title><style>*{box-sizing:border-box}body{font:14px 'Microsoft YaHei',sans-serif;background:#f3f0f8;color:#30283c;max-width:1440px;margin:32px auto;padding:0 24px}h1{font-size:28px}header p{line-height:1.9;color:#756b82}nav{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}nav a{background:#944cff;color:white;padding:12px 20px;border-radius:9px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:18px}article{background:white;border-radius:15px;padding:12px}.preview{display:block;height:360px;overflow:hidden;background:#faf7ff;border-radius:9px;text-align:center}.preview img{width:100%;display:block}h2{font-size:13px}article p{font-size:11px}a{color:#8740e7;text-decoration:none}.overview header{display:none}.overview{max-width:none;width:1300px;margin:0;padding:16px}.overview main{grid-template-columns:repeat(5,1fr)}.overview article{padding:8px}.overview .preview{height:500px}.overview article p{display:none}.overview h2{font-size:11px}</style><header><h1>App代理管理 · 优质主播</h1><p>HTML、CSS、JavaScript 交互源文件，浏览器直接打开，无需启动服务。<br>支持真实表格滚动、固定ID和昵称、周切换、日历翻月与单周选择、确认与取消、返回、刷新、错误重试及分批加载。<br>所有数据为本地虚构样例，不连接实际业务接口；PNG从同一HTML导出。</p><nav><a href="源文件/index.html?scene=agency">从公会管理进入</a><a href="源文件/index.html?scene=current">打开优质主播</a><a href="源文件/index.html?scene=many">操作多成员表格</a></nav><p><a href="../需求文档/App代理管理优质主播.md">需求文档</a> · <a href="交互说明.md">交互说明</a> · <a href="验证记录.md">验证记录</a></p></header><main>${cards}</main><script>if(new URLSearchParams(location.search).has('overview'))document.body.classList.add('overview')</script></html>`);
  const overview=await browser.newPage({viewport:{width:1300,height:1000},deviceScaleFactor:1});
  await overview.goto(pathToFileURL(path.join(root,'原型导航.html')).href+'?overview=1');
  await overview.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  await overview.screenshot({path:path.join(out,'00-原型总览.png'),fullPage:true});await overview.close();
  console.log('Rendered '+scenes.length+' HTML scenes, PNG overview and interactive navigation.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

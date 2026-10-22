'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const dependencyRoot=process.env.SANO_NODE_MODULES||'C:/Users/24725/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=require(path.join(dependencyRoot,'playwright'));
const sharp=require(path.join(dependencyRoot,'sharp'));
const root=path.resolve(__dirname,'..'),out=path.join(root,'原型图');
const scenes=JSON.parse(fs.readFileSync(path.join(__dirname,'scenes.json'),'utf8'));
const url=pathToFileURL(path.join(root,'源文件','index.html')).href;
const chrome=process.env.SANO_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function main(){
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:chrome});
  const page=await browser.newPage({viewport:{width:1760,height:1120},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    for(const s of scenes){
      await page.goto(url+'?scene='+s.id);await page.evaluate(()=>window.prototypeReady);await page.evaluate(()=>document.fonts.ready);
      // 展开状态同时展示订单列表与下方本次处理，提交操作随处理块滚动。
      if(await page.locator('#audit-form-card').count()&&await page.locator('#audit-form-card').isVisible()&&await page.locator('#submit-audit').isVisible())await page.locator('#submit-audit').scrollIntoViewIfNeeded();
      // 截图不包含短暂 toast；保持原型业务状态不变。
      await page.locator('#toast').evaluate(el=>el.hidden=true);await page.evaluate(()=>document.activeElement?.blur());
      assert.equal(await page.locator('h1').innerText(),'提现管理');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      assert.equal(overflow,false,`${s.id}: 整页横向溢出`);
      if(await page.locator('.drawer').count()){
        const layout=await page.evaluate(()=>{const d=document.querySelector('.drawer'),b=document.querySelector('.drawer-body'),f=document.querySelector('.drawer-footer');return {right:d.getBoundingClientRect().right,bottom:b.getBoundingClientRect().bottom,footer:f.getBoundingClientRect().top,width:innerWidth,over:getComputedStyle(b).overflowY}});
        assert.equal(layout.right,layout.width);assert(layout.bottom<=layout.footer+1);assert.equal(layout.over,'auto');
      }
      await page.screenshot({path:path.join(out,s.file+'.png')});console.log('Rendered '+s.file);
    }
    assert.deepEqual(errors,[],'浏览器脚本异常');
    const cols=3,tw=586,th=405,composite=[];
    for(let i=0;i<scenes.length;i++){
      const s=scenes[i];const thumb=await sharp(path.join(out,s.file+'.png')).resize(tw-20,360,{fit:'contain',background:'#ffffff'}).toBuffer();
      composite.push({input:thumb,left:(i%cols)*tw+10,top:Math.floor(i/cols)*th+8});
      const label=Buffer.from(`<svg width="${tw}" height="32"><style>text{font-family:Microsoft YaHei,sans-serif}</style><text x="14" y="22" font-size="13" fill="#192b46">${String(i+1).padStart(2,'0')} · ${esc(s.title)}</text></svg>`);
      composite.push({input:label,left:(i%cols)*tw,top:Math.floor(i/cols)*th+368});
    }
    await sharp({create:{width:cols*tw,height:Math.ceil(scenes.length/cols)*th,channels:4,background:'#edf1f7'}}).composite(composite).png().toFile(path.join(out,'00-原型总览.png'));
    const cards=scenes.map((s,i)=>`<article><a href="源文件/index.html?scene=${s.id}"><img src="原型图/${s.file}.png" alt="${esc(s.title)}" loading="lazy"></a><div class="content"><small>${esc(s.type)}</small><h2>${String(i+1).padStart(2,'0')} · ${esc(s.title)}</h2><p>${esc(s.note)}</p><div class="links"><a href="源文件/index.html?scene=${s.id}">打开交互场景 →</a><a href="原型图/${s.file}.png">查看 PNG</a></div></div></article>`).join('');
    fs.writeFileSync(path.join(root,'原型导航.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SANO 提现管理 · 原型导航</title><style>*{box-sizing:border-box}body{margin:0;font:14px "Microsoft YaHei",sans-serif;background:#f5f7fb;color:#192b46}header{background:#0b1c35;color:white;padding:40px max(28px,calc((100vw - 1500px)/2))}header small{letter-spacing:2px;color:#a8b7cf}h1{font-size:30px;margin:12px 0}header p{color:#b4c4db;line-height:1.8}nav{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}nav a{padding:11px 18px;background:#6545e8;border-radius:6px;color:white}nav a+ a{background:#1c3554}main{max-width:1556px;margin:28px auto;padding:0 28px}.note{color:#6b7c93;line-height:1.9;margin-bottom:24px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}article{background:white;border:1px solid #e5eaf2;border-radius:9px;overflow:hidden}img{display:block;width:100%;border-bottom:1px solid #e5eaf2}.content{padding:19px}small{color:#6545e8;font-size:11px}h2{font-size:16px;margin:8px 0 10px}p{margin:0;font-size:12px;line-height:1.8;color:#6b7c93;min-height:43px}.links{display:flex;gap:20px;margin-top:16px;font-size:12px}a{color:#6545e8;text-decoration:none}footer{margin:36px 0;color:#6b7c93;font-size:12px}@media(max-width:1000px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.grid{grid-template-columns:1fr}}</style><header><small>SANO · PRODUCT DESIGN / 2026.10.22</small><h1>提现管理 · 审核与订单生命周期</h1><p>初审批量可跨提现方式，复审批量必须同一方式。两类抽屉提交后均保持打开。详情与历史左右同时展示。</p><nav><a href="源文件/index.html">进入交互原型 →</a><a href="../需求文档/提现管理优化.md">产品需求文档</a><a href="原型图/00-原型总览.png">全部场景总览</a><a href="README.md">演示说明</a><a href="UE走查与优化说明.md">UE 走查与优化</a></nav></header><main><div class="note">${scenes.length} 个页面与状态 · 深蓝导航 / 紫色主操作 · HTML、CSS、JS 为可编辑源文件，PNG 为评审图。<br>V1.4：初审、复审点击提交后先弹二次确认，核对订单范围与处理参数，确认后才执行。保留固定批次、单一结果摘要及红色核单提示。<br>交互使用本地虚构数据，刷新页面恢复初始状态；不连接真实打款或退款。提交后约 8 秒产生模拟打款结果，可手动刷新或等待 30 秒自动刷新。</div><div class="grid">${cards}</div><footer>状态：待审核 / 驳回已退款 / 打款中 / 打款失败 / 打款成功 / 已退款。打款失败即需要复审。<br><a href="交互关系说明.md">交互关系说明</a> · <a href="源文件/index.html">可编辑交互源文件</a></footer></main></html>`,'utf8');
    console.log(`Complete: ${scenes.length} PNG + overview + navigation; no browser errors.`);
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

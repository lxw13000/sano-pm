'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('url');
const {chromium,chrome}=require('./runtime');
const url=pathToFileURL(path.resolve(__dirname,'../源文件/index.html')).href;
const reports=[];
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:chrome});
 const page=await browser.newPage({viewport:{width:390,height:1060}});
 const errors=[],remote=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 const go=async scene=>{await page.goto(url+'?scene='+scene+'&capture=1');await page.waitForFunction(()=>window.prototypeReady);};
 const ready=()=>page.waitForFunction(()=>window.prototype.state.status==='ready');
 async function check(title,fn){await fn();reports.push(title);console.log('PASS '+title);}
 try{
  await check('公会管理入口进入真实八列表格，汇总采用完整名单',async()=>{
   await go('agency');await page.locator('[data-action="open-hosts"]').click();assert.equal(await page.locator('th').count(),8);assert.equal(await page.locator('tbody tr').count(),3);assert.equal(await page.locator('[data-total="total"]').innerText(),'200.75');assert.equal(await page.locator('[data-total="normal"]').innerText(),'120.50');assert.equal(await page.locator('[data-total="lucky"]').innerText(),'60.25');
  });
  await check('真实横向滚动，固定ID与昵称，返回保留表格位置',async()=>{
   const before=await page.locator('tbody tr:first-child td:first-child').boundingBox();await page.locator('[data-action="income-cols"]').click();await page.waitForFunction(()=>document.querySelector('.table-scroll').scrollLeft>150);const after=await page.locator('tbody tr:first-child td:first-child').boundingBox();assert(Math.abs(before.x-after.x)<1);await page.locator('[data-action="back"]').click();await page.locator('[data-action="open-hosts"]').click();assert(await page.locator('.table-scroll').evaluate(e=>e.scrollLeft)>150);assert.equal(await page.locator('tbody tr:first-child td:last-child').innerText(),'35.25');
  });
  await check('本周与上周切换实际更新全部数据，并复位表格位置',async()=>{
   await page.locator('[data-action="last"]').click();await ready();assert.equal(await page.locator('[data-total="total"]').innerText(),'2,119.00');assert.equal(await page.locator('tbody tr:first-child td:nth-child(3)').innerText(),'36:25');assert.equal(await page.locator('.table-scroll').evaluate(e=>e.scrollLeft),0);assert((await page.locator('.date-range').innerText()).includes('2026-10-19'));
  });
  await check('周选择候选状态不改原数据，取消、遮罩与Escape正确返回',async()=>{
   await page.locator('[data-action="picker"]').click();await page.locator('[data-week="2026-10-12"]').click();assert.equal(await page.locator('.week-row.selected').count(),1);assert.equal(await page.locator('[data-total="total"]').innerText(),'2,119.00');await page.locator('[data-picker="cancel"]').click();assert.equal(await page.locator('#week-dialog').isVisible(),false);await page.locator('[data-action="picker"]').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#week-dialog').isVisible(),false);await page.locator('[data-action="picker"]').click();await page.mouse.click(2,2);assert.equal(await page.locator('#week-dialog').isVisible(),false);
  });
  await check('单周确认更新日期、汇总、明细，选本周自动匹配快捷项',async()=>{
   await page.locator('[data-action="picker"]').click();await page.locator('[data-week="2026-10-12"]').click();await page.locator('[data-picker="confirm"]').click();await ready();assert.equal(await page.locator('[data-total="total"]').innerText(),'1,705.00');assert((await page.locator('[data-action="picker"]').getAttribute('class')).includes('active'));await page.locator('[data-action="picker"]').click();await page.locator('[data-week="2026-10-26"]').click();await page.locator('[data-picker="confirm"]').click();await ready();assert((await page.locator('[data-action="current"]').getAttribute('class')).includes('active'));
  });
  await check('日历翻月、跨月跨年自然周与未来周禁选真实可用',async()=>{
   await page.locator('[data-action="picker"]').click();await page.locator('[data-picker="prev"]').click();assert.equal(await page.locator('#month-input').inputValue(),'2026-09');assert.equal(await page.locator('[data-week="2026-09-28"] span').count(),7);await page.locator('#month-input').fill('2026-01');await page.locator('#month-input').dispatchEvent('change');await page.locator('[data-week="2025-12-29"]').click();assert((await page.locator('.selected-week').innerText()).includes('2026-01-04'));await page.locator('#month-input').fill('2026-11');await page.locator('#month-input').dispatchEvent('change');assert(await page.locator('[data-week="2026-11-02"]').isDisabled());assert(await page.locator('[data-picker="next"]').isDisabled());await page.locator('[data-picker="confirm"]').click();await ready();assert((await page.locator('.date-range').innerText()).includes('2025-12-29'));
  });
  await check('当前名单固定，历史周仍保留无业务主播',async()=>{
   const ids=await page.locator('tbody tr').evaluateAll(es=>es.map(e=>e.dataset.host));assert.deepEqual(ids.sort(),['156820','189342','207615']);const zero=page.locator('[data-host="207615"]');assert.equal(await zero.locator('td:nth-child(3)').innerText(),'0:00');
  });
  await check('空名单、无业务与缺失指标区分，缺失汇总不伪装成0',async()=>{
   await go('empty');assert.equal(await page.locator('tbody tr').count(),0);assert.equal(await page.locator('[data-total="total"]').innerText(),'0.00');await go('inactive');assert.equal(await page.locator('tbody tr').count(),3);assert.equal(await page.locator('[data-total="total"]').innerText(),'0.00');await go('partial');assert.equal(await page.locator('[data-total="lucky"]').innerText(),'统计中');assert.equal(await page.locator('[data-host="156820"] td:nth-child(5)').innerText(),'—');assert.equal(await page.locator('[data-host="156820"] td:last-child').innerText(),'—');
  });
  await check('首次错误重试和实际加载过渡可恢复',async()=>{
   await go('error');assert.equal(await page.locator('[data-total="total"]').count(),0);await page.locator('[data-action="retry"]').click();await ready();assert.equal(await page.locator('[data-total="total"]').innerText(),'200.75');await page.locator('[data-action="last"]').click();assert.equal(await page.locator('.loading-summary').count(),1);await ready();assert.equal(await page.locator('[data-total="total"]').innerText(),'2,119.00');
  });
  await check('分批加载不改变全量汇总，不重复主播，表头纵向吸顶',async()=>{
   await go('many');assert.equal(await page.locator('tbody tr').count(),10);const sum=await page.locator('[data-total="total"]').innerText();const v=page.locator('.table-scroll');await v.evaluate(e=>e.scrollTop=150);const box=await v.boundingBox(),head=await page.locator('th:first-child').boundingBox();assert(Math.abs(box.y-head.y)<2);await page.locator('[data-action="more"]').click();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===20);assert.equal(await page.locator('[data-total="total"]').innerText(),sum);await page.locator('[data-action="more"]').click();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===27);assert.equal(await page.locator('tbody tr').evaluateAll(es=>new Set(es.map(e=>e.dataset.host)).size),27);assert.equal(await page.locator('[data-action="more"]').count(),0);
  });
  await check('后续批次失败保留结果，重试只追加下一批',async()=>{
   await go('page-error');assert((await page.locator('.list-footer').innerText()).includes('本批加载失败'));const sum=await page.locator('[data-total="total"]').innerText();assert.equal(await page.locator('tbody tr').count(),10);await page.locator('[data-action="more"]').click();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===20);assert.equal(await page.locator('[data-total="total"]').innerText(),sum);
  });
  await check('切换演示场景后旧异步请求不覆盖新状态',async()=>{
   await go('current');await page.locator('[data-action="last"]').click();await page.evaluate(()=>window.prototype.reset('empty'));await page.waitForTimeout(300);assert.equal(await page.locator('tbody tr').count(),0);assert.equal(await page.locator('[data-total="total"]').innerText(),'0.00');
  });
  await check('360、390、430、1440宽度无整页横向溢出，八列在表格内滚动',async()=>{
   for(const width of [360,390,430,1440]){await page.setViewportSize({width,height:1060});await go('last');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const v=await page.locator('.table-scroll').boundingBox();const peak=await page.locator('th:nth-child(5)').boundingBox();assert(peak.x+peak.width<=v.x+v.width+1);assert(await page.locator('.table-scroll').evaluate(e=>e.scrollWidth>e.clientWidth));}
  });
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  fs.writeFileSync(path.resolve(__dirname,'../验证记录.md'),'# HTML交互原型验证记录\n\n验证日期：2026-10-26。使用本机Chrome无头浏览器及Playwright，直接打开本地HTML。\n\n'+reports.map(t=>'- 通过：'+t).join('\n')+'\n\n没有页面脚本错误，无远程网络请求。PNG由同一HTML源文件通过浏览器截图生成。\n');
  console.log('Validated '+reports.length+' interaction groups.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

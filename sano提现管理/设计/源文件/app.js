'use strict';

const STATUS = ['待审核', '驳回已退款', '打款中', '打款失败', '打款成功', '已退款'];
const tones = {'待审核':'pending','驳回已退款':'refunded','打款中':'processing','打款失败':'failed','打款成功':'success','已退款':'refunded'};
// 配置仅作为原型输入，操作界面不编辑配置。
const channelConfig = {
  GCASH: [{name:'payer_max',type:'第三方渠道',available:true},{name:'pay_roll',type:'PayRoll',available:true},{name:'gcash_maintenance',type:'第三方渠道',available:false}],
  BANK: [{name:'bank_transfer',type:'第三方渠道',available:true}]
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const $ = selector => document.querySelector(selector);
const badge = status => `<span class="badge ${tones[status]}">${esc(status)}</span>`;
const clockText = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
let rows = [], selected = new Set(), filter = {}, drawer = null, detailKey = null, ticker = null, toastTimeout = null, idSequence = 400;
let lastFocus = null, detailFocus = null, currentPage = 1, pageSize = 20;
let recentBatches = [], batchCounter = 0, submitConfirmation = null;
const isTerminal = r => ['打款成功','已退款','驳回已退款'].includes(r.status);

function event(title, time, actor='系统', content='', tone='', change=null) {
  return {title,time,actor,content,tone,change};
}
function makeOrder(key, method, status, amount, index, channel='') {
  const number = String(503140000000000000n + BigInt(index) * 91871n);
  const fail = status === '打款失败';
  const r = {key,id:number,originalId:number,previousIds:[],method,status,amount,user:String(11110000+index),country:'PH',created:`2026-10-22 09:${String(56-index*2).padStart(2,'0')}:26`,channel:channel || (status==='待审核'?'':method==='GCASH'?'payer_max':'bank_transfer'),type:channel==='pay_roll'?'PayRoll':'第三方渠道',upstream:status==='待审核'?'':`UP20261022${String(index).padStart(5,'0')}`,name:['Mika Santos','Lina Cruz','Alex Reyes','Nina Tan'][index%4],account:`09${String(660000000+index)}`,phone:`09${String(660000000+index)}`,attempt:status==='待审核'||status==='驳回已退款'?0:1,reason:fail?(index===5?'渠道服务暂不可用':'渠道拒绝：订单号已使用'):'',note:'',auditBy:status==='待审核'?'—':'Nina',auditTime:status==='待审核'?'—':'2026-10-22 09:40:10',paidAt:status==='打款成功'?'2026-10-22 09:42:32':'—',refundReason:status==='已退款'?'收款账户暂不支持，请核对后重新申请。':'',rejectReason:status==='驳回已退款'?'提现资料核验未通过。':'',events:[],due:null,retries:0,submitResult:'',failFirstRetry:key==='f2'};
  r.failInitial=key==='p3';
  r.created=`2026-10-22 09:${String(30-index).padStart(2,'0')}:26`;
  r.events.push(event('发起提现',r.created,`用户 ${r.user}`,`${method} · 提现 ${money(amount)} USD`));
  if(status!=='待审核') r.events.push(event(status==='驳回已退款'?'人工初审不通过':'自动审核通过','2026-10-22 09:40:10',status==='驳回已退款'?'Nina':'系统',status==='驳回已退款'?'驳回并退款':'按程序配置完成自动审核',status==='驳回已退款'?'':'success'));
  if(r.attempt) r.events.push(event('第 1 次打款发起','2026-10-22 09:40:12','系统',`实际渠道：${r.channel}\n本次订单号：${r.id}`));
  if(fail) r.events.push(event('第 1 次打款失败','2026-10-22 09:41:30','渠道回调',r.reason,'failed'));
  if(status==='打款成功') r.events.push(event('第 1 次打款成功',r.paidAt,'渠道回调',`实际打款 ${money(payout(r))} PHP`,'success'));
  if(status==='已退款') {r.events.push(event('第 1 次打款失败','2026-10-22 09:41:30','渠道回调','收款账户不支持','failed'));r.events.push(event('复审退款完成','2026-10-22 09:45:10','Nina',`退款理由（用户可见）：${r.refundReason}`,'success'));}
  if(status==='驳回已退款') r.events.push(event('驳回退款完成','2026-10-22 09:40:11','系统',r.rejectReason,'success'));
  return r;
}
function fee(r) { return r.amount*.02; }
function net(r) { return r.amount-fee(r)-1; }
function payout(r) { return Math.round(net(r)*61.191*100)/100; }
function seed() {
  rows = [makeOrder('p1','GCASH','待审核',101,1),makeOrder('p2','BANK','待审核',260,2),makeOrder('p3','GCASH','待审核',85,3),makeOrder('f1','GCASH','打款失败',101,4),makeOrder('f2','GCASH','打款失败',150,5,'pay_roll'),makeOrder('f3','GCASH','打款失败',75,6),makeOrder('fb','BANK','打款失败',220,7),makeOrder('progress','GCASH','打款中',90,8),makeOrder('history','GCASH','打款成功',101,9,'pay_roll'),makeOrder('done','BANK','打款成功',310,10),makeOrder('reject','BANK','驳回已退款',200,11),makeOrder('refund','GCASH','已退款',80,12)];
  rows.find(r=>r.key==='progress').due=Date.now()+8000;
  const h=rows.find(r=>r.key==='history');
  const ids=[h.originalId,h.originalId+'R1',h.originalId+'R2',h.originalId+'R3'];
  h.previousIds=ids.slice(0,3);h.id=ids[3];h.attempt=4;h.auditBy='Nina';h.auditTime='2026-10-22 10:03:00';h.paidAt='2026-10-22 10:04:12';h.note='核对后更换渠道并重新打款。';h.events=h.events.slice(0,2);
  for(let i=0;i<4;i++) {
    const ch=i<2?'payer_max':'pay_roll';
    if(i>0) {
      h.events.push(event('复审通过',`2026-10-22 ${['','09:48:00','09:55:00','10:03:00'][i]}`,'Nina',`第 ${i} 次复审 · ${i===3?'自动选择渠道':'指定渠道：'+ch}\n修改订单号：是 · 备注：核对后重新打款`,'review', {from:ids[i-1],to:ids[i]}));
    }
    const t=['09:40:12','09:48:01','09:55:01','10:03:01'][i];
    h.events.push(event(`第 ${i+1} 次打款发起`,`2026-10-22 ${t}`,'系统',`实际渠道：${ch}\n本次订单号：${ids[i]}`));
    h.events.push(event(`第 ${i+1} 次打款${i<3?'失败':'成功'}`,`2026-10-22 ${['09:41:30','09:49:12','09:56:10','10:04:12'][i]}`,'渠道回调',i<3?['渠道服务暂不可用','渠道拒绝：订单号不可复用','渠道余额不足'][i]:`实际打款 ${money(payout(h))} PHP`,i<3?'failed':'success'));
  }
}

function toast(message) {clearTimeout(toastTimeout);$('#toast').textContent=message;$('#toast').hidden=false;toastTimeout=setTimeout(()=>$('#toast').hidden=true,4000);}
function matches(r, exclude='') {
  const f={...filter,[exclude]:''};
  return (!f.order||[r.id,...r.previousIds].some(id=>id.includes(f.order)))&&(!f.upstream||r.upstream.includes(f.upstream))&&(!f.type||r.type===f.type)&&(!f.channel||r.channel===f.channel)&&(!f.method||r.method===f.method)&&(!f.user||r.user.includes(f.user))&&(!f.status||r.status===f.status)&&(!f.country||r.country===f.country.toUpperCase())&&(!f.start||r.created.slice(0,10)>=f.start)&&(!f.end||r.created.slice(0,10)<=f.end);
}
function visibleRows() {return rows.filter(r=>matches(r));}
function pageRows() {return visibleRows().slice((currentPage-1)*pageSize,currentPage*pageSize);}
function selectionLock() {
  const first=rows.find(r=>selected.has(r.key));
  return first?{status:first.status,method:first.status==='打款失败'?first.method:''}:null;
}
function canSelectMain(r) {
  if(!['待审核','打款失败'].includes(r.status))return false;
  const lock=selectionLock();return !lock||(r.status===lock.status&&(!lock.method||r.method===lock.method));
}
function selectAllCandidates() {
  const list=pageRows().filter(r=>['待审核','打款失败'].includes(r.status)),lock=selectionLock();
  if(lock)return list.filter(canSelectMain);
  if(!list.length||new Set(list.map(r=>r.status)).size>1)return [];
  if(list[0].status==='打款失败'&&new Set(list.map(r=>r.method)).size>1)return [];
  return list;
}
function renderSummary() {
  const pool=rows.filter(r=>matches(r,'status'));
  $('#status-summary').innerHTML=['全部',...STATUS].map(s=>`<button class="stat-tile ${s==='打款失败'?'failed':''} ${filter.status===(s==='全部'?'':s)?'selected':''}" data-action="status" data-status="${s==='全部'?'':s}" title="当前其他查询条件下的订单数"><span>${s}</span><strong>${s==='全部'?pool.length:pool.filter(r=>r.status===s).length}</strong></button>`).join('');
}
function renderMethodShortcuts() {
  const el=$('#method-shortcuts');el.hidden=filter.status!=='打款失败';
  if(el.hidden)return;
  const pool=rows.filter(r=>matches(r,'method'));
  const methods=[...new Set(pool.map(r=>r.method))];
  el.innerHTML='<span>按提现方式处理</span>'+['',...methods].map(m=>`<button class="${(filter.method||'')===m?'selected':''}" data-action="method-shortcut" data-method="${m}">${m||'全部方式'} <b>${m?pool.filter(r=>r.method===m).length:pool.length}</b></button>`).join('')+'<span>选中一笔后，其他方式暂不可勾选。</span>';
}
function renderList() {
  const tableScroll=$('.main-table-scroll'),top=tableScroll.scrollTop,left=tableScroll.scrollLeft;
  const all=visibleRows();currentPage=Math.max(1,Math.min(currentPage,Math.ceil(all.length/pageSize)||1));
  const view=pageRows();$('.main-table').classList.add('show-extra');
  $('#main-rows').innerHTML=view.length?view.map(r=>`<tr data-key="${r.key}">
    <td class="pin-check"><input type="checkbox" data-main-key="${r.key}" aria-label="选择订单 ${r.id}" title="${canSelectMain(r)?'选择此订单':selectionLock()?'与已选订单的处理阶段或提现方式不同':'当前状态无需审核'}" ${selected.has(r.key)?'checked':''} ${canSelectMain(r)?'':'disabled'}></td>
    <td class="pin-order"><div class="cell-stack"><button class="text-btn order-link" data-action="detail" data-key="${r.key}">${esc(r.id)}</button><small>用户 ${r.user}<span class="country-tag">${r.country}</span></small></div></td>
    <td><div class="cell-stack">${badge(r.status)}${r.reason?`<span class="failure-text">${esc(r.reason)}</span>`:''}</div></td>
    <td><b>${r.method}</b></td><td class="num">${money(r.amount)}</td>
    <td><div class="cell-stack"><span class="num">${money(payout(r))}<span class="currency">PHP</span></span><small>到账 ${money(net(r))} USD</small></div></td>
    <td><div class="cell-stack"><b>${esc(r.channel||'待自动选择')}</b><small>${r.attempt?'第 '+r.attempt+' 次打款':'尚未打款'}</small></div></td>
    <td><div class="cell-stack"><span>${r.created.slice(0,10)}</span><small>${r.created.slice(11)}</small></div></td>
    <td class="extra-col"><div class="cell-stack"><span>固定 1.00</span><span>浮动 ${money(fee(r))}（2%）</span><small>汇率 61.191 PHP / USD</small></div></td>
    <td class="extra-col"><div class="cell-stack"><b>扣除 ${(r.amount*10000).toLocaleString('en-US')}</b><small>扣除前 103,498,975</small><small>扣除后 ${(103498975-r.amount*10000).toLocaleString('en-US')}</small></div></td>
    <td class="extra-col"><div class="cell-stack"><span>${esc(r.name)}</span><small>账号 ${r.account}</small><small>电话 ${r.phone}</small></div></td>
    <td class="extra-col"><div class="cell-stack"><span>${r.auditBy}</span><small>${r.auditTime}</small><small>备注 ${esc(r.note||'—')}</small></div></td>
    <td class="extra-col"><div class="cell-stack"><span>${esc(r.upstream||'—')}</span><small>${r.channel?r.type:'—'}</small></div></td>
    <td class="pin-actions"><div class="row-actions"><button class="text-btn" data-action="detail" data-key="${r.key}">详情</button>${r.status==='待审核'?`<button class="text-btn" data-action="initial-one" data-key="${r.key}">初审</button>`:r.status==='打款失败'?`<button class="text-btn" data-action="review-one" data-key="${r.key}">复审</button>`:''}</div></td>
  </tr>`).join(''):'<tr><td colspan="14" class="empty">没有符合条件的订单，请调整筛选条件。</td></tr>';
  $('#list-count').textContent=`${all.length} 笔`;$('#list-total').textContent=`共 ${all.length} 条 · 批量选择限当前页 · 上方数量随查询条件变化`;
  $('#page-position').textContent=`${currentPage} / ${Math.ceil(all.length/pageSize)||1}`;$('#page-prev').disabled=currentPage<=1;$('#page-next').disabled=currentPage*pageSize>=all.length;
  tableScroll.scrollTop=top;tableScroll.scrollLeft=left;renderSummary();renderMethodShortcuts();renderSelection();renderRecentBatches();
}
function renderRecentBatches(){
  $('#recent-toggle').disabled=!recentBatches.length;$('#recent-toggle').textContent=`最近处理批次${recentBatches.length?'（'+recentBatches.length+'）':''}`;
  $('#recent-batches').innerHTML='<p>可以关闭抽屉继续处理其他订单，稍后回看本批结果。</p>'+recentBatches.map(b=>{const group=b.keys.map(k=>rows.find(r=>r.key===k));return `<button data-action="resume-batch" data-batch="${b.batchKey}"><b>${b.mode==='initial'?'初审':'复审'} · ${group.length} 笔${b.mode==='review'?' · '+group[0].method:''}</b><span>提交 ${esc(b.submittedAt||b.last)}</span><span>打款中 ${group.filter(r=>r.status==='打款中').length} · 失败 ${group.filter(r=>r.status==='打款失败').length} · 已结束 ${group.filter(isTerminal).length}</span><em>查看结果 →</em></button>`}).join('');
}
function resumeBatch(key){
  const batch=recentBatches.find(b=>b.batchKey===key);if(!batch)return;
  settleDue();drawer=batch;drawer.nextAt=Date.now()+30000;drawer.last=clockText();
  $('#recent-batches').hidden=true;$('#drawer-layer').hidden=false;document.body.style.overflow='hidden';renderDrawer();startTicker();$('#drawer-layer .icon-button').focus();
}
function renderSelection() {
  const chosen=rows.filter(r=>selected.has(r.key)),initial=chosen.length&&chosen.every(r=>r.status==='待审核'),review=chosen.length&&chosen.every(r=>r.status==='打款失败')&&new Set(chosen.map(r=>r.method)).size===1;
  $('#selected-label').textContent=chosen.length?`本页已选 ${chosen.length} 笔`:'';$('#clear-selection').hidden=!chosen.length;
  $('#batch-initial').disabled=!initial;$('#batch-review').disabled=!review;
  $('#batch-initial').hidden=filter.status==='打款失败';$('#batch-review').hidden=filter.status==='待审核';
  $('#batch-initial').title=initial?'处理已选待审核订单':'请选择待审核订单';$('#batch-review').title=review?'处理同一提现方式的失败订单':'请选择同一提现方式的打款失败订单';
  let hint='先切换待审核／打款失败，或先勾选一笔。系统会限制后续选择，避免选错。';
  if(initial)hint=`已选 ${chosen.length} 笔待审核订单，允许不同提现方式；可勾选本页其他待审核订单。`;
  else if(review)hint=`已选 ${chosen.length} 笔 ${chosen[0].method} 失败订单；其他提现方式暂不可勾选，取消选择后可切换。`;
  else if(chosen.length)hint='选择条件不一致，请取消选择后重新勾选。';
  $('#selection-hint').textContent=hint;$('#selection-hint').classList.toggle('error',!!chosen.length&&!initial&&!review);
  const can=selectAllCandidates(),el=$('#select-all-main');el.disabled=!can.length;el.title=can.length?'全选当前页符合条件的订单':'先选择一笔，或切换到同一处理阶段／提现方式';
  el.checked=!!can.length&&can.every(r=>selected.has(r.key));el.indeterminate=can.some(r=>selected.has(r.key))&&!el.checked;
}
function applyFilters() {
  filter={order:$('#f-order').value.trim(),upstream:$('#f-upstream').value.trim(),type:$('#f-type').value,channel:$('#f-channel').value,method:$('#f-method').value,user:$('#f-user').value.trim(),status:$('#f-status').value,country:$('#f-country').value.trim(),start:$('#f-start').value,end:$('#f-end').value};selected.clear();currentPage=1;renderList();
}
function resetFilters() {$('#filter-form').reset();filter={status:''};selected.clear();currentPage=1;renderList();}
function startTicker() {
  clearInterval(ticker);ticker=setInterval(()=>{if(!drawer)return;const n=Math.max(0,Math.ceil((drawer.nextAt-Date.now())/1000));const el=$('#refresh-countdown');if(el)el.textContent=n;if(n===0&&!drawer.busy)refreshBatch(false);},1000);
}
function openDrawer(mode,keys,parent=null) {
  const batch=rows.filter(r=>keys.includes(r.key));
  if(!batch.length)return toast('请先选择需要处理的订单。');
  const expect=mode==='initial'?'待审核':'打款失败';
  if(batch.some(r=>r.status!==expect))return toast(`${mode==='initial'?'初审':'复审'}仅支持${expect}订单，请调整勾选。`);
  if(mode==='review'&&new Set(batch.map(r=>r.method)).size!==1)return toast('批量复审必须是同一个提现方式，请调整勾选。');
  lastFocus=document.activeElement;
  drawer={mode,keys:[...keys],form:{decision:'pass',channel:'auto',rename:'',reason:'',note:''},submitted:false,notice:'',nextAt:Date.now()+30000,last:clockText(),busy:false,collapsed:false,round:0,changed:new Set(),updated:0,parent,scrollTop:0,batchKey:String(++batchCounter)};
  $('#drawer-layer').hidden=false;document.body.style.overflow='hidden';renderDrawer();startTicker();$('#drawer-layer .icon-button').focus();
}
function batchRows() {return drawer?drawer.keys.map(k=>rows.find(r=>r.key===k)):[];}
function eligible(r) {return drawer&&r.status===(drawer.mode==='initial'?'待审核':'打款失败');}
function handoffReview(method,key='') {
  const parent=drawer;if(!parent||parent.busy)return;
  const keys=batchRows().filter(r=>r.status==='打款失败'&&(key?r.key===key:(!r.submitError&&r.method===method))).map(r=>r.key);
  if(!keys.length)return toast('这些订单已不再是打款失败，请查看最新状态。');
  parent.scrollTop=$('.drawer-body').scrollTop;openDrawer('review',keys,parent);
}
function backToParent() {
  if(!drawer?.parent||drawer.busy)return;
  drawer=drawer.parent;drawer.last=clockText();drawer.nextAt=Date.now()+30000;renderDrawer();$('.drawer-body').scrollTop=drawer.scrollTop;startTicker();
}
function renderDrawer(){
  const review=drawer.mode==='review';
  $('#drawer-layer').innerHTML=`<section class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><header class="drawer-header"><div>${drawer.parent?'<button class="text-btn back-to-batch" data-action="back-parent">← 返回原批订单</button>':''}<h2 id="drawer-title">${review?'提现复审':'提现初审'}${review?`<span class="badge pending">${batchRows()[0].method}</span>`:''}</h2><p>${review?'核对失败原因，选择退款或再次打款':'核对本批订单，审核通过后逐笔自动选渠道打款'}</p></div><button class="icon-button" data-action="close-drawer" aria-label="关闭审核抽屉">×</button></header><div class="drawer-body"><div id="batch-summary" class="batch-summary"></div><div id="result-bar" class="result-bar" role="status" aria-live="polite" hidden></div><section id="batch-orders-section"><div class="section-title drawer-table-heading"><h3>本批订单 <small id="batch-total"></small></h3><div class="refresh-tools"><small>每 30 秒刷新 · <span id="refresh-countdown" class="countdown">30</span>s</small><button data-action="refresh-batch">↻ 手动刷新</button></div></div><div class="batch-table-scroll"><table class="batch-table"><thead><tr><th>当前订单号 / 用户</th><th>提现方式</th><th>提现 USD</th><th>最近打款渠道</th><th>次数</th><th>当前状态</th><th>失败原因 / 实际结果</th><th>最近提交记录</th><th>操作</th></tr></thead><tbody id="batch-rows"></tbody></table></div><p class="batch-caption">本批订单已在主列表确定，处理参数统一作用于本批；提交后记录保留并刷新实际状态。</p><div id="review-handoff" class="review-handoff"></div></section><section id="audit-form-card" class="audit-form"><div class="section-title processing-header"><div class="processing-title"><h3>本次处理</h3><p class="audit-safety-hint">先核对上方订单，再填写并提交本次处理</p></div><button id="toggle-processing" class="text-btn" data-action="toggle-form" aria-controls="audit-form-content" aria-expanded="true">收起处理参数</button></div><div id="audit-form-content"><p id="submitted-record-note" class="submitted-record-note" hidden>本批已提交，以下为本次处理参数记录。</p><fieldset id="audit-fields"></fieldset><div id="form-error" class="form-error" role="alert"></div><div id="audit-submit-area" class="audit-submit-area"><button id="submit-audit" class="primary" data-action="submit-audit"></button><div id="submit-selection" class="submit-scope"></div></div></div></section></div><footer class="drawer-footer"><div class="footer-meta">最近刷新：<strong id="last-refreshed"></strong><br>关闭仅退出查看，不影响已受理的处理。</div><div class="footer-buttons"><button data-action="close-drawer">关闭</button></div></footer></section>`;
  renderForm();renderBatch();
}
function renderForm() {
  const review=drawer.mode==='review',f=drawer.form;
  $('#audit-fields').innerHTML=`<div class="form-line"><div class="field-title"><span class="required">*</span>处理结果</div><div class="radio-set"><label><input type="radio" name="decision" value="pass" ${f.decision==='pass'?'checked':''}>${review?'审核通过，再次打款':'审核通过并打款'}</label><label><input type="radio" name="decision" value="refund" ${f.decision==='refund'?'checked':''}>${review?'退款':'不通过并退款'}</label></div></div>
  ${f.decision==='pass'?(review?`<div class="form-grid"><div class="form-line"><div class="field-title">本次打款渠道</div><div class="field-content"><select id="audit-channel"><option value="auto">自动选择（按配置优先级）</option>${(channelConfig[batchRows()[0].method]||[]).filter(c=>c.available).map(c=>`<option value="${c.name}" ${f.channel===c.name?'selected':''}>${c.name} · ${c.type}</option>`).join('')}</select><div class="helper">${batchRows()[0].method} 已配置且可用的渠道；不会修改全局优先级。</div></div></div><div class="form-line"><div class="field-title"><span class="required">*</span>修改订单号</div><div class="field-content"><div class="radio-set"><label><input type="radio" name="rename" value="yes" ${f.rename==='yes'?'checked':''}>是</label><label><input type="radio" name="rename" value="no" ${f.rename==='no'?'checked':''}>否</label></div><div class="helper">是：后台逐笔换号；否：沿用原号。部分渠道不允许重复使用已用订单号。</div></div></div></div>`:`<div class="form-line"><div class="field-title">打款渠道</div><div class="field-content"><div class="helper">按每笔订单提现方式的渠道优先级自动选择，无需手动指定。</div></div></div>`):`<div class="form-line"><div class="field-title">${review?'<span class="required">*</span>退款理由':'驳回原因'}</div><div class="field-content"><textarea id="audit-reason" maxlength="500" placeholder="${review?'请输入给用户看的退款理由（必填）':'沿用现有初审驳回原因规则'}">${esc(f.reason)}</textarea>${review?'<div class="reason-templates"><span class="muted">快捷填写</span><button data-action="reason-template" data-reason="收款信息不正确，请核对后重新申请。">收款信息不正确</button><button data-action="reason-template" data-reason="收款渠道暂不可用，请稍后重新申请。">收款渠道暂不可用</button><button data-action="reason-template" data-reason="该收款账户暂不支持，请更换账户后重新申请。">收款账户不支持</button></div><div id="refund-preview" class="refund-preview"></div>':'<div class="helper">初审不通过并退款完成后显示“驳回已退款”。</div>'}</div></div>`}
  <div class="form-line"><div class="field-title">内部备注</div><div class="field-content"><input id="audit-note" maxlength="500" placeholder="选填，仅管理端可见" value="${esc(f.note)}"></div></div>`;
  renderRefundPreview();
}
function renderRefundPreview() {
  const el=$('#refund-preview');if(!el||!drawer)return;
  el.innerHTML=`<b>用户可见 · 将统一用于本批 ${drawer.keys.length} 笔订单</b><br>${esc(drawer.form.reason.trim()||'填写理由后，可在此核对用户看到的内容。')}`;
}
function renderBatch(){
  if(!drawer)return;
  const list=batchRows(),total=list.length,amount=list.reduce((sum,r)=>sum+r.amount,0),finished=list.filter(isTerminal).length,unaccepted=list.filter(r=>r.submitError).length;
  const failed=list.filter(r=>r.status==='打款失败'&&!r.submitError).length,processing=list.filter(r=>r.status==='打款中').length;
  $('#batch-summary').innerHTML=`<span>本批 <b>${total}</b> 笔</span><span>提现合计 <b>${money(amount)}</b> USD</span><span>提现方式 <b>${[...new Set(list.map(r=>r.method))].join(' / ')}</b></span>`;
  const result=$('#result-bar');result.hidden=!drawer.submitted;
  let summary=`本批已结束 ${finished} / ${total} 笔`;
  if(finished===total)summary+=' · 全部已结束';
  else {if(processing)summary+=` · 打款中 ${processing} 笔`;if(failed)summary+=` · 打款失败 ${failed} 笔`;if(unaccepted)summary+=` · 提交未受理 ${unaccepted} 笔`;}
  result.className=`result-bar single-result ${finished===total?'complete':failed||unaccepted?'attention':''}`;
  result.innerHTML=`<strong>${summary}</strong>`;
  $('#batch-rows').innerHTML=list.map(r=>`<tr data-key="${r.key}" class="${drawer.changed.has(r.key)?'changed':''} ${r.status==='打款失败'?'awaiting-review':''}"><td><button class="text-btn order-link" data-action="detail" data-key="${r.key}">${esc(r.id)}</button>${r.previousIds.length?`<small class="previous-id">上次 ${esc(r.previousIds.at(-1))}</small>`:''}<small class="previous-id">用户 ${r.user}</small></td><td>${r.method}</td><td class="num">${money(r.amount)}</td><td>${esc(r.channel||'自动选择')}</td><td>${r.attempt} 次</td><td>${badge(r.status)}</td><td>${r.reason?`<span class="failure-text">${esc(r.reason)}</span>`:`<span class="result-text">${r.status==='打款中'?'等待渠道返回结果':r.status==='打款成功'?'打款已完成':r.status==='已退款'?esc(r.refundReason):r.status==='驳回已退款'?'初审驳回，退款已完成':'等待初审'}</span>`}</td><td><span class="${r.submitError?'failure-text':'result-text'}">${esc(r.submitResult||'尚未提交')}</span></td><td><button class="text-btn" data-action="detail" data-key="${r.key}">详情</button></td></tr>`).join('');
  $('#batch-total').textContent=`${total} 笔`;$('#last-refreshed').textContent=drawer.last;
  $('#audit-form-content').hidden=drawer.collapsed;
  $('#toggle-processing').textContent=drawer.collapsed?'展开处理参数':'收起处理参数';$('#toggle-processing').setAttribute('aria-expanded',String(!drawer.collapsed));
  $('#audit-fields').disabled=drawer.submitted||drawer.busy;
  if(!drawer.submitted&&list.some(r=>!eligible(r)))$('#form-error').textContent='本批订单状态已变化，请返回主列表重新确定处理订单。';
  $('#submitted-record-note').hidden=!drawer.submitted;
  $('#audit-submit-area').hidden=drawer.submitted;
  $('#submit-selection').innerHTML=`<span class="scope-amount">本次处理本批 <b>${total}</b> 笔 · <b>${money(amount)}</b> USD</span>`;
  const button=$('#submit-audit');button.disabled=drawer.busy||drawer.submitted||list.some(r=>!eligible(r));
  button.textContent=drawer.busy?'提交中…':`提交${drawer.mode==='initial'?'初审':'复审'} · ${drawer.form.decision==='refund'?(drawer.mode==='initial'?'确认驳回并退款':'确认退款'):(drawer.mode==='initial'?'通过并打款':'通过并再次打款')} ${total} 笔`;
  button.classList.toggle('danger-btn',drawer.form.decision==='refund');button.classList.toggle('primary',drawer.form.decision!=='refund');
  const failures=list.filter(r=>r.status==='打款失败'&&!r.submitError),methods=[...new Set(failures.map(r=>r.method))];
  const actions=drawer.submitted?methods.map(m=>`<button data-action="handoff-review" data-method="${m}">复审${methods.length>1?' '+m:''}失败订单 ${failures.filter(r=>r.method===m).length} 笔 →</button>`):[];
  if(drawer.submitted&&unaccepted)actions.push(`<button data-action="retry-unaccepted">重新处理未受理订单 ${unaccepted} 笔 →</button>`);
  $('#review-handoff').innerHTML=actions.join('');renderRefundPreview();
}
function retryUnaccepted(){
  if(!drawer||drawer.busy)return;
  const parent=drawer,keys=batchRows().filter(r=>r.submitError).map(r=>r.key);
  if(!keys.length)return;parent.scrollTop=$('.drawer-body').scrollTop;openDrawer(parent.mode,keys,parent);
}
function syncForm(target) {
  if(!drawer||drawer.submitted||drawer.busy)return;
  if(target.name==='decision'){drawer.form.decision=target.value;renderForm();$('#form-error').textContent='';renderBatch();$(`input[name=decision][value=${target.value}]`)?.focus();}
  else if(target.name==='rename')drawer.form.rename=target.value;
  else if(target.id==='audit-channel')drawer.form.channel=target.value;
  else if(target.id==='audit-reason'){drawer.form.reason=target.value;renderRefundPreview();}
  else if(target.id==='audit-note')drawer.form.note=target.value;
}
function confirmationFingerprint(){
  return JSON.stringify(batchRows().map(r=>({key:r.key,id:r.id,amount:r.amount,user:r.user,method:r.method,country:r.country,account:r.account,status:r.status})));
}
function showConfirmationError(message){
  const error=$('#confirm-error');if(!error)return;
  error.textContent=message;$('#confirm-submit').disabled=true;$('#return-to-edit').disabled=false;
}
function openSubmitConfirmation(owner,form){
  if(submitConfirmation)return;
  submitConfirmation={owner,form:{...form},fingerprint:confirmationFingerprint(),returnFocus:document.activeElement};
  $('#drawer-layer').inert=true;$('#submit-confirm-layer').hidden=false;renderSubmitConfirmation();$('#return-to-edit').focus();
}
function renderSubmitConfirmation(){
  if(!submitConfirmation)return;
  const {owner,form}=submitConfirmation,list=batchRows(),refund=form.decision==='refund',review=owner.mode==='review';
  const line=(key,value,extra='')=>`<div class="confirm-pair ${extra}"><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`;
  let body=line('处理结果',refund?(review?'退款':'初审不通过并退款'):(review?'复审通过，再次打款':'初审通过并打款'));
  body+=line('订单范围',`本批 ${list.length} 笔，全部处理`)+line('提现合计',`${money(list.reduce((n,r)=>n+r.amount,0))} USD`)+line('提现方式',[...new Set(list.map(r=>r.method))].join(' / '));
  if(!refund){body+=line('打款渠道',review?(form.channel==='auto'?'自动选择（按提现方式渠道优先级）':form.channel):'按每笔订单提现方式自动选择渠道');if(review)body+=line('修改订单号',form.rename==='yes'?'是，后台为每笔订单分别生成新订单号':'否，沿用原订单号');}
  else body+=line(review?'退款理由（用户可见）':'驳回原因',form.reason.trim()||'—',review?'visible-reason':'');
  if(form.note.trim())body+=line('内部备注',form.note.trim());
  $('#submit-confirm-layer').innerHTML=`<section class="submit-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description"><header><span class="confirm-icon ${refund?'refund':''}">!</span><div><h2 id="confirm-title">确认提交${review?'复审':'初审'}</h2><p id="confirm-description">请再次核对以下处理内容，确认后才会执行。</p></div></header><div class="confirm-content"><dl>${body}</dl><p class="confirm-consequence ${refund?'refund':''}">${refund?'确认后将对本批订单执行退款，请核对理由和订单范围。':'确认后将对本批订单发起打款，订单先进入打款中。'}</p><div id="confirm-error" class="form-error" role="alert"></div></div><footer><button id="return-to-edit" data-action="cancel-submit">返回修改</button><button id="confirm-submit" class="${refund?'confirm-refund':'primary'}" data-action="confirm-submit">确认提交</button></footer></section>`;
}
function closeSubmitConfirmation(force=false){
  if(!submitConfirmation||(!force&&submitConfirmation.owner.busy))return;
  const old=submitConfirmation;submitConfirmation=null;$('#submit-confirm-layer').hidden=true;$('#submit-confirm-layer').innerHTML='';$('#drawer-layer').inert=false;
  if(!force&&old.returnFocus?.isConnected)old.returnFocus.focus();else $('#toggle-processing')?.focus();
}
async function submitAudit(confirmation=null) {
  if(!drawer||drawer.busy)return;
  if(drawer.submitted)return toast('本批已提交，请从失败或未受理订单入口继续处理。');
  if(drawer.collapsed){drawer.collapsed=false;renderBatch();$('#audit-form-card').scrollIntoView({block:'start'});return;}
  if(confirmation&&confirmation!==submitConfirmation)return;
  const d=drawer,f={...(confirmation?confirmation.form:d.form)},chosen=batchRows();
  let error='';
  if(confirmation&&(confirmation.owner!==d||confirmation.fingerprint!==confirmationFingerprint()||JSON.stringify(confirmation.form)!==JSON.stringify(d.form))){showConfirmationError('订单或处理参数已变化，请返回抽屉重新核对后提交。');return;}
  if(!chosen.length)error='本批没有可处理订单。';
  else if(chosen.some(r=>!eligible(r)))error='本批订单状态已变化，请返回主列表重新确定处理订单。';
  else if(d.mode==='review'&&new Set(chosen.map(r=>r.method)).size!==1)error='复审必须是同一提现方式。';
  else if(d.mode==='review'&&f.decision==='refund'&&!f.reason.trim())error='请填写退款理由，该理由用户可见。';
  else if(d.mode==='review'&&f.decision==='pass'&&!['yes','no'].includes(f.rename))error='请选择是否修改订单号，不能默认沿用旧号。';
  else if(f.decision==='pass'&&chosen.some(r=>!(channelConfig[r.method]||[]).some(c=>c.available&&(f.channel==='auto'||d.mode==='initial'||c.name===f.channel))))error='当前没有可用的打款渠道，请调整渠道或选择退款。';
  if(confirmation&&error){showConfirmationError(error+' 请返回修改。');return;}
  $('#form-error').textContent=error;if(error){$('#audit-reason')?.classList.toggle('input-error',f.decision==='refund');$('#form-error').scrollIntoView({block:'nearest'});return;}
  if(!confirmation){openSubmitConfirmation(d,f);return;}
  d.busy=true;renderBatch();$('#confirm-submit').disabled=true;$('#confirm-submit').textContent='提交中…';$('#return-to-edit').disabled=true;await new Promise(resolve=>setTimeout(resolve,350));if(drawer!==d)return;
  let accepted=0,rejected=0;d.round++;d.changed=new Set();
  for(const r of chosen){
    r.submitError=false;
    if(r.rejectOnce){r.rejectOnce=false;r.submitError=true;r.submitResult=`第 ${d.round} 次提交未受理，可重试`;rejected++;continue;}
    const time=clockText();r.auditBy='Nina';r.auditTime=time;r.note=f.note;r.reason='';r.submitResult=`第 ${d.round} 次提交已受理`;d.changed.add(r.key);
    if(f.decision==='refund'){
      r.status=d.mode==='initial'?'驳回已退款':'已退款';r.due=null;
      if(d.mode==='review')r.refundReason=f.reason.trim();else r.rejectReason=f.reason.trim();
      r.events.push(event(d.mode==='initial'?'人工初审不通过并退款完成':'复审退款完成',time,'Nina',`${d.mode==='review'?'退款理由（用户可见）':'驳回原因'}：${f.reason.trim()||'—'}\n内部备注：${f.note||'—'}`,'success'));
    }else{
      r.events.push(event(d.mode==='initial'?'人工初审通过':'复审通过',time,'Nina',`${d.mode==='initial'?'逐笔自动选渠道':f.channel==='auto'?'自动选择渠道':'指定渠道：'+f.channel}\n${d.mode==='review'?'修改订单号：'+(f.rename==='yes'?'是':'否')+'\n':''}内部备注：${f.note||'—'}`,'review'));
      if(d.mode==='review'&&f.rename==='yes'){
        const old=r.id;r.previousIds.push(old);r.id=`5031422${String(++idSequence).padStart(11,'0')}`;
        r.events.push(event('修改订单号',time,'后台自动处理','本次复审生成新订单号','review',{from:old,to:r.id}));
      }
      const cfg=(channelConfig[r.method]||[]).filter(c=>c.available),channel=d.mode==='initial'||f.channel==='auto'?cfg[0]:cfg.find(c=>c.name===f.channel);
      r.channel=channel.name;r.type=channel.type;r.status='打款中';r.attempt++;r.upstream=`UP20261022${++idSequence}`;r.due=Date.now()+8000;if(d.mode==='review')r.retries++;
      r.events.push(event(`第 ${r.attempt} 次打款发起`,time,'系统',`实际渠道：${r.channel}\n本次订单号：${r.id}`));
    }
    accepted++;selected.delete(r.key);
  }
  d.submittedAt=d.submittedAt||clockText();
  d.lastSubmit={round:d.round,accepted,rejected};
  d.busy=false;d.submitted=true;d.last=clockText();d.nextAt=Date.now()+30000;d.collapsed=true;d.updated=accepted;
  d.notice=`本次 ${accepted} 笔已受理${rejected?`，${rejected} 笔未受理`:''}。${f.decision==='pass'?'已受理订单进入打款中；请查看各笔实际结果。':'已受理订单退款完成。'} 本批订单保留，抽屉不会自动关闭。`;
  if(!recentBatches.some(b=>b.batchKey===d.batchKey)){recentBatches.unshift(d);recentBatches=recentBatches.slice(0,10);}
  closeSubmitConfirmation(true);renderBatch();renderList();if(d.collapsed)$('.drawer-body').scrollTop=0;toast(rejected?'部分提交未受理，请查看对应订单。':'已受理，请查看本批处理结果。');
}
function settleDue(force=false){
  const changed=[];
  for(const r of rows){
    if(r.status!=='打款中'||!r.due||(!force&&Date.now()<r.due))continue;
    const fails=(r.failInitial&&r.attempt===1)||(r.failFirstRetry&&r.retries===1);
    r.status=fails?'打款失败':'打款成功';r.reason=fails?'渠道服务暂不可用，请复审核对渠道后处理':'';r.due=null;
    if(!fails)r.paidAt=clockText();changed.push(r.key);
    r.events.push(event(`第 ${r.attempt} 次打款${fails?'失败':'成功'}`,clockText(),'渠道回调',fails?r.reason:`实际渠道：${r.channel}\n实际打款 ${money(payout(r))} PHP`,fails?'failed':'success'));
  }
  return changed;
}
function refreshBatch(manual=true){
  if(!drawer||drawer.busy)return;
  const changed=settleDue();drawer.changed=new Set(changed.filter(k=>drawer.keys.includes(k)));drawer.updated=drawer.changed.size;
  drawer.last=clockText();drawer.nextAt=Date.now()+30000;renderBatch();renderList();if(submitConfirmation&&submitConfirmation.fingerprint!==confirmationFingerprint())showConfirmationError('订单信息或状态已变化，请返回抽屉重新核对。');if(detailKey)renderDetail();if(manual)toast(drawer.updated?`已刷新，${drawer.updated} 笔状态有变化。`:'已刷新，暂无新的状态变化。');
}
function closeDrawer(){
  if(drawer?.busy)return toast('正在提交，请等待受理结果。');
  clearInterval(ticker);ticker=null;drawer=null;$('#drawer-layer').hidden=true;$('#drawer-layer').innerHTML='';document.body.style.overflow='';renderList();
  if(lastFocus?.isConnected)lastFocus.focus();else $('#batch-initial').hidden?$('#batch-review').focus():$('#batch-initial').focus();
}

function pair(key,value,wide=false,raw=false) {return `<div class="info-pair ${wide?'wide':''}"><div class="info-key">${esc(key)}</div><div class="info-value">${raw?value:esc(value||'—')}</div></div>`;}
function section(title,content) {return `<section class="info-section"><h3>${title}</h3><div class="info-grid">${content}</div></section>`;}
function copyButton(text) {return `<button class="copy-button" data-action="copy" data-copy="${esc(text)}" aria-label="复制 ${esc(text)}">复制</button>`;}
function openDetail(key) {
  detailFocus=document.activeElement;detailKey=key;$('#detail-layer').hidden=false;document.body.style.overflow='hidden';renderDetail();$('#detail-layer .icon-button').focus();
}
function renderDetail(){
  const r=rows.find(r=>r.key===detailKey);if(!r)return;
  const infoScroll=$('.detail-info')?.scrollTop||0,historyScroll=$('.detail-history')?.scrollTop||0,optionalOpen=$('.info-optional')?.open||false;
  const base=pair('用户 ID',r.user)+pair('国家代码',r.country)+pair('发起时间',r.created)+pair('审核时间',r.auditTime)+pair('打款时间',r.paidAt)+pair('累计打款',`${r.attempt} 次`)+pair('上游订单号',r.upstream||'—',true);
  const amounts=pair('提现金额',`${money(r.amount)} USD`)+pair('到账金额',`${money(net(r))} USD`)+pair('实际打款金额',`${money(payout(r))} PHP`)+pair('打款货币汇率','61.191 PHP / USD')+pair('固定手续费','1.00 USD')+pair('浮动手续费',`${money(fee(r))} USD`)+pair('手续费费率','2%')+pair('扣除钻石',`${(r.amount*10000).toLocaleString('en-US')} 钻石`)+pair('扣除前钻石','103,498,975 钻石')+pair('扣除后钻石',`${(103498975-r.amount*10000).toLocaleString('en-US')} 钻石`);
  let pay=pair('提现方式',r.method)+pair('提现渠道',r.channel||'待自动选择')+pair('渠道类型',r.channel?r.type:'—')+pair('打款货币代码','PHP')+pair('收款人姓名',r.name)+pair('收款账户',r.account)+pair('收款电话',r.phone)+pair('账户类型',r.method==='BANK'?'银行账户':'电子钱包');
  if(r.method==='BANK')pay+=pair('银行名称','示例银行')+pair('银行代码','DEMO-PH');
  const optionalKeys=['账户验证数字','USDT 地址','币安 ID','名','中间名','姓','邮箱',...(r.method==='GCASH'?['银行名称','银行代码']:[]),'银行网点号','银行城市','银行代理账号','证明类型','识别号码','识别号码有效期','出生日期','地址','城市','州','邮编'];
  let optional=optionalKeys.map(k=>pair(k,k==='名'?r.name.split(' ')[0]:k==='姓'?r.name.split(' ')[1]:'—')).join('');
  if(optionalKeys.length%2)optional+=pair('补充信息','—');
  const notes=pair('驳回原因',r.rejectReason||'—',true)+pair('退款理由（用户可见）',r.refundReason||'—',true)+pair('审核人',r.auditBy)+pair('内部备注',r.note||'—');
  const latest=r.events.at(-1);
  $('#detail-layer').innerHTML=`<section class="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title"><header class="detail-header"><div><h2 id="detail-title">提现订单详情</h2><p>当前订单号 ${esc(r.id)} ${copyButton(r.id)} <span style="margin:0 10px">·</span> 用户 ${r.user} <span class="country-tag">${r.country}</span></p></div><div class="head-actions">${badge(r.status)}<button data-action="refresh-detail">↻ 刷新</button><button class="icon-button" data-action="close-detail" aria-label="关闭订单详情">×</button></div></header><div class="detail-layout"><div class="detail-info"><div class="receipt-highlight"><div><span>收款人：</span><b>${esc(r.name)}</b></div><div><span>提现方式：</span><b>${r.method}</b></div><div><span>收款账户：</span><b>${r.account}</b> ${copyButton(r.account)}</div><div><span>实际打款：</span><b>${money(payout(r))} PHP</b></div></div>${r.reason?`<div class="notice warning"><b>最近失败原因：</b>${esc(r.reason)}</div>`:''}${section('基础信息',base)}${section('金额信息',amounts)}${section('渠道与收款信息',pay)}<details class="info-optional" ${optionalOpen?'open':''}><summary>其他收款与身份字段（${optionalKeys.length} 项，展开查看）</summary><div class="info-grid">${optional}</div></details>${section('备注信息',notes)}</div><aside class="detail-history"><div class="detail-history-top"><div class="timeline-head"><h3>订单历史记录</h3><span class="only-demo">${r.events.length} 条事件</span></div><p class="timeline-note">按发生顺序保留全过程 · ${r.attempt} 次打款 / ${r.previousIds.length} 次换号</p><div class="history-latest ${r.status==='打款失败'?'failed':''}"><h4>最新进展 <span>${esc(latest?.title||'发起提现')}</span></h4><p>${esc(latest?.time||r.created)} · ${esc(latest?.actor||'系统')}<br>最近渠道：${esc(r.channel||'尚未打款')}</p><div class="history-links"><button class="text-btn" data-action="history-start">回到发起</button><button class="text-btn" data-action="history-latest">跳到最新 ↓</button></div></div></div><ol class="timeline">${r.events.map(e=>`<li class="${e.tone}"><div class="event-heading"><strong>${esc(e.title)}</strong><time>${esc(e.time.slice(11))}</time></div><div class="event-meta">${esc(e.time.slice(0,10))} · ${esc(e.actor)}</div>${e.content?`<div class="event-content">${esc(e.content)}</div>`:''}${e.change?`<div class="event-change"><b>修改订单号</b><br>原：${esc(e.change.from)} ${copyButton(e.change.from)}<br><span class="new-id">新：${esc(e.change.to)} ${copyButton(e.change.to)}</span></div>`:''}</li>`).join('')}</ol></aside></div><footer class="detail-footer"><span>左右独立滚动 · 无关的空字段收起，历史记录完整保留</span><div class="detail-actions">${r.status==='待审核'?`<button class="text-btn" data-action="detail-initial">初审此订单</button>`:r.status==='打款失败'?`<button class="text-btn" data-action="detail-review">复审此订单</button>`:''}<button data-action="close-detail">关闭</button></div></footer></section>`;
  $('.detail-info').scrollTop=infoScroll;$('.detail-history').scrollTop=historyScroll;
}
function closeDetail() {detailKey=null;$('#detail-layer').hidden=true;$('#detail-layer').innerHTML='';if(!drawer)document.body.style.overflow='';detailFocus?.focus();}
async function copy(text) {
  try {if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);else{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();if(!document.execCommand('copy'))throw Error('copy');t.remove();}toast('已复制。');}catch {toast('浏览器未允许复制，请选中完整编号手动复制。');}
}
function exportRows() {
  const csv='\uFEFF'+[['订单号','用户ID','提现方式','金额USD','状态','渠道'],...visibleRows().map(r=>[r.id,r.user,r.method,money(r.amount),r.status,r.channel])].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='提现订单-示例.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出当前筛选结果（示例数据）。');
}

document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-action]');if(!btn||btn.disabled)return;
  const action=btn.dataset.action,key=btn.dataset.key;
  if(action==='status'){$('#f-status').value=btn.dataset.status;filter.status=btn.dataset.status;selected.clear();currentPage=1;renderList();}
  else if(action==='method-shortcut'){$('#f-method').value=btn.dataset.method;filter.method=btn.dataset.method;selected.clear();currentPage=1;renderList();}
  else if(action==='clear-selection'){selected.clear();renderList();}
  else if(action==='page-prev'||action==='page-next'){currentPage+=action==='page-next'?1:-1;selected.clear();renderList();$('.main-table-scroll').scrollTop=0;}
  else if(action==='recent-toggle'){$('#recent-batches').hidden=!$('#recent-batches').hidden;renderRecentBatches();}
  else if(action==='resume-batch')resumeBatch(btn.dataset.batch);
  else if(action==='reset-filter')resetFilters();
  else if(action==='batch-initial')openDrawer('initial',[...selected]);
  else if(action==='batch-review')openDrawer('review',[...selected]);
  else if(action==='initial-one')openDrawer('initial',[key]);
  else if(action==='review-one')openDrawer('review',[key]);
  else if(action==='close-drawer')closeDrawer();
  else if(action==='back-parent')backToParent();
  else if(action==='handoff-review')handoffReview(btn.dataset.method);
  else if(action==='retry-unaccepted')retryUnaccepted();
  else if(action==='review-from-batch')handoffReview('',key);
  else if(action==='submit-audit')submitAudit();
  else if(action==='confirm-submit')submitAudit(submitConfirmation);
  else if(action==='cancel-submit')closeSubmitConfirmation();
  else if(action==='refresh-batch')refreshBatch();
  else if(action==='toggle-form'){drawer.collapsed=!drawer.collapsed;renderBatch();if(!drawer.collapsed)$('#audit-form-card').scrollIntoView({block:'start'});}
  else if(action==='reason-template'){drawer.form.reason=btn.dataset.reason;$('#audit-reason').value=btn.dataset.reason;$('#audit-reason').classList.remove('input-error');$('#form-error').textContent='';renderRefundPreview();}
  else if(action==='detail')openDetail(key);
  else if(action==='close-detail')closeDetail();
  else if(action==='history-start')$('.detail-history').scrollTop=0;
  else if(action==='history-latest')$('.detail-history').scrollTop=$('.detail-history').scrollHeight;
  else if(action==='refresh-detail'){settleDue();renderDetail();if(drawer)renderBatch();renderList();toast('已刷新订单详情及历史。');}
  else if(action==='refresh-list'){settleDue();for(const k of selected)if(!['待审核','打款失败'].includes(rows.find(r=>r.key===k).status))selected.delete(k);renderList();toast('已刷新订单列表。');}
  else if(action==='copy')copy(btn.dataset.copy);
  else if(action==='export')exportRows();
  else if(action==='detail-initial'||action==='detail-review'){
    const k=detailKey;closeDetail();
    if(drawer){const parent=drawer;parent.scrollTop=$('.drawer-body').scrollTop;openDrawer(action==='detail-initial'?'initial':'review',[k],parent);}
    else openDrawer(action==='detail-initial'?'initial':'review',[k]);
  }
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.mainKey){if(t.checked)selected.add(t.dataset.mainKey);else selected.delete(t.dataset.mainKey);renderList();}
  else if(t.id==='select-all-main'){const checked=t.checked;for(const r of selectAllCandidates()){if(checked)selected.add(r.key);else selected.delete(r.key);}renderList();}
  else if(t.id==='page-size'){pageSize=Number(t.value);currentPage=1;selected.clear();renderList();}
  else syncForm(t);
});
document.addEventListener('input',e=>{if(['audit-reason','audit-note'].includes(e.target.id))syncForm(e.target);if(e.target.id==='audit-reason'){e.target.classList.remove('input-error');$('#form-error').textContent='';}});
$('#filter-form').addEventListener('submit',e=>{e.preventDefault();applyFilters();});
document.addEventListener('keydown',e=>{
  const container=submitConfirmation?$('.submit-confirm-dialog'):detailKey?$('.detail-dialog'):drawer?$('.drawer'):null;
  if(e.key==='Escape'){if(submitConfirmation){e.preventDefault();closeSubmitConfirmation();}else if(detailKey)closeDetail();else if(drawer)closeDrawer();}
  if(e.key==='Tab'&&container){const els=[...container.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(el=>el.getClientRects().length);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});

// 场景入口用于静态评审图与原型导航复现；只操作本地示例。
async function submitScene(){await submitAudit();if(submitConfirmation)await submitAudit(submitConfirmation);}
async function loadScene(scene){
  if(['confirm-initial','confirm-initial-refund','confirm-review','confirm-review-refund'].includes(scene)){
    const review=scene.startsWith('confirm-review');openDrawer(review?'review':'initial',review?['f1','f2','f3']:['p1','p2','p3']);
    drawer.form.rename='yes';drawer.form.channel=review?'pay_roll':'auto';
    if(scene.endsWith('refund')){drawer.form.decision='refund';drawer.form.reason=review?'收款渠道暂不可用，请核对后重新申请。':'提现资料核验未通过。';}
    drawer.form.note='已核对本批收款资料。';renderForm();renderBatch();await submitAudit();
  }else if(['initial','initial-refund','initial-submitted','initial-refunded','initial-result','initial-to-review'].includes(scene)){
    filter.status='待审核';$('#f-status').value=filter.status;renderList();openDrawer('initial',['p1','p2','p3']);
    if(scene.includes('refund')){drawer.form.decision='refund';drawer.form.reason='提现资料核验未通过。';renderForm();renderBatch();}
    if(['initial-submitted','initial-refunded','initial-result','initial-to-review'].includes(scene))await submitScene();
    if(['initial-result','initial-to-review'].includes(scene)){settleDue(true);refreshBatch(false);}
    if(scene==='initial-to-review')handoffReview('GCASH');
  }else if(['review','review-refund','review-submitted','review-result','review-refunded','review-partial','review-final','review-focus','review-rename-required'].includes(scene)){
    filter.status='打款失败';$('#f-status').value=filter.status;renderList();openDrawer('review',['f1','f2','f3']);
    drawer.form.rename='yes';drawer.form.channel='pay_roll';drawer.form.note='核对收款信息后重新打款。';
    if(scene.includes('refund')){drawer.form.decision='refund';drawer.form.reason='收款渠道暂不可用，请核对收款信息后重新申请。';}
    if(scene==='review-rename-required')drawer.form.rename='';
    renderForm();renderBatch();
    if(['review-submitted','review-result','review-refunded','review-partial','review-final','review-focus','review-rename-required'].includes(scene)){
      if(scene==='review-partial')rows.find(r=>r.key==='f3').rejectOnce=true;
      await submitScene();
      if(['review-result','review-final','review-focus'].includes(scene)){settleDue(true);refreshBatch(false);}
      if(scene==='review-final'){handoffReview('GCASH');drawer.form.rename='yes';renderForm();renderBatch();await submitScene();settleDue(true);backToParent();refreshBatch(false);}
      if(scene==='review-focus')handoffReview('GCASH');
    }
  }else if(scene==='recent-batches'){
    openDrawer('initial',['p1','p2','p3']);await submitScene();closeDrawer();
    openDrawer('review',['f1']);drawer.form.rename='yes';renderForm();renderBatch();await submitScene();closeDrawer();
    $('#recent-batches').hidden=false;renderRecentBatches();
  }else if(scene==='detail'||scene==='detail-end'){
    openDetail('history');if(scene==='detail-end'){$('.detail-history').scrollTop=$('.detail-history').scrollHeight;$('.detail-info').scrollTop=$('.detail-info').scrollHeight;}
  }else if(scene==='mixed-review'){
    filter.status='打款失败';$('#f-status').value=filter.status;selected=new Set(['f1']);renderList();
  }else if(scene==='failed'||scene==='method-gcash'){
    filter.status='打款失败';$('#f-status').value=filter.status;if(scene==='method-gcash'){filter.method='GCASH';$('#f-method').value='GCASH';}renderList();
  }
}
seed();$('#f-status').innerHTML='<option value="">全部状态</option>'+STATUS.map(s=>`<option>${s}</option>`).join('');filter={status:''};renderList();
window.prototypeReady=loadScene(new URLSearchParams(location.search).get('scene')||'list');
window.demo={get orders(){return rows},get drawer(){return drawer},get selected(){return [...selected]},loadScene,settleDue};

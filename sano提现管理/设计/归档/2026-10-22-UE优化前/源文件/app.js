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
let lastFocus = null, detailFocus = null;

function event(title, time, actor='系统', content='', tone='', change=null) {
  return {title,time,actor,content,tone,change};
}
function makeOrder(key, method, status, amount, index, channel='') {
  const number = String(503140000000000000n + BigInt(index) * 91871n);
  const fail = status === '打款失败';
  const r = {key,id:number,originalId:number,previousIds:[],method,status,amount,user:String(11110000+index),country:'PH',created:`2026-10-22 09:${String(56-index*2).padStart(2,'0')}:26`,channel:channel || (status==='待审核'?'':method==='GCASH'?'payer_max':'bank_transfer'),type:channel==='pay_roll'?'PayRoll':'第三方渠道',upstream:status==='待审核'?'':`UP20261022${String(index).padStart(5,'0')}`,name:['Mika Santos','Lina Cruz','Alex Reyes','Nina Tan'][index%4],account:`09${String(660000000+index)}`,phone:`09${String(660000000+index)}`,attempt:status==='待审核'||status==='驳回已退款'?0:1,reason:fail?(index===5?'渠道服务暂不可用':'渠道拒绝：订单号已使用'):'',note:'',auditBy:status==='待审核'?'—':'Nina',auditTime:status==='待审核'?'—':'2026-10-22 09:40:10',paidAt:status==='打款成功'?'2026-10-22 09:42:32':'—',refundReason:status==='已退款'?'收款账户暂不支持，请核对后重新申请。':'',rejectReason:status==='驳回已退款'?'提现资料核验未通过。':'',events:[],due:null,retries:0,submitResult:'',failFirstRetry:key==='f2'};
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
function visibleRows() {
  return rows.filter(r=>(!filter.order||[r.id,...r.previousIds].some(id=>id.includes(filter.order)))&&(!filter.upstream||r.upstream.includes(filter.upstream))&&(!filter.type||r.type===filter.type)&&(!filter.channel||r.channel===filter.channel)&&(!filter.method||r.method===filter.method)&&(!filter.user||r.user.includes(filter.user))&&(!filter.status||r.status===filter.status)&&(!filter.country||r.country===filter.country.toUpperCase())&&(!filter.start||r.created.slice(0,10)>=filter.start)&&(!filter.end||r.created.slice(0,10)<=filter.end));
}
function renderSummary() {
  $('#status-summary').innerHTML=['全部',...STATUS].map(s=>`<button class="stat-tile ${s==='打款失败'?'failed':''} ${filter.status===(s==='全部'?'':s)?'selected':''}" data-action="status" data-status="${s==='全部'?'':s}"><span>${s}</span><strong>${s==='全部'?rows.length:rows.filter(r=>r.status===s).length}</strong></button>`).join('');
}
function renderList() {
  const tableScroll=$('.main-table-scroll'), top=tableScroll.scrollTop,left=tableScroll.scrollLeft;
  const view=visibleRows();
  $('#main-rows').innerHTML=view.length?view.map(r=>`<tr data-key="${r.key}">
    <td class="pin-check"><input type="checkbox" data-main-key="${r.key}" aria-label="选择订单 ${r.id}" ${selected.has(r.key)?'checked':''} ${['待审核','打款失败'].includes(r.status)?'':'disabled'}></td>
    <td class="pin-order"><div class="cell-stack"><button class="text-btn order-link" data-action="detail" data-key="${r.key}">${esc(r.id)}</button><small>用户 ${r.user}<span class="country-tag">${r.country}</span></small><small>上游 ${esc(r.upstream||'—')}</small></div></td>
    <td>${badge(r.status)}</td><td><div class="cell-stack"><span>${r.created.slice(0,10)}</span><small>${r.created.slice(11)}</small></div></td>
    <td><div class="cell-stack"><span><small>提现</small> <b class="num">${money(r.amount)}</b></span><span><small>到账</small> <b class="num">${money(net(r))}</b></span></div></td>
    <td><div class="cell-stack"><span class="num">${money(payout(r))}<span class="currency">PHP</span></span><small>汇率 61.191</small></div></td>
    <td><div class="cell-stack"><span><small>固定</small> 1.00</span><span><small>浮动</small> ${money(fee(r))} <small>（2%）</small></span></div></td>
    <td><div class="cell-stack"><span>${r.channel?r.type:'待自动选择'}</span><b>${esc(r.channel||'—')}</b><small>提现方式 ${r.method}</small></div></td>
    <td><div class="cell-stack"><span><small>扣除</small> <b>${(r.amount*10000).toLocaleString('en-US')}</b></span><small>扣除前 103,498,975</small><small>扣除后 ${(103498975-r.amount*10000).toLocaleString('en-US')}</small></div></td>
    <td><div class="cell-stack"><span>${esc(r.name)}</span><small>收款账号 ${r.account}</small><small>联系电话 ${r.phone}</small></div></td>
    <td><div class="cell-stack"><span>审核人 ${r.auditBy}</span><small>${r.auditTime}</small><small>备注 ${esc(r.note||'—')}</small></div></td>
    <td class="pin-actions"><div class="row-actions"><button class="text-btn" data-action="detail" data-key="${r.key}">详情</button>${r.status==='待审核'?`<button class="text-btn" data-action="initial-one" data-key="${r.key}">初审</button>`:r.status==='打款失败'?`<button class="text-btn" data-action="review-one" data-key="${r.key}">复审</button>`:''}</div></td>
  </tr>`).join(''):'<tr><td colspan="12" class="empty">没有符合条件的提现订单，请调整筛选条件。</td></tr>';
  $('#list-count').textContent=`${view.length} 笔`;$('#list-total').textContent=`共 ${view.length} 条 · 状态以最近一次查询为准`;
  tableScroll.scrollTop=top;tableScroll.scrollLeft=left;renderSummary();renderSelection();
}
function renderSelection() {
  const chosen=rows.filter(r=>selected.has(r.key));
  $('#selected-label').textContent=chosen.length?`已选 ${chosen.length} 笔`:'';
  $('#batch-initial').disabled=!chosen.length;$('#batch-review').disabled=!chosen.length;
  let hint='初审可跨提现方式批量处理；复审必须是同一提现方式。',err=false;
  if(chosen.length) {
    if(chosen.every(r=>r.status==='待审核')) hint=`已选 ${chosen.length} 笔待审核订单，可批量初审（允许不同提现方式）。`;
    else if(chosen.every(r=>r.status==='打款失败')&&new Set(chosen.map(r=>r.method)).size===1) hint=`已选 ${chosen.length} 笔 ${chosen[0].method} 打款失败订单，可批量复审。`;
    else if(chosen.every(r=>r.status==='打款失败')) {hint='复审必须选择同一提现方式的订单，请调整勾选。';err=true;}
    else {hint='所选订单状态不同，请分别选择待审核订单初审，或打款失败订单复审。';err=true;}
  }
  $('#selection-hint').textContent=hint;$('#selection-hint').classList.toggle('error',err);
  const eligible=visibleRows().filter(r=>['待审核','打款失败'].includes(r.status));
  $('#select-all-main').checked=!!eligible.length&&eligible.every(r=>selected.has(r.key));$('#select-all-main').indeterminate=eligible.some(r=>selected.has(r.key))&&!$('#select-all-main').checked;
}
function applyFilters() {
  filter={order:$('#f-order').value.trim(),upstream:$('#f-upstream').value.trim(),type:$('#f-type').value,channel:$('#f-channel').value,method:$('#f-method').value,user:$('#f-user').value.trim(),status:$('#f-status').value,country:$('#f-country').value.trim(),start:$('#f-start').value,end:$('#f-end').value};selected.clear();renderList();
}
function resetFilters() {$('#filter-form').reset();filter={status:''};selected.clear();renderList();}
function openDrawer(mode, keys) {
  const batch=rows.filter(r=>keys.includes(r.key));
  if(!batch.length) return toast('请先选择需要处理的订单。');
  const expect=mode==='initial'?'待审核':'打款失败';
  if(batch.some(r=>r.status!==expect))return toast(`${mode==='initial'?'初审':'复审'}仅支持${expect}订单，请调整勾选。`);
  if(mode==='review'&&new Set(batch.map(r=>r.method)).size!==1)return toast('批量复审必须是同一个提现方式，请调整勾选。');
  lastFocus=document.activeElement;clearInterval(ticker);
  drawer={mode,keys:[...keys],selected:new Set(keys),form:{decision:'pass',channel:'auto',rename:'no',reason:'',note:''},submitted:false,notice:'',nextAt:Date.now()+30000,last:clockText(),busy:false};
  $('#drawer-layer').hidden=false;document.body.style.overflow='hidden';renderDrawer();
  ticker=setInterval(()=>{if(!drawer)return;const n=Math.max(0,Math.ceil((drawer.nextAt-Date.now())/1000));const el=$('#refresh-countdown');if(el)el.textContent=n;if(n===0)refreshBatch(false);},1000);
  $('#drawer-layer .icon-button').focus();
}
function batchRows() {return drawer?drawer.keys.map(k=>rows.find(r=>r.key===k)):[];}
function eligible(r) {return drawer&&r.status===(drawer.mode==='initial'?'待审核':'打款失败');}
function renderDrawer() {
  const review=drawer.mode==='review';
  $('#drawer-layer').innerHTML=`<section class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><header class="drawer-header"><div><h2 id="drawer-title">${review?'提现复审':'提现初审'}${review?`<span class="badge pending">${batchRows()[0].method}</span>`:''}</h2><p>${review?'处理打款失败订单 · 同一提现方式，可选择本次打款渠道':'处理待审核订单 · 支持不同提现方式，逐笔自动选择渠道'}</p></div><button class="icon-button" data-action="close-drawer" aria-label="关闭审核抽屉">×</button></header><div class="drawer-body"><div id="batch-summary" class="batch-summary"></div><div id="batch-notice"></div><section class="audit-form"><div class="section-title"><h3>本次处理</h3><small>仅作用于当前勾选的订单</small></div><div id="audit-fields"></div><div id="form-error" class="form-error" role="alert"></div></section><section><div class="section-title"><h3>本批订单 <small id="batch-total"></small></h3><div class="refresh-tools"><small>每 <b>30</b> 秒刷新 · <span id="refresh-countdown" class="countdown">30</span>s 后刷新</small><button data-action="refresh-batch">↻ 手动刷新</button></div></div><div class="batch-table-scroll"><table class="batch-table"><thead><tr><th><input type="checkbox" id="select-all-batch" aria-label="选择本批符合条件的订单"></th><th>当前订单号 / 用户</th><th>提现方式</th><th>提现 USD</th><th>最近打款渠道</th><th>次数</th><th>当前状态</th><th>失败原因 / 处理结果</th><th>本次提交</th><th>操作</th></tr></thead><tbody id="batch-rows"></tbody></table></div><p class="batch-caption">本批订单始终保留，状态变化不会移除记录。${review?'仅打款失败订单可重新勾选复审。':'仅待审核订单可再次勾选初审；打款失败请返回列表进入复审。'}<br>模拟打款约 8 秒后产生结果，可手动刷新，或等待 30 秒自动刷新查看。</p></section></div><footer class="drawer-footer"><div class="footer-meta">最近刷新：<strong id="last-refreshed"></strong><br>提交后抽屉保持打开，请核对每笔订单的实际结果。</div><div class="footer-buttons"><span id="submit-selection"></span><button data-action="close-drawer">关闭</button><button id="submit-audit" class="primary" data-action="submit-audit">提交${review?'复审':'初审'}</button></div></footer></section>`;
  renderForm();renderBatch();
}
function renderForm() {
  const review=drawer.mode==='review',f=drawer.form;
  $('#audit-fields').innerHTML=`<div class="form-line"><div class="field-title"><span class="required">*</span>处理结果</div><div class="radio-set"><label><input type="radio" name="decision" value="pass" ${f.decision==='pass'?'checked':''}>审核通过${review?'，继续打款':''}</label><label><input type="radio" name="decision" value="refund" ${f.decision==='refund'?'checked':''}>${review?'退款':'不通过并退款'}</label></div></div>
  ${f.decision==='pass'?(review?`<div class="form-grid"><div class="form-line"><div class="field-title">提现渠道</div><div class="field-content"><select id="audit-channel"><option value="auto">自动选择（按配置优先级）</option>${(channelConfig[batchRows()[0].method]||[]).filter(c=>c.available).map(c=>`<option value="${c.name}" ${f.channel===c.name?'selected':''}>${c.name} · ${c.type}</option>`).join('')}</select><div class="helper">仅展示 ${batchRows()[0].method} 已配置且可用的渠道，仅影响本次勾选订单。</div></div></div><div class="form-line"><div class="field-title">修改订单号</div><div class="field-content"><div class="radio-set"><label><input type="radio" name="rename" value="yes" ${f.rename==='yes'?'checked':''}>是</label><label><input type="radio" name="rename" value="no" ${f.rename==='no'?'checked':''}>否</label></div><div class="helper">选择“是”，后台为每笔提交订单分别自动换号。</div></div></div></div>`:`<div class="form-line"><div class="field-title">打款渠道</div><div class="field-content"><div class="helper" style="padding-top:4px">审核通过后，程序按每笔订单的提现方式配置及渠道优先级自动选择。</div></div></div>`):`<div class="form-line"><div class="field-title">${review?'<span class="required">*</span>退款理由':'驳回原因'}</div><div class="field-content"><textarea id="audit-reason" maxlength="500" placeholder="${review?'请输入退款理由，用户可见（必填）':'请输入驳回原因，沿用现有初审规则'}">${esc(f.reason)}</textarea><div class="helper">${review?'<span class="user-visible">用户可见</span> 请填写清晰、可理解的退款原因。':'初审不通过退款完成后，状态为“驳回已退款”。'}</div></div></div>`}
  <div class="form-line"><div class="field-title">内部备注</div><div class="field-content"><input id="audit-note" maxlength="500" placeholder="选填，仅管理端可见" value="${esc(f.note)}"></div></div>`;
}
function renderBatch() {
  if(!drawer)return;
  const list=batchRows(), chosen=list.filter(r=>drawer.selected.has(r.key));
  $('#batch-summary').innerHTML=`<div class="summary-box"><small>本批订单</small><strong>${list.length}<em>笔 · 始终保留</em></strong></div><div class="summary-box highlight"><small>当前勾选金额</small><strong>${money(chosen.reduce((s,r)=>s+r.amount,0))}<em>USD</em></strong></div><div class="summary-box"><small>打款中 / 打款失败</small><strong>${list.filter(r=>r.status==='打款中').length} <em>/</em> ${list.filter(r=>r.status==='打款失败').length}<em>笔</em></strong></div><div class="summary-box"><small>${drawer.mode==='review'?'本批提现方式':'本批提现方式（可不同）'}</small><strong>${[...new Set(list.map(r=>r.method))].join(' / ')}</strong></div>`;
  $('#batch-notice').innerHTML=drawer.notice?`<div class="notice ${drawer.submitted?'success':'warning'}">${esc(drawer.notice)}</div>`:`<div class="notice">${drawer.mode==='review'?'打款失败即需要复审。可退款，或调整本次渠道及订单号后继续打款。':'请核对本批订单；初审通过后自动打款，不通过则退款。'} 提交后抽屉不自动关闭。</div>`;
  const scroll=$('.batch-table-scroll'), top=scroll.scrollTop,left=scroll.scrollLeft;
  $('#batch-rows').innerHTML=list.map(r=>`<tr data-key="${r.key}"><td><input type="checkbox" data-batch-key="${r.key}" aria-label="勾选本批订单 ${r.id}" ${drawer.selected.has(r.key)?'checked':''} ${eligible(r)&&!drawer.busy?'':'disabled'}></td><td><button class="text-btn order-link" data-action="detail" data-key="${r.key}">${esc(r.id)}</button>${r.previousIds.length?`<small class="previous-id">上次 ${esc(r.previousIds.at(-1))}</small>`:''}<small class="previous-id">用户 ${r.user}</small></td><td>${r.method}</td><td class="num">${money(r.amount)}</td><td>${esc(r.channel||'自动选择')}</td><td>第 ${r.attempt} 次</td><td>${badge(r.status)}</td><td>${r.reason?`<span class="failure-text">${esc(r.reason)}</span>`:`<span class="result-text">${r.status==='打款中'?'打款处理中，等待结果':r.status==='打款成功'?'打款已完成':r.status==='已退款'?esc(r.refundReason):r.status==='驳回已退款'?'初审驳回，退款已完成':'等待初审'}</span>`}</td><td><span class="result-text">${esc(r.submitResult||'—')}</span></td><td><button class="text-btn" data-action="detail" data-key="${r.key}">详情</button></td></tr>`).join('');
  scroll.scrollTop=top;scroll.scrollLeft=left;
  $('#batch-total').textContent=`${list.length} 笔`;$('#last-refreshed').textContent=drawer.last;
  $('#submit-selection').textContent=`已勾选 ${chosen.length} 笔`;
  $('#submit-audit').disabled=!chosen.length||drawer.busy;
  $('#submit-audit').textContent=drawer.busy?'提交中…':`提交${drawer.mode==='review'?'复审':'初审'}`;
  const can=list.filter(eligible);$('#select-all-batch').checked=!!can.length&&can.every(r=>drawer.selected.has(r.key));$('#select-all-batch').indeterminate=can.some(r=>drawer.selected.has(r.key))&&!$('#select-all-batch').checked;
}
function syncForm(target) {
  if(!drawer)return;
  if(target.name==='decision'){drawer.form.decision=target.value;renderForm();$('#form-error').textContent='';}
  else if(target.name==='rename')drawer.form.rename=target.value;
  else if(target.id==='audit-channel')drawer.form.channel=target.value;
  else if(target.id==='audit-reason')drawer.form.reason=target.value;
  else if(target.id==='audit-note')drawer.form.note=target.value;
}
async function submitAudit() {
  if(!drawer||drawer.busy)return;
  const d=drawer, f={...d.form}, chosen=batchRows().filter(r=>d.selected.has(r.key));
  let error='';
  if(!chosen.length)error='请勾选需要处理的订单。';
  else if(chosen.some(r=>!eligible(r)))error='订单状态已变化，请刷新后重新选择。';
  else if(d.mode==='review'&&new Set(chosen.map(r=>r.method)).size!==1)error='复审必须是同一提现方式。';
  else if(d.mode==='review'&&f.decision==='refund'&&!f.reason.trim())error='请填写退款理由，该理由用户可见。';
  else if(f.decision==='pass'&&chosen.some(r=>!(channelConfig[r.method]||[]).some(c=>c.available&&(f.channel==='auto'||d.mode==='initial'||c.name===f.channel))))error='当前选择没有可用的打款渠道，请调整渠道或选择退款。';
  $('#form-error').textContent=error;if(error){$('#audit-reason')?.classList.add('input-error');return;}
  d.busy=true;renderBatch();
  await new Promise(resolve=>setTimeout(resolve,350));
  if(drawer!==d)return;
  let accepted=0, rejected=0;
  for(const r of chosen) {
    if(r.rejectOnce){r.rejectOnce=false;r.submitResult='提交未受理，请重试';rejected++;continue;}
    const time=clockText();r.auditBy='Nina';r.auditTime=time;r.note=f.note;r.reason='';r.submitResult='已受理';
    if(f.decision==='refund') {
      r.status=d.mode==='initial'?'驳回已退款':'已退款';r.due=null;
      if(d.mode==='review')r.refundReason=f.reason.trim();else r.rejectReason=f.reason.trim();
      r.events.push(event(d.mode==='initial'?'人工初审不通过并退款完成':'复审退款完成',time,'Nina',`${d.mode==='review'?'退款理由（用户可见）':'驳回原因'}：${f.reason.trim()||'—'}\n内部备注：${f.note||'—'}`,'success'));
    } else {
      r.events.push(event(d.mode==='initial'?'人工初审通过':'复审通过',time,'Nina',`${d.mode==='initial'?'逐笔自动选渠道':f.channel==='auto'?'自动选择渠道':'指定渠道：'+f.channel}\n${d.mode==='review'?'修改订单号：'+(f.rename==='yes'?'是':'否')+'\n':''}内部备注：${f.note||'—'}`,'review'));
      if(d.mode==='review'&&f.rename==='yes') {
        const old=r.id;r.previousIds.push(old);r.id=`5031422${String(++idSequence).padStart(11,'0')}`;
        r.events.push(event('修改订单号',time,'后台自动处理','本次复审生成新的订单号','review',{from:old,to:r.id}));
      }
      const cfg=(channelConfig[r.method]||[]).filter(c=>c.available);
      const channel=d.mode==='initial'||f.channel==='auto'?cfg[0]:cfg.find(c=>c.name===f.channel);
      r.channel=channel.name;r.type=channel.type;r.status='打款中';r.attempt++;r.upstream=`UP20261022${++idSequence}`;r.due=Date.now()+8000;
      if(d.mode==='review')r.retries++;
      r.events.push(event(`第 ${r.attempt} 次打款发起`,time,'系统',`实际渠道：${r.channel}\n本次订单号：${r.id}`));
    }
    accepted++;d.selected.delete(r.key);selected.delete(r.key);
  }
  d.busy=false;d.submitted=true;d.last=clockText();d.nextAt=Date.now()+30000;
  d.notice=`本次 ${accepted} 笔已受理${rejected?`，${rejected} 笔提交未受理，已保留勾选供核对后重试`:''}。${f.decision==='pass'?'订单已进入打款中，请刷新查看实际结果。':'退款已完成，请查看每笔状态。'} 本批订单保留，抽屉不会自动关闭。`;
  renderBatch();renderList();toast(rejected?'批量提交部分未受理，请核对逐笔结果。':'提交成功，抽屉保持打开。');
}
function settleDue(force=false) {
  for(const r of rows) {
    if(r.status!=='打款中'||!r.due||(!force&&Date.now()<r.due))continue;
    const fails=r.failFirstRetry&&r.retries===1;
    r.status=fails?'打款失败':'打款成功';r.reason=fails?'渠道余额不足，请复审后调整渠道':'';r.due=null;
    if(!fails)r.paidAt=clockText();
    r.events.push(event(`第 ${r.attempt} 次打款${fails?'失败':'成功'}`,clockText(),'渠道回调',fails?r.reason:`实际渠道：${r.channel}\n实际打款 ${money(payout(r))} PHP`,fails?'failed':'success'));
  }
}
function refreshBatch(manual=true) {
  if(!drawer)return;
  settleDue();let changed=false;
  for(const key of drawer.selected)if(!eligible(rows.find(r=>r.key===key))){drawer.selected.delete(key);changed=true;}
  drawer.last=clockText();drawer.nextAt=Date.now()+30000;renderBatch();renderList();if(changed)toast('部分订单状态已变化，已取消不再符合条件的勾选。');else if(manual)toast('已刷新本批订单状态。');
}
function closeDrawer() {if(drawer?.busy)return toast('正在提交，请等待提交结果。');clearInterval(ticker);ticker=null;drawer=null;$('#drawer-layer').hidden=true;$('#drawer-layer').innerHTML='';document.body.style.overflow='';lastFocus?.focus();renderList();}

function pair(key,value,wide=false,raw=false) {return `<div class="info-pair ${wide?'wide':''}"><div class="info-key">${esc(key)}</div><div class="info-value">${raw?value:esc(value||'—')}</div></div>`;}
function section(title,content) {return `<section class="info-section"><h3>${title}</h3><div class="info-grid">${content}</div></section>`;}
function copyButton(text) {return `<button class="copy-button" data-action="copy" data-copy="${esc(text)}" aria-label="复制 ${esc(text)}">复制</button>`;}
function openDetail(key) {
  detailFocus=document.activeElement;detailKey=key;$('#detail-layer').hidden=false;document.body.style.overflow='hidden';renderDetail();$('#detail-layer .icon-button').focus();
}
function renderDetail() {
  const r=rows.find(r=>r.key===detailKey);if(!r)return;
  const infoScroll=$('.detail-info')?.scrollTop||0,historyScroll=$('.detail-history')?.scrollTop||0;
  const base=pair('流水号 / 当前订单号',`${esc(r.id)} ${copyButton(r.id)}`,true,true)+pair('上游订单号',r.upstream||'—',true)+pair('用户 ID',r.user)+pair('国家代码',r.country)+pair('提现状态',badge(r.status),false,true)+pair('发起时间',r.created)+pair('打款时间',r.paidAt)+pair('审核时间',r.auditTime);
  const amounts=pair('提现金额',`${money(r.amount)} USD`)+pair('到账金额',`${money(net(r))} USD`)+pair('扣除钻石',`${(r.amount*10000).toLocaleString('en-US')} 钻石`)+pair('扣除前钻石','103,498,975 钻石')+pair('扣除后钻石',`${(103498975-r.amount*10000).toLocaleString('en-US')} 钻石`)+pair('固定手续费','1.00 USD')+pair('手续费费率','2%')+pair('浮动手续费',`${money(fee(r))} USD`)+pair('打款货币汇率','61.191 PHP / USD')+pair('实际打款金额',`${money(payout(r))} PHP`);
  let pay=pair('渠道类型',r.channel?r.type:'—')+pair('提现渠道',r.channel||'待自动选择')+pair('提现方式',r.method)+pair('打款货币代码','PHP')+pair('收款账户',r.account)+pair('账户类型',r.method==='BANK'?'银行账户':'电子钱包')+pair('账户验证数字','—')+pair('USDT 地址','—')+pair('币安 ID','—')+pair('收款人姓名',r.name)+pair('名',r.name.split(' ')[0])+pair('中间名','—')+pair('姓',r.name.split(' ')[1])+pair('收款电话',r.phone)+pair('邮箱','—')+pair('银行代码',r.method==='BANK'?'DEMO-PH':'—')+pair('银行名称',r.method==='BANK'?'示例银行':'—');
  for(const key of ['银行网点号','银行城市','银行代理账号','证明类型','识别号码','识别号码有效期','出生日期','地址','城市','州','邮编'])pay+=pair(key,'—');
  if((pay.match(/info-pair/g)||[]).length%2)pay+=pair('补充信息','—');
  const notes=pair('驳回原因',r.rejectReason||'—',true)+pair('退款理由（用户可见）',r.refundReason||'—',true)+pair('审核人',r.auditBy)+pair('内部备注',r.note||'—');
  $('#detail-layer').innerHTML=`<section class="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title"><header class="detail-header"><div><h2 id="detail-title">提现订单详情</h2><p>当前订单号 ${esc(r.id)} ${copyButton(r.id)} <span style="margin:0 10px">·</span> 用户 ${r.user} <span class="country-tag">${r.country}</span></p></div><div class="head-actions">${badge(r.status)}<button data-action="refresh-detail">↻ 刷新</button><button class="icon-button" data-action="close-detail" aria-label="关闭订单详情">×</button></div></header><div class="detail-layout"><div class="detail-info">${section('基础信息',base)}${section('金额信息',amounts)}${section('渠道与收款信息',pay)}${section('备注信息',notes)}</div><aside class="detail-history"><div class="timeline-head"><h3>订单历史记录</h3><span class="only-demo">${r.events.length} 条事件</span></div><p class="timeline-note">按发生时间排列 · 完整保留每次审核与打款<br>累计打款 <b>${r.attempt}</b> 次，订单号变更 <b>${r.previousIds.length}</b> 次</p><ol class="timeline">${r.events.map(e=>`<li class="${e.tone}"><div class="event-heading"><strong>${esc(e.title)}</strong><time>${esc(e.time.slice(11))}</time></div><div class="event-meta">${esc(e.time.slice(0,10))} · ${esc(e.actor)}</div>${e.content?`<div class="event-content">${esc(e.content)}</div>`:''}${e.change?`<div class="event-change"><b>修改订单号</b><br>原：${esc(e.change.from)} ${copyButton(e.change.from)}<br><span class="new-id">新：${esc(e.change.to)} ${copyButton(e.change.to)}</span></div>`:''}</li>`).join('')}</ol></aside></div><footer class="detail-footer"><span>左右区域独立滚动 · 订单号变化后仍保留同一笔提现的完整历史</span><div class="detail-actions">${r.status==='待审核'?`<button class="text-btn" data-action="detail-initial">初审此订单</button>`:r.status==='打款失败'?`<button class="text-btn" data-action="detail-review">复审此订单</button>`:''}<button data-action="close-detail">关闭</button></div></footer></section>`;
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
  if(action==='status'){$('#f-status').value=btn.dataset.status;filter.status=btn.dataset.status;selected.clear();renderList();}
  else if(action==='reset-filter')resetFilters();
  else if(action==='batch-initial')openDrawer('initial',[...selected]);
  else if(action==='batch-review')openDrawer('review',[...selected]);
  else if(action==='initial-one')openDrawer('initial',[key]);
  else if(action==='review-one')openDrawer('review',[key]);
  else if(action==='close-drawer')closeDrawer();
  else if(action==='submit-audit')submitAudit();
  else if(action==='refresh-batch')refreshBatch();
  else if(action==='detail')openDetail(key);
  else if(action==='close-detail')closeDetail();
  else if(action==='refresh-detail'){settleDue();renderDetail();if(drawer)renderBatch();renderList();toast('已刷新订单详情及历史。');}
  else if(action==='refresh-list'){settleDue();for(const k of selected)if(!['待审核','打款失败'].includes(rows.find(r=>r.key===k).status))selected.delete(k);renderList();toast('已刷新订单列表。');}
  else if(action==='copy')copy(btn.dataset.copy);
  else if(action==='export')exportRows();
  else if(action==='detail-initial'||action==='detail-review'){const k=detailKey;if(drawer){closeDetail();toast('请先关闭当前审核抽屉，再从列表处理该订单。');}else{closeDetail();openDrawer(action==='detail-initial'?'initial':'review',[k]);}}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.mainKey){if(t.checked)selected.add(t.dataset.mainKey);else selected.delete(t.dataset.mainKey);renderSelection();}
  else if(t.id==='select-all-main'){for(const r of visibleRows().filter(r=>['待审核','打款失败'].includes(r.status))){if(t.checked)selected.add(r.key);else selected.delete(r.key);}renderList();}
  else if(t.dataset.batchKey&&drawer){if(t.checked)drawer.selected.add(t.dataset.batchKey);else drawer.selected.delete(t.dataset.batchKey);renderBatch();}
  else if(t.id==='select-all-batch'&&drawer){for(const r of batchRows().filter(eligible)){if(t.checked)drawer.selected.add(r.key);else drawer.selected.delete(r.key);}renderBatch();}
  else syncForm(t);
});
document.addEventListener('input',e=>{if(['audit-reason','audit-note'].includes(e.target.id))syncForm(e.target);if(e.target.id==='audit-reason'){e.target.classList.remove('input-error');$('#form-error').textContent='';}});
$('#filter-form').addEventListener('submit',e=>{e.preventDefault();applyFilters();});
document.addEventListener('keydown',e=>{
  const container=detailKey?$('.detail-dialog'):drawer?$('.drawer'):null;
  if(e.key==='Escape'){if(detailKey)closeDetail();else if(drawer)closeDrawer();}
  if(e.key==='Tab'&&container){const els=[...container.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(el=>el.getClientRects().length);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});

// 场景入口用于静态评审图与原型导航复现；只操作本地示例。
async function loadScene(scene) {
  if(scene==='initial'||scene==='initial-refund'||scene==='initial-submitted'||scene==='initial-refunded') {
    filter.status='待审核';$('#f-status').value=filter.status;renderList();openDrawer('initial',['p1','p2','p3']);
    if(scene.includes('refund')){drawer.form.decision='refund';drawer.form.reason='提现资料核验未通过。';renderForm();}
    if(scene==='initial-submitted'||scene==='initial-refunded')await submitAudit();
  } else if(['review','review-refund','review-submitted','review-result','review-refunded','review-partial','review-final'].includes(scene)) {
    filter.status='打款失败';$('#f-status').value=filter.status;renderList();openDrawer('review',['f1','f2','f3']);
    drawer.form.rename='yes';drawer.form.channel='pay_roll';drawer.form.note='核对收款信息后重新打款。';
    if(scene.includes('refund')){drawer.form.decision='refund';drawer.form.reason='收款渠道暂不可用，请核对收款信息后重新申请。';}
    renderForm();
    if(['review-submitted','review-result','review-refunded','review-partial','review-final'].includes(scene)) {
      if(scene==='review-partial')rows.find(r=>r.key==='f3').rejectOnce=true;
      await submitAudit();
      if(scene==='review-result'||scene==='review-final'){settleDue(true);refreshBatch(false);}
      if(scene==='review-final'){drawer.selected.add('f2');renderBatch();await submitAudit();settleDue(true);refreshBatch(false);}
    }
  } else if(scene==='detail'||scene==='detail-end') {
    openDetail('history');
    if(scene==='detail-end'){$('.detail-history').scrollTop=$('.detail-history').scrollHeight;$('.detail-info').scrollTop=$('.detail-info').scrollHeight;}
  } else if(scene==='mixed-review') {filter.status='打款失败';$('#f-status').value=filter.status;selected=new Set(['f1','fb']);renderList();}
  else if(scene==='failed'){filter.status='打款失败';$('#f-status').value=filter.status;renderList();}
}
seed();$('#f-status').innerHTML='<option value="">全部状态</option>'+STATUS.map(s=>`<option>${s}</option>`).join('');filter={status:''};renderList();
window.prototypeReady=loadScene(new URLSearchParams(location.search).get('scene')||'list');
window.demo={get orders(){return rows},get drawer(){return drawer},loadScene,settleDue};

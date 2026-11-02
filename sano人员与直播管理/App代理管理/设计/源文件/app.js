'use strict';
(() => {
  const $=s=>document.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const DAY=86400000, CURRENT='2026-10-26', LAST='2026-10-19', CUSTOM='2026-10-12';
  const date=s=>new Date(s+'T00:00:00Z'), iso=d=>d.toISOString().slice(0,10);
  const plus=(s,n)=>iso(new Date(+date(s)+n*DAY));
  const monday=s=>plus(s,-((date(s).getUTCDay()+6)%7));
  const end=s=>plus(s,6), range=s=>s+' — '+end(s);
  const money=n=>n==null?'—':Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const hours=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
  const seeds={
    [CURRENT]:[['156820','Mila',200,1,1,120.25,75,35.25],['189342','Luna',135,1,0,80.5,45.5,25],['207615','Sofia',0,0,0,0,0,0]],
    [LAST]:[['156820','Mila',2185,7,6,1258.4,760.2,390],['189342','Luna',1690,6,4,860.6,530.6,280],['207615','Sofia',0,0,0,0,0,0]],
    [CUSTOM]:[['156820','Mila',1930,6,5,980,600,300],['189342','Luna',1545,5,3,725,420,250],['207615','Sofia',0,0,0,0,0,0]]
  };
  const sceneDefs=[['agency','公会管理入口'],['current','本周 · 直播达成'],['last','上周 · 直播达成'],['custom','自定义单周'],['income-current','本周 · 收入列'],['income-last','上周 · 收入列'],['income-custom','自定义周 · 收入列'],['picker-current','周选择器 · 本周来源'],['picker-current-pending','周选择器 · 本周待确认'],['picker-last','周选择器 · 上周来源'],['picker-last-pending','周选择器 · 上周待确认'],['picker-custom','周选择器 · 自定义来源'],['picker-custom-pending','周选择器 · 自定义待确认'],['empty','无当前有效成员'],['inactive','有成员 · 无业务'],['error','加载失败与重试'],['loading','加载中'],['partial','部分指标统计中'],['many','多成员 · 表格滚动与分批加载'],['page-error','后续批次失败与重试']];
  const dialog=$('#week-dialog');
  const app=$('#app');
  let state, token=0, opener, toastTimer;
  const query=new URLSearchParams(location.search);
  if(query.get('capture')==='1')document.body.classList.add('capture');
  $('#scene-select').innerHTML=sceneDefs.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
  function snapshotRows(){
    if(state.scenario==='empty')return [];
    let rows=structuredClone(seeds[state.applied]||seeds[CUSTOM]);
    if(!seeds[state.applied]){
      const seed=Math.abs(Math.round((+date(state.applied)-+date(CUSTOM))/DAY/7));
      rows=rows.map((r,i)=>i===2?r:[r[0],r[1],Math.max(0,r[2]-seed*11),Math.max(0,r[3]-seed%3),Math.max(0,r[4]-seed%3),+(r[5]/(1+seed/10)).toFixed(2),+(r[6]/(1+seed/10)).toFixed(2),+(r[7]/(1+seed/10)).toFixed(2)]);
    }
    if(['many','page-error'].includes(state.scenario)){
      for(let i=0;i<24;i++)rows.push([String(310000+i),'Host '+String(i+1).padStart(2,'0'),Math.min(960,480+i*27),state.applied===CURRENT?1:3+i%5,state.applied===CURRENT?i%2:1+i%3,+(30+i*8.6).toFixed(2),+(15+i*4.2).toFixed(2),+(8+i*2.3).toFixed(2)]);
    }
    if(state.scenario==='inactive')rows=rows.map(r=>[r[0],r[1],0,0,0,0,0,0]);
    if(state.scenario==='partial'){rows[0][4]=null;rows[0][7]=null;}
    return rows.sort((a,b)=>b[5]-a[5]||Number(a[0])-Number(b[0]));
  }
  function totals(rows){return [5,6,7].map(i=>rows.some(r=>r[i]==null)?null:rows.reduce((s,r)=>s+r[i],0));}
  const statusbar=()=>'<div class="statusbar"><span>9:41</span><span>5G ▰</span></div>';
  const header=title=>statusbar()+`<header class="topbar"><button class="back" data-action="back" aria-label="返回">‹</button><h1>${title}</h1></header>`;
  function tabKind(week){return week===CURRENT?'current':week===LAST?'last':'custom';}
  function render(){
    window.prototypeReady=false;
    if(state.page==='agency'){
      const tools=[['我的主播','402'],['子代理','2'],['邀请主播','person'],['邀请公会','person'],['移除主播','person'],['申请','◷'],['公会通知','♧'],['超级主播','person'],['公会榜单','▦'],['优质主播','person']];
      app.innerHTML=header('公会管理')+`<section class="content"><div class="guild-info">公会名称: EIGHT EMPIRE AGENCY<br>公会ID: 135708</div><section class="guild-tools"><h2>主播管理</h2><div class="tool-grid">${tools.map(([label,icon],i)=>`<button class="tool" data-action="${i===9?'open-hosts':'existing'}"><span class="${i<2?'number':'icon '+(icon==='person'?'person':'')}">${i<2?icon:icon==='person'?'<i class="badge">'+(i===7||i===9?'★':i===4?'−':'+')+'</i>':icon}</span><span class="label">${label}</span></button>`).join('')}</div></section></section><div class="home-indicator"></div>`;
      bind();window.prototypeReady=true;return;
    }
    const week=state.status==='ready'?state.applied:state.target;
    const active=tabKind(week), busy=state.status==='loading';
    const rows=snapshotRows();
    const sums=totals(rows);
    const tabs=`<div class="tabs" aria-label="统计周"><button data-action="current" ${busy?'disabled':''} class="${active==='current'?'active':''}">本周</button><button data-action="last" ${busy?'disabled':''} class="${active==='last'?'active':''}">上周</button><button data-action="picker" ${busy?'disabled':''} class="${active==='custom'?'active':''}" aria-haspopup="dialog">自定义 ▾</button></div>`;
    const dates=`<div class="date-range">${range(week)}</div><div class="time-meta"><span>SANO Time · UTC+8</span><span>${week===CURRENT?'数据截至 10-26 18:00':'数据已更新至该周末'}</span></div>`;
    let content='';
    if(state.status==='error')content=`<section class="error-panel"><span class="mark">!</span><h2>数据加载失败</h2><p>请检查网络后重试</p><button class="primary" data-action="retry">重新加载</button></section>`;
    else if(busy)content=`<section class="summary loading-summary" aria-label="收入加载中"><span class="skeleton"></span><span class="skeleton big"></span><span class="skeleton"></span></section><p class="loading-note">正在加载本周数据…</p>${table(rows.slice(0,3),true)}`;
    else{
      content=`<section class="summary" aria-label="收入汇总"><small>总收入（$）</small><div class="total" data-total="total">${money(sums[0])}</div><div class="split"><div><small>普通礼物收入（$）</small><strong data-total="normal">${money(sums[1])}</strong></div><div><small>幸运礼物收入（$）</small><strong data-total="lucky" class="${sums[2]==null?'pending':''}">${sums[2]==null?'统计中':money(sums[2])}</strong></div></div></section><div class="list-heading"><span>按当前有效直属名单统计</span><span>${rows.length}位主播</span></div>`;
      if(state.scenario==='inactive')content+='<p class="notice">所选周暂无直播和收入记录</p>';
      if(state.scenario==='partial')content+='<p class="notice">部分指标统计中，完整结果更新后展示</p>';
      content+=table(rows.slice(0,state.visible));
      if(rows.length){
        if(state.visible<rows.length)content+=`<div class="list-footer">${state.pageFailed?'本批加载失败，已展示结果及汇总保留<br>':''}<button data-action="more" ${state.moreBusy?'disabled':''}>${state.moreBusy?'加载中…':state.pageFailed?'重试加载':'加载更多'}</button><br>已展示 ${Math.min(state.visible,rows.length)} / ${rows.length} 位主播</div>`;
        else content+='<div class="list-footer">已展示全部主播</div>';
      }
      content+='<p class="help">左右滑动表格，查看主播完整数据。<br>高峰达标天数：满足高峰时间段开播条件的天数。</p><button class="refresh" data-action="refresh">刷新数据</button>';
    }
    app.innerHTML=header('优质主播')+`<section class="content">${tabs}${dates}${content}</section><div class="home-indicator"></div>`;
    bind();window.prototypeReady=true;
  }
  function table(rows,loading=false){
    const heads=[['ID',''],['昵称',''],['总时长','小时:分钟'],['开播天数','天'],['高峰达标天数','天'],['总收入','$'],['普通礼物收入','$'],['幸运礼物收入','$']];
    return `<section class="table-frame"><div class="table-scroll" tabindex="0" role="region" aria-label="主播数据表，可横向及纵向滚动"><table class="host-table"><colgroup><col class="id"><col class="nick"><col class="time"><col class="days"><col class="peak"><col class="income"><col class="income"><col class="income"></colgroup><thead><tr>${heads.map(([h,u])=>`<th scope="col">${h}${u?'<small>（'+u+'）</small>':''}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr data-host="${r[0]}">${[r[0],r[1],hours(r[2]),r[3],r[4],money(r[5]),money(r[6]),money(r[7])].map((v,i)=>`<td title="${esc(v==null?'统计中':v)}">${loading?'<span class="skeleton cell"></span>':esc(v==null?'—':v)}</td>`).join('')}</tr>`).join('')}</tbody></table>${!rows.length&&!loading?'<div class="table-empty">暂无当前有效的直属优质主播<p>名单更新后，可刷新查看</p></div>':''}</div>${rows.length?'<div class="scroll-controls"><button data-action="work-cols" class="active">← 直播达成</button><span class="scroll-track"><span class="scroll-thumb" style="display:block"></span></span><button data-action="income-cols">收入列 →</button></div>':''}</section>`;
  }
  function bind(){
    app.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.action,b)));
    const viewport=$('.table-scroll');if(!viewport)return;
    viewport.scrollLeft=state.x;viewport.scrollTop=state.y;
    const onscroll=()=>{
      if(!viewport.isConnected||state.page!=='hosts')return;
      state.x=viewport.scrollLeft;state.y=viewport.scrollTop;
      const p=viewport.scrollLeft/Math.max(1,viewport.scrollWidth-viewport.clientWidth);
      const thumb=$('.scroll-thumb');if(thumb)thumb.style.transform=`translateX(${p*66.666}%)`;
      $('[data-action="work-cols"]')?.classList.toggle('active',p<.5);
      $('[data-action="income-cols"]')?.classList.toggle('active',p>=.5);
    };
    viewport.addEventListener('scroll',onscroll,{passive:true});onscroll();
    let drag=null;
    viewport.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={start:e.clientX,x:viewport.scrollLeft};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');});
    viewport.addEventListener('pointermove',e=>{if(drag){viewport.scrollLeft=drag.x+drag.start-e.clientX;}});
    const finish=()=>{drag=null;viewport.classList.remove('dragging');};viewport.addEventListener('pointerup',finish);viewport.addEventListener('pointercancel',finish);
  }
  function act(action,button){
    if(action==='existing'){toast('现有入口，本次不展开');return;}
    if(action==='back'){if(state.page==='agency'){toast('已返回公会管理');return;}const viewport=$('.table-scroll');if(viewport){state.x=viewport.scrollLeft;state.y=viewport.scrollTop;}state.page='agency';render();return;}
    if(action==='open-hosts'){state.page='hosts';render();return;}
    if(action==='picker'){openPicker(button);return;}
    if(action==='current'||action==='last'){loadWeek(action==='current'?CURRENT:LAST);return;}
    if(action==='retry'){state.scenario='normal';loadWeek(state.target);return;}
    if(action==='refresh'){loadWeek(state.applied);return;}
    if(action==='more'){more();return;}
    if(action==='work-cols'||action==='income-cols'){
      const viewport=$('.table-scroll');viewport.scrollTo({left:action==='income-cols'?viewport.scrollWidth:0,behavior:'smooth'});
    }
  }
  async function loadWeek(week){
    const request=++token;state.target=week;state.status='loading';render();
    await new Promise(r=>setTimeout(r,260));if(request!==token)return;
    state.applied=week;state.status='ready';state.visible=10;state.x=0;state.y=0;state.moreBusy=false;state.pageFailed=false;render();window.scrollTo({top:0});
  }
  async function more(){
    if(state.moreBusy)return;const request=token;
    state.moreBusy=true;render();await new Promise(r=>setTimeout(r,260));if(request!==token)return;
    state.moreBusy=false;
    if(state.scenario==='page-error'&&!state.failedOnce){state.failedOnce=true;state.pageFailed=true;render();return;}
    state.pageFailed=false;state.visible+=10;render();
  }
  function openPicker(button){
    opener=button||$('[data-action="picker"]');state.candidate=state.applied;state.month=state.applied.slice(0,7);renderPicker();dialog.showModal();
  }
  function renderPicker(){
    const first=state.month+'-01',start=monday(first);
    const nextMonth=new Date(Date.UTC(Number(state.month.slice(0,4)),Number(state.month.slice(5)),1));
    const lastDay=iso(new Date(+nextMonth-DAY));
    const count=Math.ceil((Math.round((+date(lastDay)-+date(start))/DAY)+1)/7);
    const maxMonth=end(CURRENT).slice(0,7);
    dialog.innerHTML=`<div class="picker-body"><div class="handle"></div><header class="picker-head"><h2 id="picker-title">选择自然周</h2><button class="cancel" data-picker="cancel">取消</button></header><p class="picker-intro">每次仅选择一个完整自然周</p><div class="month-nav"><button data-picker="prev" aria-label="上个月">‹</button><input type="month" id="month-input" aria-label="选择月份" value="${state.month}" max="${maxMonth}"><button data-picker="next" aria-label="下个月" ${state.month>=maxMonth?'disabled':''}>›</button></div><div class="weekdays">${['一','二','三','四','五','六','日'].map(d=>'<span>'+d+'</span>').join('')}</div><div class="calendar">${Array.from({length:count},(_,i)=>{const week=plus(start,i*7);return `<button class="week-row ${week===state.candidate?'selected':''}" data-week="${week}" aria-label="选择 ${week} 至 ${end(week)}" aria-pressed="${week===state.candidate}" ${week>CURRENT?'disabled':''}>${Array.from({length:7},(_,j)=>{const d=plus(week,j);return `<span class="${d.slice(0,7)!==state.month?'outside':''}">${Number(d.slice(8))}</span>`;}).join('')}</button>`;}).join('')}</div><div class="selected-week"><small>已选择 · 周一至周日</small><strong>${range(state.candidate)}</strong></div><p class="picker-note">按 SANO Time（UTC+8）划分自然周</p><button class="primary confirm" data-picker="confirm">确认</button><div class="home-indicator"></div></div>`;
    dialog.querySelectorAll('[data-week]').forEach(b=>b.onclick=()=>{state.candidate=b.dataset.week;renderPicker();dialog.querySelector(`[data-week="${state.candidate}"]`)?.focus();});
    dialog.querySelectorAll('[data-picker]').forEach(b=>b.onclick=()=>{
      const action=b.dataset.picker;
      if(action==='cancel'){closePicker();return;}
      if(action==='confirm'){const week=state.candidate;closePicker();loadWeek(week);return;}
      const d=new Date(Date.UTC(Number(state.month.slice(0,4)),Number(state.month.slice(5))-1+(action==='prev'?-1:1),1));state.month=iso(d).slice(0,7);renderPicker();
    });
    $('#month-input').onchange=e=>{const value=e.target.value;if(/^\d{4}-\d{2}$/.test(value)&&value<=maxMonth){state.month=value;renderPicker();}else e.target.value=state.month;};
  }
  function closePicker(){dialog.close();opener?.focus();}
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePicker();}});
  dialog.addEventListener('cancel',()=>opener?.focus());
  function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,1800);}
  function reset(scene,updateUrl=false){
    token++;if(dialog.open)dialog.close();
    if(!sceneDefs.some(([id])=>id===scene))scene='current';
    const origin=scene.includes('last')?LAST:scene.includes('custom')?CUSTOM:CURRENT;
    state={scene,page:scene==='agency'?'agency':'hosts',applied:origin,target:origin,status:scene==='error'?'error':scene==='loading'?'loading':'ready',scenario:['empty','inactive','partial','many','page-error'].includes(scene)?scene:'normal',visible:10,x:0,y:0,moreBusy:false,pageFailed:scene==='page-error',failedOnce:scene==='page-error',candidate:origin,month:origin.slice(0,7)};
    $('#scene-select').value=scene;
    if(updateUrl){const q=new URLSearchParams(location.search);q.set('scene',scene);history.replaceState(null,'','?'+q);}
    render();window.scrollTo(0,0);
    if(scene.startsWith('income-')){const v=$('.table-scroll');v.scrollLeft=v.scrollWidth;}
    if(scene.startsWith('picker-')){openPicker();if(scene.endsWith('pending')){state.candidate=origin===CUSTOM?CURRENT:CUSTOM;renderPicker();}}
  }
  $('#scene-select').onchange=e=>reset(e.target.value,true);
  $('#reset-demo').onclick=()=>reset(state.scene);
  window.prototype={get state(){return structuredClone(state);},get rows(){return snapshotRows();},reset,scenes:sceneDefs};
  reset(query.get('scene')||'current');
})();

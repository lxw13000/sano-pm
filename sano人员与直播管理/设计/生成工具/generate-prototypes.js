const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),src=path.join(root,'源文件');
fs.mkdirSync(src,{recursive:true});
const W=1760,H=1120,X=252,CW=1472;
const C={bg:'#F5F7FB',nav:'#0B1C35',ink:'#192B46',sub:'#6B7C93',line:'#E5EAF2',purple:'#6545E8',pale:'#F0EDFF',green:'#07866C',greenBg:'#E8F7F1',amber:'#A46B16',amberBg:'#FFF6E5',red:'#CC5363',blue:'#4277CE'};
const defs=[
['admin-01-01-01-我的运营概览','我的运营概览','overview'],
['admin-02-01-01-BD列表','BD列表','bd'],
['reserved-bd-create','保留编号（已移除）','bd','retired'],
['reserved-bd-edit','保留编号（已移除）','bd','retired'],
['admin-02-02-01-BD具体情况','BD具体情况抽屉','bd','drawer'],
['admin-03-01-01-代理树形列表','代理树形列表','guild'],
['reserved-agency-create','保留编号（已移除）','guild','retired'],
['reserved-agency-edit','保留编号（已移除）','guild','retired'],
['admin-04-01-01-主播列表','主播列表','anchor'],
['admin-04-02-01-主播详情','主播详情','anchor','subpage'],
['admin-05-01-01-主播直播与收入','主播直播与收入 · 默认字段','income'],
['reserved-income-state','保留编号（收入列已合并）','income','retired'],
['admin-06-01-01-代理收入数据','代理收入 · 人员与开播列','agency'],
['admin-06-01-02-代理日数据抽屉','代理收入 · 代理日数据','agency','drawer'],
['admin-06-01-03-主播日数据抽屉','代理收入 · 主播日数据','agency','drawer'],
['reserved-agency-child-drawer','保留编号（旧子代理明细已归档）','agency','retired'],
['reserved-merged-work-list','保留编号（已合并）','income','retired'],
['reserved-merged-work-drawer','保留编号（已合并）','income','retired'],
['admin-08-01-01-当前直播间列表','当前直播间列表','live'],
['admin-08-02-01-实时审核','实时审核抽屉','live','drawer'],
['admin-08-03-01-近七天巡查记录','巡查记录抽屉 · 主播详情来源','anchor','drawer']
];
defs.push(
 ['admin-08-03-02-巡查记录-直播审核来源','巡查记录抽屉 · 直播审核来源','live','drawer'],
 ['admin-08-03-03-巡查图片预览-主播详情来源','图片预览弹窗 · 主播详情来源','anchor','modal'],
 ['admin-08-02-02-实时审核-主播详情来源','实时审核抽屉 · 主播详情来源','anchor','drawer'],
 ['admin-08-03-04-巡查记录-主播审核来源','巡查记录抽屉 · 主播审核来源','anchor','drawer'],
 ['admin-08-03-05-巡查图片预览-直播审核来源','图片预览弹窗 · 直播审核来源','live','modal'],
 ['admin-08-03-06-巡查图片预览-主播审核来源','图片预览弹窗 · 主播审核来源','anchor','modal'],
 ['admin-05-01-02-主播直播与收入详情抽屉','主播直播与收入详情 · 默认主表来源','income','drawer'],
 ['admin-04-03-01-同设备查询-安装实例','同设备查询抽屉 · 安装实例','anchor','drawer'],
 ['admin-04-03-02-同设备查询-设备标识','同设备查询抽屉 · 设备标识mac','anchor','drawer'],
 ['admin-05-02-01-主播直播与收入-全部字段','主播直播与收入 · 全部字段','income'],
 ['admin-05-02-02-详情抽屉-全部字段','主播直播与收入详情 · 全部字段主表来源','income','drawer'],
 ['admin-05-03-01-显示字段-主表默认','显示字段弹窗 · 主表默认','income','modal'],
 ['reserved-drawer-fields-default','保留编号（抽屉字段设置已移除）','income','retired'],
 ['admin-05-03-03-显示字段-主表全部','显示字段弹窗 · 主表全部','income','modal'],
 ['reserved-drawer-fields-all','保留编号（抽屉字段设置已移除）','income','retired'],
 ['admin-05-03-05-显示字段-主表待应用全部','显示字段 · 主表默认来源待应用全部','income','modal'],
 ['reserved-drawer-fields-pending-all','保留编号（抽屉字段设置已移除）','income','retired'],
 ['admin-05-03-07-显示字段-主表待恢复默认','显示字段 · 主表全部来源待恢复默认','income','modal'],
 ['reserved-drawer-fields-pending-default','保留编号（抽屉字段设置已移除）','income','retired']
);
defs.push(
 ['admin-06-02-01-代理收入数据-右侧列','代理收入 · 收入与上级关系列','agency'],
 ['admin-06-02-02-代理日数据-右侧列表来源','代理日数据 · 右侧列表来源','agency','drawer'],
 ['admin-06-02-03-主播日数据-右侧列表来源','主播日数据 · 右侧列表来源','agency','drawer']
);
const pages=[],bounds=[];let b=[],links=[],id=0,pageHeight=H;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const width=(s,z)=>[...String(s)].reduce((v,c)=>v+(/[\u2E80-\uFFFF]/.test(c)?z:z*.56),0);
function text(x,y,s,z=14,col=C.ink,weight=400){b.push(`<text xml:space="preserve" x="${x}" y="${y}" font-size="${z}" fill="${col}" font-weight="${weight}">${esc(s)}</text>`);if(x<0||x+width(s,z)>W+1||y>pageHeight)bounds.push([id,x,y,s]);}
function rect(x,y,w,h,fill='white',r=10,stroke=C.line){b.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`);}
function line(x,y,x2,y2,col=C.line){b.push(`<path d="M${x} ${y}H${x2}" transform="${y2===y?'':`rotate(${Math.atan2(y2-y,x2-x)*180/Math.PI} ${x} ${y})`}" stroke="${col}" fill="none"/>`);}
function circle(x,y,r,col){b.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`);}
function link(target,draw){if(target===undefined||target===null){draw();return;}links.push(target);b.push(`<a href="${defs[target][0]}.svg">`);draw();b.push('</a>');}
function btn(x,y,w,label,target,primary=false,h=38){link(target,()=>{rect(x,y,w,h,primary?C.purple:'white',7,primary?C.purple:'#DAE1ED');text(x+14,y+h/2+5,label,13,primary?'white':C.purple,550);});}
function pill(x,y,label,tone='purple',z=11){const pair={purple:[C.pale,C.purple],green:[C.greenBg,C.green],amber:[C.amberBg,C.amber],gray:['#EDF1F6',C.sub],red:['#FFF0F3',C.red]}[tone];let w=width(label,z)+20;rect(x,y,w,24,pair[0],12,'none');text(x+10,y+16,label,z,pair[1],550);return w;}
function card(x,y,w,h){rect(x,y,w,h);}
function icon(x,y,type,col){const paths={overview:'M2 2h6v6H2z M12 2h6v6h-6z M2 12h6v6H2z M12 12h6v6h-6z',bd:'M4 18v-4h12v4 M6 6a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',guild:'M3 18V7h14v11 M7 7V2h6v5 M7 11h2 M12 11h2 M7 15h2 M12 15h2',anchor:'M3 18c0-6 14-6 14 0 M6 6a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',income:'M2 5h16v12H2z M2 9h16 M12 13h3',agency:'M2 5h16v12H2z M6 2v6 M14 2v6 M6 12h8',work:'M10 1a9 9 0 1 0 .1 0 M10 5v5l4 2',live:'M2 4h12v13H2z M14 8l5-3v11l-5-3'};b.push(`<path d="${paths[type]}" transform="translate(${x},${y})" fill="none" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/>`);}
function shell(page,title,subtitle){id=page;pageHeight=page===9?2200:H;b=[];links=[];b.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${pageHeight}" viewBox="0 0 ${W} ${pageHeight}"><style>text{font-family:"Microsoft YaHei","Segoe UI",sans-serif}a{cursor:pointer}</style>`);rect(0,0,W,pageHeight,C.bg,0,'none');rect(0,0,216,pageHeight,C.nav,0,'none');text(28,48,'SANO',29,'white',750);text(29,73,'人员与直播管理',12,'#A0B0C7');
 const activeKey=defs[page][2];
 link(0,()=>{if(activeKey==='overview')rect(14,111,188,42,C.purple,8,'none');icon(29,122,'overview',activeKey==='overview'?'white':'#9CAEC6');text(62,138,'运营概览',14,activeKey==='overview'?'white':'#BBC8D9',activeKey==='overview'?600:400);});
 const navGroups=[['组织管理',178,[['BD列表',1,'bd'],['代理列表',5,'guild'],['主播列表',8,'anchor']]],['直播与收入',394,[['主播直播与收入',10,'income'],['代理收入',12,'agency'],['直播审核',18,'live']]]];
 navGroups.forEach(([label,top,items])=>{icon(29,top+3,label==='组织管理'?'guild':'income','#A4B6CF');text(60,top+18,label,14,'#E1E8F3',600);text(180,top+18,'⌄',14,'#A4B6CF');items.forEach(([name,target,key],i)=>{const yy=top+35+i*44,on=key===activeKey;link(target,()=>{if(on)rect(30,yy,172,38,C.purple,7,'none');circle(46,yy+19,2.5,on?'white':'#536C8D');text(63,yy+25,name,13,on?'white':'#AABDD3',on?600:400);});});});
 rect(18,929,180,98,'#142943',9,'none');circle(43,959,13,'#4C4490');text(37,964,'N',13,'white',600);text(65,957,'Nina',13,'white',600);text(65,978,'运营 · 当前授权范围',10,'#A1B2CB');text(30,1008,'3 BD  /  18 代理',11,'#A1B2CB');text(28,1082,'SANO · 管理后台',10,'#738CA9');
 rect(216,0,W-216,64,'white',0);if([9,20,22,23,24,26,28,29].includes(page)){text(X,39,'组织管理  /',13,C.sub);link(8,()=>text(X+88,39,'主播列表',13,C.purple));text(X+158,39,'/  主播详情',13,C.sub);}else{text(X,39,(defs[page][2]==='overview'?'首页':(['bd','guild','anchor'].includes(defs[page][2])?'组织管理':'直播与收入'))+'  /  '+title,13,C.sub);}pill(1373,20,'原型示例数据','amber');text(1535,39,'Nina  ·  运营',12,C.sub);
 if([9,20,22,23,24,26,28,29].includes(page)){btn(X,84,168,'← 返回主播列表',8);text(X+190,112,title,27,C.ink,700);}else{text(X,112,title,27,C.ink,700);}text(X,140,subtitle,13,C.sub);pill(1519,89,'我的授权范围','purple');
 line(X,pageHeight-39,1724,pageHeight-39);text(X,pageHeight-17,'示例数据仅供评审  ·  数据范围：运营 Nina  ·  收入 USD  ·  余额按所标单位  ·  时区 UTC+8',10,C.sub);text(1470,pageHeight-17,defs[page][0].split('-').slice(0,4).join('-')+'  /  V1',10,C.sub);
}
function scope(y=160,label='我的管理范围：3个BD / 18个代理 / 280名主播'){rect(X,y,CW,38,C.pale,7,'none');circle(X+16,y+19,3,C.purple);text(X+29,y+24,label,12,C.purple);text(1446,y+24,'今日数据更新于 14:30',11,C.sub);}
function stats(y,items,h=96){const gap=14,w=(CW-gap*(items.length-1))/items.length;items.forEach((a,i)=>{const x=X+i*(w+gap);link(a[3],()=>{card(x,y,w,h);text(x+18,y+26,a[0],12,C.sub);text(x+18,y+61,a[1],27,a[4]||C.ink,650);if(a[2])text(x+18,y+h-13,a[2],10,C.sub);});});}
let filterLayout=null;
function fields(y,items,cols=5){const rowH=58,gap=12,rows=Math.ceil(items.length/cols),w=(CW-32-184-gap*(cols-1))/cols,h=rows*rowH+16;card(X,y,CW,h);items.forEach((a,i)=>{const xx=X+16+(i%cols)*(w+gap),yy=y+20+Math.floor(i/cols)*rowH;compactField(xx,yy,w,a[0],a[1]||'全部',a[2]);});filterLayout={actionsY:y+27+(rows-1)*rowH};return y+h;}
function compactField(x,y,w,label,value='全部',kind='select'){text(x,y,label,11,C.sub,500);if(kind==='range'){const rw=(w-24)/2;rect(x,y+7,rw,32,'white',6,'#DDE4EF');rect(x+rw+24,y+7,rw,32,'white',6,'#DDE4EF');text(x+10,y+28,'最小值',12,'#A0ACBD');text(x+rw+34,y+28,'最大值',12,'#A0ACBD');text(x+rw+6,y+28,'～',12,C.sub);return;}rect(x,y+7,w,32,'white',6,'#DDE4EF');text(x+10,y+28,value,12,value.startsWith('请输入')||value.startsWith('请选择')?'#A0ACBD':C.ink);if(kind!=='input')text(x+w-20,y+28,kind==='date'?'▦':'⌄',13,C.sub);}
function field(x,y,w,label,value='全部',kind='select'){text(x,y,label,11,C.sub,500);rect(x,y+10,w,35,'white',6,'#DDE4EF');text(x+11,y+33,value,12,value.startsWith('请输入')||value.startsWith('请选择')?'#A0ACBD':C.ink);if(kind!=='input')text(x+w-22,y+33,kind==='date'?'▦':'⌄',13,C.sub);}
function filtersEnd(y,extra=''){btn(1540,filterLayout.actionsY,68,'重置',null,false,32);btn(1620,filterLayout.actionsY,88,'查询',null,true,32);if(extra){text(X+4,y+20,extra,11,C.sub);return y+28;}return y;}
function dateRange(x,y,w,label='统计时间段'){text(x,y+22,label,11,C.sub,500);const lx=x+width(label,11)+14,rw=w-(lx-x);rect(lx,y,rw,32,'white',6,'#DDE4EF');text(lx+11,y+21,'2026-10-13 — 2026-10-19',12,C.ink);text(lx+rw-22,y+21,'▦',13,C.sub);}
function titlebar(y,title,count,action){text(X+20,y+23,title,16,C.ink,650);if(count)text(X+20+width(title,16)+16,y+23,count,11,C.sub);if(action)btn(1570,y-2,134,action[0],action[1],true);}
function tabbar(x,y,w,labels,active,targets){labels.forEach((s,i)=>{let xx=x+i*w/labels.length;link(targets?.[i],()=>{text(xx+18,y+25,s,13,i===active?C.purple:C.sub,i===active?650:400);if(i===active)rect(xx+18,y+38,width(s,13),3,C.purple,1,'none');});});line(x,y+42,x+w,y+42);}
function table(x,y,w,headers,rows,weights,rowH=61,options={}){const total=weights.reduce((a,c)=>a+c,0),ww=weights.map(n=>n*w/total);rect(x,y,w,43,'#F1F4F9',6,'none');let xx=x;headers.forEach((s,i)=>{text(xx+12,y+27,s,11,'#596B84',600);xx+=ww[i];});rows.forEach((row,r)=>{let yy=y+43+r*rowH;if(options.high===r)rect(x,yy,w,rowH,'#F8F6FF',0,'none');line(x,yy+rowH,x+w,yy+rowH);let cx=x;row.forEach((cell,c)=>{const object=typeof cell==='object'?cell:{t:cell};const ls=String(object.t).split('\n');if(object.counts){let ax=cx+12;const z=12,ty=yy+rowH/2+4;object.counts.forEach((item,i)=>{const s=item.label+' '+item.value;text(ax,ty,s,z,item.color);ax+=width(s,z);if(i<object.counts.length-1){text(ax,ty,' · ',z,'#A2ADBD');ax+=width(' · ',z);}});cx+=ww[c];return;}if(object.actions){let ax=cx+12;object.actions.forEach(([label,target],ai)=>{link(target,()=>text(ax,yy+rowH/2+4,label,11,C.purple));ax+=width(label,11)+13;});cx+=ww[c];return;}link(object.to,()=>{ls.forEach((s,j)=>{let z=j?10:12;while(width(s,z)>ww[c]-24&&z>9)z-=.5;text(cx+12,yy+(ls.length===1?rowH/2+4:ls.length===2?rowH/2-5:16)+j*17,s,z,j?C.sub:object.color||C.ink,object.bold?600:400);});});cx+=ww[c];});});return y+43+rows.length*rowH;}
function pager(y,total='280',size='20'){text(X+20,y+25,'共 '+total+' 条',11,C.sub);text(1394,y+25,'‹',15,C.sub);pill(1420,y+7,'1');text(1470,y+25,Number(total)>Number(size)?'2    3    …    ›':'›',12,C.sub);rect(1580,y+4,124,32,'white',6);text(1593,y+25,size+' 条 / 页  ⌄',11,C.sub);}
function banner(x,y,w,msg){rect(x,y,w,34,'#F4F6FA',6,'none');text(x+12,y+22,msg,11,C.sub);}
const uiRelations={4:{parentId:1},9:{parentId:8},13:{parentId:12},14:{parentId:12},19:{parentId:18},20:{parentId:9},21:{parentId:18,backId:19,replacesDrawer:true},22:{parentId:20},23:{parentId:9},24:{parentId:9,backId:23,replacesDrawer:true},25:{parentId:21},26:{parentId:24},27:{parentId:10},28:{parentId:9},29:{parentId:9},31:{parentId:30},32:{parentId:10},34:{parentId:30},36:{parentId:10},38:{parentId:30},41:{parentId:40},42:{parentId:40}};
function save(page){b.push('</svg>');fs.writeFileSync(path.join(src,defs[page][0]+'.svg'),b.join('\n'),'utf8');pages.push({id:page,file:defs[page][0],name:defs[page][1],kind:defs[page][3]||'main',...(uiRelations[page]||{}),links:[...new Set(links)],width:W,height:pageHeight});}
function money(n){return '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function avatar(x,y,name,color=C.purple,r=17){circle(x,y,r,color+'18');text(x-r*.35,y+r*.35,name.slice(0,1),r*.85,color,600);}
function portrait(x,y,w,h,seed=0){const colors=['#D8D1E7','#C9DDDC','#EBD9CF','#CFDAEC','#E3D1D8'];const bg=colors[seed%colors.length];rect(x,y,w,h,bg,8,'none');b.push(`<g clip-path="url(#clip-${id}-${x}-${y})"><defs><clipPath id="clip-${id}-${x}-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/></clipPath></defs><ellipse cx="${x+w*.52}" cy="${y+h*.85}" rx="${w*.43}" ry="${h*.38}" fill="${['#6E688E','#386F73','#896353'][seed%3]}"/><ellipse cx="${x+w*.5}" cy="${y+h*.42}" rx="${w*.22}" ry="${h*.29}" fill="#3E3444"/><ellipse cx="${x+w*.5}" cy="${y+h*.44}" rx="${w*.16}" ry="${h*.20}" fill="#E5B49D"/><path d="M${x+w*.34} ${y+h*.36}Q${x+w*.40} ${y+h*.16} ${x+w*.67} ${y+h*.35}" stroke="#3E3444" stroke-width="${w*.08}" fill="none"/><circle cx="${x+w*.44}" cy="${y+h*.42}" r="${w*.012}" fill="#574350"/><circle cx="${x+w*.56}" cy="${y+h*.42}" r="${w*.012}" fill="#574350"/><path d="M${x+w*.46} ${y+h*.51}q${w*.04} ${h*.025} ${w*.08} 0" stroke="#A97074" stroke-width="${Math.max(1,w*.008)}" fill="none"/></g>`);}
const hosts=[
['U2001','Lina','TH · 女','G1024','星河代理','U1001','Maya','Evan · BD','超级主播',6240,2100,3000,1140,2800,2200,740,500,150,452,260,150],
['U2002','Nok','TH · 女','G1101','晨星代理','U1101','Tom','Evan · BD','优质主播',4320,1200,2400,720,2000,1200,620,500,0,380,210,145],
['U2003','June','VN · 女','G1201','星芒代理','U1201','Amy','Evan · BD','主播',2880,960,1560,360,1300,900,380,300,80,325,180,110],
['U2004','Arun','IN · 男','G2100','银河代理','U2100','Ravi','Aria · BD','主播',2460,780,1320,360,1100,860,300,200,0,288,160,104],
['U2005','Ploy','TH · 女','G3100','蓝湾代理','U3100','Mali','Nina · 运营','优质主播',1920,600,1080,240,800,620,300,200,60,240,130,85],
['U2006','Mina','PH · 女','G3200','海蓝代理','U3200','Lily','Max · BD','主播',1680,480,960,240,700,540,240,200,0,216,110,80],
['U2007','Kai','VN · 男','G1101','晨星代理','U1101','Tom','Evan · BD','主播',1080,360,600,120,480,300,180,120,0,180,100,60],
['U2008','Anna','PH · 女','G1024','星河代理','U1001','Maya','Evan · BD','超级主播',960,240,600,120,400,300,160,100,30,165,90,55]
];
const guildRows=[
[{t:'▾ 星河代理\nG1024',to:12,bold:true},'Maya · U1001\n+66 81 245 6801','A级代理\n20%','Evan · BD\nBD1001','24 / 6 / 2\n主播 / 优质 / 超级','—\n顶级代理','—','2026-04-06\n10:20:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'    ▾ 晨星代理\n       G1101',to:12},'Tom · U1101\n+66 82 160 4532','B级代理\n16%','Evan · BD\nBD1001','12 / 3 / 1\n主播 / 优质 / 超级','星河代理\nG1024','Maya\nU1001','2026-05-12\n14:30:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'        星芒代理\n        G1201',to:12},'Amy · U1201\n+84 91 426 8810','C级代理\n12%','Evan · BD\nBD1001','8 / 2 / 0\n主播 / 优质 / 超级','晨星代理\nG1101','Tom\nU1101','2026-06-18\n09:15:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'    月光代理\n    G1102',to:12},'May · U1102\n+66 89 172 6008','C级代理\n8%','Evan · BD\nBD1001','16 / 4 / 1\n主播 / 优质 / 超级','星河代理\nG1024','Maya\nU1001','2026-06-20\n11:40:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'▸ 银河代理\nG2100',to:12},'Ravi · U2100\n+91 98 451 3302','A级代理\n20%','Aria · BD\nBD1002','32 / 7 / 3\n主播 / 优质 / 超级','—\n顶级代理','—','2026-05-08\n15:20:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'▸ 蓝湾代理\nG3100',to:12},'Mali · U3100\n+66 87 604 7712','B级代理\n16%','Nina · 运营\nOP1001','18 / 5 / 2\n主播 / 优质 / 超级','—\n顶级代理','—','2026-06-02\n16:35:00',{t:'主播列表',actions:[['主播列表',8]]}]
];
function bdBase(page=1){shell(page,'BD列表','查看BD基础资料、运营归属与负责情况');scope();let yy=fields(218,[['ID','请输入BD ID','input'],['名称','请输入名称','input'],['国家代码'],['所属运营','Nina · OP1001'],['创建时间段','开始日期 — 结束日期','date']]);yy=filtersEnd(yy);card(X,yy+12,CW,458);titlebar(yy+31,'BD列表','共3个BD');let end=table(X+20,yy+78,CW-40,['名称 / ID','联系方式','国家代码','所属运营','账号状态','创建时间','操作'],[
[{t:'Evan\nBD1001',to:4,bold:true},'+66 82 451 6630','TH','Nina · OP1001',{t:'● 正常',color:C.green},'2026-04-01 10:20',{t:'具体情况',actions:[['具体情况',4]]}],
[{t:'Aria\nBD1002',to:4,bold:true},'+91 98 154 2731','IN','Nina · OP1001',{t:'● 正常',color:C.green},'2026-05-06 15:40',{t:'具体情况',actions:[['具体情况',4]]}],
[{t:'Max\nBD1003',to:4,bold:true},'+63 91 564 8220','PH','Nina · OP1001',{t:'● 禁用',color:C.red},'2026-06-12 09:10',{t:'具体情况',actions:[['具体情况',4]]}]
],[1.3,1.5,.75,1.3,.8,1.6,1.4],74);pager(end+12,'3');banner(X,yy+490,CW,'查看BD资料及负责情况；点击具体情况打开右侧抽屉。');}
function guildBase(page=5){shell(page,'代理列表','树形查看代理层级、实际负责人及直属主播人数');scope();let yy=fields(218,[['代理ID','请输入代理ID','input'],['代理长ID','请输入代理长ID','input'],['上级代理ID','请输入上级代理ID','input'],['上级代理长ID','请输入上级代理长ID','input'],['代理等级'],['创建时间段','开始日期 — 结束日期','date'],['所属运营','BD / 直属运营'],['分成比例','4% / 8% / 12% / 16% / 20%']],5);yy=filtersEnd(yy,'总人数含优质、超级主播，三项均仅统计直属主播；不将三项相加');card(X,yy+12,CW,566);titlebar(yy+31,'代理列表','共18个代理');const rows=guildRows.map(row=>{const n=row[4].split('\n')[0].split(' / ');return [...row.slice(0,4),{counts:[{value:n[0],label:'总人数',color:C.ink},{value:n[1],label:'优质',color:C.green},{value:n[2],label:'超级',color:C.purple}]},...row.slice(5)];});let end=table(X+20,yy+78,CW-40,['代理名称 / ID','代理长 / WhatsApp','等级 / 比例','所属运营','直属主播','上级代理','上级代理长','创建时间','操作'],rows,[1.3,1.45,.75,1,1.8,1.05,.95,1.15,.85],65,{high:1});pager(end+10,'18');}
function overlay(){rect(216,64,W-216,H-64,'#10223B80',0,'none');}
function overview(){shell(0,'我的运营概览','先了解自己的管理规模，再进入人员列表与业务明细');scope();btn(1460,219,264,'2026-10-13 — 2026-10-19 ▦');text(X,244,'人员与组织',16,C.ink,650);stats(270,[['BD数量','3','查看BD及负责情况',1],['代理数量','18','包含授权范围内子代理',5],['主播总人数','280','按主播ID去重',8],['超级主播','18','已有身份结果',8],['优质主播','56','已有身份结果',8],['当前在播','38','按已有在播状态',18,C.green]],100);
 text(X,409,'收入与冻结收益',16,C.ink,650);stats(430,[['主播总收入','$48,260.00','近7天 · 主播分成后所得',10],['幸运礼物收入','$15,320.00','业务类型 · 不与渠道金额重复相加',10],['普通礼物收入','$26,480.00','业务类型 · 游戏收入 $6,460.00',10],['代理总收入','$8,426.00','已有代理收入汇总',12],['主播冻结收益','$1,380.00','范围内主播 · 金额时点待核对',9,C.amber]],110);
 card(X,566,720,226);text(X+22,599,'我管理的BD',17,C.ink,650);link(1,()=>text(X+611,599,'查看全部 →',12,C.purple));table(X+20,617,680,['BD / ID','所属运营','代理数','主播数','状态'],[
 [{t:'Evan · BD1001',to:4},'Nina','5','96',{t:'正常',color:C.green}],['Aria · BD1002','Nina','6','104',{t:'正常',color:C.green}],['Max · BD1003','Nina','4','62',{t:'禁用',color:C.red}]
 ],[1.9,1.2,.8,.8,.8],39);
 card(994,566,730,226);text(1016,599,'当前在播',17,C.ink,650);link(18,()=>text(1600,599,'进入直播间 →',12,C.purple));hosts.slice(0,3).forEach((a,i)=>{let xx=1016+i*230;portrait(xx,618,70,112,i);text(xx+83,641,a[1],14,C.ink,600);pill(xx+83,651,a[8],a[8]==='超级主播'?'purple':'green');text(xx+83,696,'开播 '+['01:42','00:58','02:10'][i],11,C.sub);link(18,()=>text(xx+83,721,'查看直播间 →',11,C.purple));});
 card(X,814,CW,229);text(X+22,849,'从这里继续查看',17,C.ink,650);const paths=[['代理关系','展开代理层级，查直属主播结构',5],['主播直播与收入','同看人员、直播时长与收入',10],['代理收入','开播表现、代理及主播日数据',12],['直播审核','查看当前在播及巡查记录',18]];paths.forEach((a,i)=>{let x=X+22+i*361;link(a[2],()=>{rect(x,874,339,118,'#F8F9FD',8,'none');text(x+18,907,a[0],15,C.ink,600);text(x+18,934,a[1],11,C.sub);text(x+18,971,'查看详情 →',12,C.purple);});});save(0);}
function bdDetail(){
 bdBase(4);link(1,()=>overlay());const x=594,w=W-x,pad=28,inner=w-pad*2;
 rect(x,64,w,H-64,'white',0,'none');text(x+pad,111,'BD具体情况',23,C.ink,650);text(x+pad,140,'BD列表 / Evan · BD1001',12,C.sub);link(1,()=>text(W-49,111,'×',25,C.sub));
 rect(x+pad,163,inner,108,'#F7F8FC',9,'none');avatar(x+58,202,'E',C.purple,23);text(x+99,196,'Evan',23,C.ink,650);pill(x+165,178,'正常','green');text(x+99,224,'BD1001  ·  TH  ·  +66 82 451 6630',12,C.sub);text(x+99,250,'所属运营 Nina / OP1001    创建时间 2026-04-01 10:20',11,C.sub);
 const items=[['负责代理','5'],['主播人数','96'],['超级主播','6'],['优质主播','18']];const sw=(inner-36)/4;items.forEach((a,i)=>{let xx=x+pad+i*(sw+12);card(xx,291,sw,94);text(xx+16,317,a[0],12,C.sub);text(xx+16,355,a[1],27,C.ink,650);});
 text(x+pad,431,'负责代理',16,C.ink,650);text(x+136,431,'部分节点示例 · 人数均为直属口径',11,C.sub);
 table(x+pad,453,inner,['代理 / ID','代理长','上级代理','分成比例','直属主播结构','操作'],guildRows.slice(0,4).map(r=>[r[0],r[1].split('\n')[0],r[5],r[2].split('\n')[1],r[4],{t:'主播列表 →',to:8,color:C.purple}]),[1.5,1.3,1.3,.8,1.4,1.1],74);
 btn(x+pad,849,218,'查看主播直播与收入 →',10);
 line(x+pad,1022,W-pad,1022);text(x+pad,1066,'关闭抽屉后，保留BD列表的筛选与位置。',11,C.sub);btn(W-142,1042,114,'关闭',1);save(4);
}
function anchorList(){shell(8,'主播列表','按人员身份与归属查找主播，点击进入同一份个人详情');scope();let y=fields(218,[['主播ID','请输入主播ID','input'],['昵称','请输入昵称','input'],['国家'],['代理ID','请输入代理ID','input'],['性别'],['注册时间段','开始日期 — 结束日期','date'],['是否实名']],5);y=filtersEnd(y);card(X,y+12,CW,572);titlebar(y+31,'主播列表','共280名主播');let end=table(X+20,y+78,CW-40,['主播ID / 昵称','国家 / 性别','代理ID / 昵称','所属运营','身份','实名认证','注册时间','操作'],hosts.slice(0,6).map((a,i)=>[{t:a[1]+'\n'+a[0],to:9,bold:true},a[2],a[4]+'\n'+a[3],a[7],{t:a[8],color:a[8]==='超级主播'?C.purple:a[8]==='优质主播'?C.green:C.ink},{t:'已实名',color:C.green},'2026-0'+(4+i%3)+'-'+(12+i)+'\n10:20:00',{t:'查看详情 →',to:9,color:C.purple}]),[1.3,1,1.5,1.2,1.1,1,1.4,1],66);pager(end+8);save(8);}
function anchorDetail(page=9,emit=true){
 shell(page,'主播详情','收入与工作同页展示 · 向下查看详细资料、账户余额及最后一次上报');scope(160,'当前主播：Lina / U2001  ·  星河代理 G1024  ·  负责人 Evan / BD');
 card(X,218,CW,122);portrait(270,236,60,82,0);text(350,259,'Lina',25,C.ink,650);pill(427,239,'超级主播');pill(528,239,'已实名','green');text(350,291,'U2001  ·  泰国 TH  ·  女  ·  注册 2026-04-12 10:20',12,C.sub);text(1050,258,'代理长  Maya / U1001',12,C.ink);text(1050,290,'当前状态  ● 正在直播',12,C.green);btn(1520,251,180,'进入实时审核 →',23,true);
 if(emit){b.push('<a href="#profile-details">');btn(1326,251,174,'详细资料 ↓');b.push('</a>');}
 stats(360,[['所选期间收入','$6,240.00','分成后所得 · 跟随下方统计时间'],['本人消费','$286.00','个人消费示意 · 明细待细化'],['冻结收益','$150.00','使用已有冻结收益字段'],['所选期间工作时长','452 min','跟随下方统计时间 · 允许已有误差']],103);
 card(X,486,934,562);text(X+22,522,'直播与收入',17,C.ink,650);dateRange(558,501,420);btn(990,501,86,'近7天',null,false,32);btn(1088,501,76,'查询',null,true,32);text(X+22,557,'收入构成（$）',13,C.ink,600);text(X+164,557,'业务类型与渠道类型同时展示',11,C.sub);text(930,557,'默认近7天，含今天',11,C.sub);
 const mx=X+22,mw=890;
 function amounts(y,items,tone){const gap=10,ww=(mw-gap*(items.length-1))/items.length;items.forEach((a,i)=>{let xx=mx+i*(ww+gap);rect(xx,y,ww,55,tone,6,'none');text(xx+13,y+19,a[0],11,C.sub);text(xx+13,y+43,a[1],18,C.ink,650);});}
 amounts(572,[['幸运礼物收入','$2,100.00'],['普通礼物收入','$3,000.00'],['游戏收入','$1,140.00']],'#F1F5FF');
 amounts(636,[['单人直播收入','$2,800.00'],['多人视频直播收入','$2,200.00'],['音频直播收入','$740.00'],['私聊收入','$500.00']],'#EDF7F3');
 text(X+22,728,'每日收入与工作记录',14,C.ink,650);text(930,728,'2026-10-13 — 2026-10-19 · min',11,C.sub);
 table(mx,748,mw,['日期','总收入（$）','总时长（min）','单人（min）','多人（min）','上麦（min）'],['10-19','10-18','10-17','10-16','10-15','10-14','10-13'].map((d,i)=>[d,money([850,1100,1050,780,930,810,720][i]),[60,74,67,72,63,60,56][i],[35,42,40,40,36,34,33][i],[24.9,31.9,26.9,32,27,26,23][i],[20,25,18,26,22,20,16][i]]),[1,1.25,1.2,1.1,1.1,1.1],32);
 text(X+22,1036,'今日更新于14:30 · 历史数据固定 · 保留已有时长计算误差',10,C.sub);
 card(1208,486,516,251);text(1230,522,'身份与归属',17,C.ink,650);[['所属代理','星河代理 / G1024'],['代理长','Maya / U1001'],['所属运营','Evan / BD1001'],['上级代理','无上级代理']].forEach((a,i)=>{text(1230,565+i*37,a[0],12,C.sub);text(1350,565+i*37,a[1],12,C.ink);});card(1208,757,516,291);text(1230,793,'近七天巡查',17,C.ink,650);text(1230,820,'按天查看截图，每天默认10张',12,C.sub);for(let i=0;i<4;i++)portrait(1230+i*116,840,99,115,i);link(20,()=>text(1230,1006,'查看七天记录 →',13,C.purple));if(emit){anchorExtra();save(page);}
}
function detailGrid(x,y,w,items,cols=2,rowH=32){const cw=w/cols;items.forEach((a,i)=>{const xx=x+i%cols*cw,yy=y+Math.floor(i/cols)*rowH,label=a[0]+'：',labelW=width(label,11);let value=String(a[1]),max=cw-labelW-(a[2]?130:24);while(width(value,12)>max)value=value.slice(0,-2)+'…';text(xx,yy+20,label,11,C.sub);text(xx+labelW+4,yy+20,value,12,C.ink);if(a[2])link(a[2],()=>text(xx+cw-106,yy+20,'查询记录 →',11,C.purple));});}
function anchorExtra(){
 b.push('<g id="profile-details">');
 text(X,1090,'详细资料',20,C.ink,650);text(X+110,1090,'基础资料与账户信息',12,C.sub);
 card(X,1112,720,390);text(X+22,1146,'基础信息',17,C.ink,650);
 detailGrid(X+22,1164,676,[['主播ID','U2001'],['基本用户号','000002001'],['昵称','Lina'],['代理邀请编码','INV-DEMO-2001'],['性别','女'],['年龄','24'],['生日','2002-04-12'],['国家编码','TH'],['语言编码','en'],['身高','168 cm'],['体重','52 kg'],['才艺','唱歌、舞蹈'],['头像','已设置 · 页首展示'],['背景图','已设置'],['最后登录时间','2026-10-19 14:28:15'],['最后登录IP','203.0.113.24'],['用户设备编码','device-demo-2001'],['个性签名','Enjoy music, enjoy every live.']],2,32);
 rect(856,1352,92,28,'#E5EEF8',5,'none');b.push('<path d="M856 1380L880 1358L900 1372L924 1357L948 1380Z" fill="#A8BDD8"/>');circle(933,1360,4,'#F8D78C');
 card(994,1112,730,390);text(1016,1146,'账号与账户信息',17,C.ink,650);
 rect(1016,1162,686,38,C.pale,6,'none');detailGrid(1028,1166,662,[['金币余额','66 金币'],['钻石余额','5,328 钻石'],['冻结钻石金额','880 钻石']],3,32);
 detailGrid(1016,1210,686,[['财富等级','29'],['魅力等级','3'],['账号状态','正常'],['注销标记 / 注销状态','未注销 / 未注销'],['真人认证','已通过'],['真人认证限制','否'],['认证限制备注','—'],['是否首充','是'],['当前代理','星河代理 / G1024'],['加入当前代理时间','2026-04-14 10:00:00'],['首次加入代理ID','G1024'],['首次加入代理时间','2026-04-14 10:00:00'],['注销发起时间','—'],['注册时间','2026-04-12 10:20:00'],['资料更新时间','2026-10-19 14:28:15'],['修改人ID','10001']],2,32);
 text(1016,1482,'余额使用金币、钻石原单位；与上方美元收入分别展示。',11,C.sub);
 card(X,1522,CW,172);text(X+22,1558,'联系方式、第三方绑定与其他资料',17,C.ink,650);
 detailGrid(X+22,1574,CW-44,[['手机号码','+66 82 451 6630'],['邮箱','lina@example.com'],['谷歌ID','g-demo-2001'],['谷歌邮箱','lina.google@example.com'],['苹果ID','未绑定'],['苹果邮箱','未绑定'],['经度 / 纬度','100.5018 / 13.7563'],['是否首次登录','否']],3,32);
 latestReport(1714);b.push('</g>');
}
const reportFields=[
 ['记录ID','900201'],['用户ID','2001'],['服务端接收时间','2026-10-19 14:30:00.345'],
 ['设备品牌','OnePlus'],['原始型号','CPH2581'],
 ['设备时间（毫秒）',String(Date.parse('2026-10-19T14:30:00+08:00'))],['系统及版本','Android 16'],
 ['App发布版本','1.9.6'],['App构建号','0190601'],['网络类型','WIFI'],
 ['是否模拟器','否'],['是否VPN或代理','未检测'],['上报IP','203.0.113.24'],
 ['IP国家','TH'],['IP地区 / 省州','Bangkok'],['IP城市','Bangkok'],
 ['注册国家','TH'],['注册渠道','organic'],['是否代理长','否'],
 ['是否Payroll代理','否'],['是否BD','否'],['客户端类型','ANDROID']
];
const deviceQueryFields=[['安装实例ID','install-demo-2001',28],['设备标识（mac）','ad-demo-2001',29]];
function latestReport(y){card(X,y,CW,426);text(X+22,y+36,'最后一次上报信息',17,C.ink,650);text(X+205,y+36,'按服务端接收时间取最近一条',12,C.sub);detailGrid(X+22,y+62,CW-44,reportFields,3,30);banner(X+22,y+304,CW-44,'最近上报按服务端接收时间展示；上报快照保留当次结果，注册资料以基础信息为准。');text(X+22,y+366,'同设备查询',13,C.ink,600);detailGrid(X+22,y+378,CW-44,deviceQueryFields,2,32);}
function deviceLookup(page=28,mode='install'){
 shell(page,'主播详情','同设备查询从最后一次上报区域进入');scope(160,'当前主播：Lina / U2001 · 当前页面已定位至最后一次上报区域');latestReport(218);
 link(9,()=>overlay());const x=470,w=W-x,pad=28,tw=w-pad*2,isInstall=mode==='install',key=isInstall?'install-demo-2001':'ad-demo-2001';
 rect(x,64,w,H-64,'white',0,'none');text(x+pad,111,'同设备查询',23,C.ink,650);text(x+pad,139,'Lina / U2001 · 仅展示当前授权范围内的上报记录',12,C.sub);link(9,()=>text(W-49,111,'×',25,C.sub));
 rect(x+pad,164,tw,74,C.pale,8,'none');text(x+pad+16,191,isInstall?'安装实例ID':'设备标识（mac）',12,C.sub);text(x+pad+16,218,key,16,C.ink,600);
 text(x+pad,282,'查询依据',11,C.sub);btn(x+102,260,156,'安装实例',28,isInstall,32);btn(x+270,260,164,'设备标识（mac）',29,!isInstall,32);dateRange(962,260,420,'上报时间段');btn(1394,260,86,'近7天',null,false,32);btn(1492,260,84,'查询',null,true,32);
 [['范围内关联账号','3'],['匹配上报记录','5'],['匹配方式','标识精确匹配']].forEach((a,i)=>{const cw=(tw-28)/3,xx=x+pad+i*(cw+14);rect(xx,316,cw,85,'#F6F7FB',8,'none');text(xx+16,342,a[0],12,C.sub);text(xx+16,378,a[1],i===2?21:27,C.ink,650);});
 text(x+pad,438,'同标识上报记录',17,C.ink,650);text(x+pad,466,'已查询：2026-10-13 — 2026-10-19 · 按服务端接收时间倒序，包含当前账号',11,C.sub);
 const rows=[['2026-10-19 14:30:00.345','Lina\nU2001',isInstall?key:'install-demo-2001',isInstall?'ad-demo-2001':key,'OnePlus\nCPH2581','Android 16\n1.9.6 / 0190601','203.0.113.24\nTH · Bangkok','否 / 未检测'],['2026-10-19 13:40:10.120','Nok\nU2002',isInstall?key:'install-demo-2002',isInstall?'ad-demo-2001':key,'OnePlus\nCPH2581','Android 16\n1.9.6 / 0190601','203.0.113.24\nTH · Bangkok','否 / 否'],['2026-10-18 21:10:12.800','Lina\nU2001',isInstall?key:'install-demo-2001',isInstall?'ad-demo-2001':key,'OnePlus\nCPH2581','Android 16\n1.9.6 / 0190601','203.0.113.25\nTH · Bangkok','否 / 未检测'],['2026-10-17 19:05:01.080','Anna\nU2008',isInstall?key:'install-demo-2008',isInstall?'ad-demo-2001':key,'OnePlus\nCPH2581','Android 16\n1.9.5 / 0190502','203.0.113.25\nTH · Bangkok','未检测 / 否'],['2026-10-15 11:20:42.320','Lina\nU2001',isInstall?key:'install-demo-2001',isInstall?'ad-demo-2001':key,'OnePlus\nCPH2581','Android 16\n1.9.5 / 0190502','203.0.113.24\nTH · Bangkok','否 / 否']];
 table(x+pad,490,tw,['服务端接收时间','主播 / 用户号','安装实例ID','设备标识（mac）','品牌 / 型号','系统 / App版本','IP / 地区','模拟器 / VPN'],rows,[1.6,.9,1.4,1.3,1.1,1.65,1.4,1.1],76);
 banner(x+pad,938,tw,'按当前标识精确匹配，含当前账号的历史记录；账号数和记录数均限定在当前授权范围。');
 line(x+pad,1022,W-pad,1022);text(x+pad,1066,'关闭后回到主播详情的原上报区域，保留页面位置。',11,C.sub);btn(W-142,1042,114,'关闭',9);save(page);
}
const hostIncomeDaily=[
 ['2026-10-19',850,280,410,160,380,300,100,70],
 ['2026-10-18',1100,400,520,180,500,390,130,80],
 ['2026-10-17',1050,350,500,200,460,370,130,90],
 ['2026-10-16',780,250,390,140,350,270,100,60],
 ['2026-10-15',930,310,450,170,420,330,110,70],
 ['2026-10-14',810,270,390,150,360,280,100,70],
 ['2026-10-13',720,240,340,140,330,260,70,60]
];
const businessSchema=[
 {key:'hostId',label:'主播ID',width:90,group:'人员资料',default:true,locked:true},
 {key:'nick',label:'昵称',width:70,group:'人员资料',default:true,locked:true},
 {key:'country',label:'国家',width:60,group:'人员资料',default:true},
 {key:'sex',label:'性别',width:50,group:'人员资料',default:true},
 {key:'identity',label:'身份',width:85,group:'人员资料',default:true},
 {key:'proxyId',label:'代理ID',width:90,group:'人员资料',default:true},
 {key:'proxyName',label:'代理名称',width:90,group:'人员资料',default:true},
 {key:'ownerId',label:'代理长ID',width:90,group:'人员资料',default:true},
 {key:'ownerNick',label:'代理长昵称',width:90,group:'人员资料',default:true},
 {key:'operator',label:'所属运营',width:110,group:'人员资料',default:true},
 {key:'duration',label:'总时长（min）',width:100,group:'工作时长',default:true},
 {key:'singleDuration',label:'单人直播（min）',width:115,group:'工作时长'},
 {key:'multiDuration',label:'多人直播（min）',width:115,group:'工作时长'},
 {key:'micDuration',label:'上麦时长（min）',width:115,group:'工作时长'},
 {key:'income',label:'总收入（$）',width:120,group:'业务收入',default:true},
 {key:'lucky',label:'幸运礼物（$）',width:120,group:'业务收入'},
 {key:'normal',label:'普通礼物（$）',width:120,group:'业务收入'},
 {key:'game',label:'游戏收入（$）',width:115,group:'业务收入'},
 {key:'singleIncome',label:'单人直播（$）',width:120,group:'渠道收入'},
 {key:'multiIncome',label:'多人视频（$）',width:120,group:'渠道收入'},
 {key:'audioIncome',label:'音频直播（$）',width:120,group:'渠道收入'},
 {key:'privateIncome',label:'私聊收入（$）',width:115,group:'渠道收入'}
];
const moneyKeys=new Set(['income','lucky','normal','game','singleIncome','multiIncome','audioIncome','privateIncome']);
const businessRows=hosts.slice(0,5).map((a,i)=>({hostId:a[0],nick:a[1],country:a[2].split(' · ')[0],sex:a[2].split(' · ')[1],identity:a[8],proxyId:a[3],proxyName:a[4],ownerId:a[5],ownerNick:a[6],operator:a[7],duration:[452,380,325,288,240][i],singleDuration:[260,210,180,160,130][i],multiDuration:[191.7,169.8,145.1,127.9,109.9][i],micDuration:[147,128,111,96,85][i],income:a[9],lucky:a[10],normal:a[11],game:a[12],singleIncome:a[13],multiIncome:a[14],audioIncome:a[15],privateIncome:a[16]}));
const businessDaily=hostIncomeDaily.map((a,i)=>({...businessRows[0],date:a[0],income:a[1],lucky:a[2],normal:a[3],game:a[4],singleIncome:a[5],multiIncome:a[6],audioIncome:a[7],privateIncome:a[8],duration:[60,74,67,72,63,60,56][i],singleDuration:[35,42,40,40,36,34,33][i],multiDuration:[24.9,31.9,26.9,32,27,26,23][i],micDuration:[20,25,18,26,22,20,16][i]}));
function businessTable(x,y,w,rows,expanded=false){
 const fields=businessSchema.filter(f=>expanded||f.default),columns=[...fields,{key:'action',label:'操作',width:100}];
 const natural=columns.reduce((sum,c)=>sum+c.width,0),scale=natural<w?w/natural:1,cols=columns.map(c=>({...c,width:c.width*scale})),fixedCount=2,rightCount=1;
 const left=cols.slice(0,fixedCount),right=rightCount?cols.slice(-rightCount):[],middle=cols.slice(fixedCount,rightCount?-rightCount:undefined),leftW=left.reduce((a,c)=>a+c.width,0),rightW=right.reduce((a,c)=>a+c.width,0),middleW=middle.reduce((a,c)=>a+c.width,0),viewportW=w-leftW-rightW,scroll=Math.max(0,middleW-viewportW),rowH=56,h=43+rows.length*rowH,clipId='business-'+id+'-'+x+'-'+y;
 rect(x,y,w,43,'#F1F4F9',6,'none');rows.forEach((row,i)=>line(x,y+43+(i+1)*rowH,x+w,y+43+(i+1)*rowH));
 function renderColumn(col,xx){
  let z=10.5;while(width(col.label,z)>col.width-18&&z>9)z-=.5;text(xx+9,y+27,col.label,z,'#596B84',600);
  rows.forEach((row,i)=>{let value=col.key==='action'?'查看详情':moneyKeys.has(col.key)?money(row[col.key]):String(row[col.key]),size=12;while(width(value,size)>col.width-18&&size>10)size-=.5;while(width(value,size)>col.width-18)value=value.slice(0,-2)+'…';const yy=y+43+i*rowH+rowH/2+4;
   link(col.key==='action'?(expanded?31:27):null,()=>text(xx+9,yy,value,size,col.key==='action'?C.purple:C.ink,['income','duration'].includes(col.key)?600:400));
  });
 }
 let xx=x;left.forEach(col=>{renderColumn(col,xx);xx+=col.width;});
 b.push('<defs><clipPath id="'+clipId+'"><rect x="'+(x+leftW)+'" y="'+y+'" width="'+viewportW+'" height="'+h+'"/></clipPath></defs><g clip-path="url(#'+clipId+')">');
 xx=x+leftW-scroll;middle.forEach(col=>{if(xx+col.width>x+leftW&&xx<x+w-rightW)renderColumn(col,xx);xx+=col.width;});b.push('</g>');
 xx=x+w-rightW;right.forEach(col=>{renderColumn(col,xx);xx+=col.width;});rect(x+leftW-1,y,1,h,'#DAE2EF',0,'none');if(rightW)rect(x+w-rightW,y,1,h,'#DAE2EF',0,'none');
 if(scroll>0){const trackX=x+leftW,trackW=viewportW,thumbW=trackW*viewportW/middleW;rect(trackX,y+h+12,trackW,6,'#EBEFF6',3,'none');rect(trackX+trackW-thumbW,y+h+12,thumbW,6,'#AAB7CD',3,'none');text(x,y+h+38,'全部字段 · 当前查看右侧数据，向左滚动可查看人员归属',10,C.sub);}return y+h;
}
function mergedMain(page=10,expanded=false,emit=true){
 shell(page,'主播直播与收入','同一统计周期查看人员、直播时长与分成后收入');scope();
 let y=fields(218,[['统计时间段','2026-10-13 — 2026-10-19','date'],['主播ID','请输入主播ID','input'],['昵称','请输入昵称','input'],['国家'],['性别'],['身份'],['代理ID','请输入代理ID','input'],['代理长ID','请输入代理长ID','input'],['运营人员','全部授权负责人'],['总收入 ≥','最低金额（$）','input'],['总收入 ≤','最高金额（$）','input']],5);y=filtersEnd(y);
 stats(y+12,[['总时长（min）','28,460','按已有工作时长汇总'],['总收入（$）','$48,260.00','分成后所得'],['幸运礼物收入','$15,320.00','业务类型'],['普通礼物收入','$26,480.00','业务类型'],['游戏收入','$6,460.00','业务类型']],90);
 card(X,y+122,CW,476);titlebar(y+140,'主播直播与收入明细','共280名主播 · 近7天含今天');
 if(expanded)btn(1404,y+138,126,'恢复默认',10,false,32);btn(1542,y+138,162,'显示字段 '+(expanded?'22':'12')+'/22',expanded?34:32,false,32);
 const end=businessTable(X+20,y+194,CW-40,businessRows,expanded);pager(expanded?end+44:end+12);if(emit)save(page);
}
const dailyDetailColumns=[
 ['date','日期','',108],['hostId','主播ID','',78],
 ['duration','总时长','min',82],['singleDuration','单人直播','min',90],['multiDuration','多人直播','min',90],['micDuration','上麦时长','min',82],
 ['income','总收入','$',100],['lucky','幸运礼物','$',99],['normal','普通礼物','$',99],['game','游戏','$',90],
 ['singleIncome','单人直播','$',95],['multiIncome','多人视频','$',95],['audioIncome','音频直播','$',95],['privateIncome','私聊','$',95]
];
function dailyDetailTable(x,y,w){
 const scale=w/dailyDetailColumns.reduce((sum,c)=>sum+c[3],0),cols=dailyDetailColumns.map(c=>({key:c[0],label:c[1],unit:c[2],w:c[3]*scale})),headerH=72,rowH=56,h=headerH+businessDaily.length*rowH;
 rect(x,y,w,headerH,'#F1F4F9',6,'none');
 let xx=x;cols.forEach((col,i)=>{if(i<2)text(xx+10,y+43,col.label,11,'#596B84',600);else{text(xx+10,y+47,col.label,11,'#596B84',600);text(xx+10,y+63,'（'+col.unit+'）',10,C.sub);}businessDaily.forEach((row,r)=>{const value=moneyKeys.has(col.key)?money(row[col.key]):String(row[col.key]);text(xx+10,y+headerH+r*rowH+32,value,11,C.ink,['income','duration'].includes(col.key)?600:400);});xx+=col.w;});
 [[2,6,'工作时长'],[6,10,'业务收入'],[10,14,'渠道收入']].forEach(([start,end,label])=>{const gx=x+cols.slice(0,start).reduce((s,c)=>s+c.w,0),gw=cols.slice(start,end).reduce((s,c)=>s+c.w,0);text(gx+(gw-width(label,12))/2,y+20,label,12,C.ink,600);line(gx,y+28,gx+gw,y+28);rect(gx,y,1,h,'#DAE2EF',0,'none');});
 businessDaily.forEach((_,r)=>line(x,y+headerH+(r+1)*rowH,x+w,y+headerH+(r+1)*rowH));return y+h;
}
function mergedDrawer(page=27,expanded=false,emit=true){
 mergedMain(page,expanded,false);const parent=expanded?30:10;link(parent,()=>overlay());const x=330,w=W-x,pad=28,tw=w-pad*2;
 rect(x,64,w,H-64,'white',0,'none');text(x+pad,111,'主播直播与收入详情',23,C.ink,650);text(x+pad,139,'主播ID：U2001  ·  昵称：Lina  ·  身份：超级主播  ·  所属代理：星河代理（G1024）  ·  所属运营：Evan（BD）',12,C.sub);link(parent,()=>text(W-49,111,'×',25,C.sub));
 dateRange(x+pad,164,460);btn(x+500,164,86,'近7天',null,false,32);btn(x+598,164,84,'查询',null,true,32);text(x+710,185,'初始沿用列表周期；可独立查询',11,C.sub);
 function metricRow(y,items){const gap=12,cw=(tw-gap*4)/5;items.forEach((a,i)=>{const xx=x+pad+i*(cw+gap),n=businessDaily.reduce((sum,row)=>sum+row[a[1]],0),value=moneyKeys.has(a[1])?money(n):n.toLocaleString('en-US',{maximumFractionDigits:1});rect(xx,y,cw,76,a[1]==='income'||a[1]==='duration'?C.pale:'#F6F7FB',7,'none');text(xx+14,y+24,a[0],11,C.sub);text(xx+14,y+56,value,23,a[1]==='income'||a[1]==='duration'?C.purple:C.ink,650);});}
 metricRow(218,[['总收入（$）','income'],['幸运礼物收入（$）','lucky'],['普通礼物收入（$）','normal'],['游戏收入（$）','game'],['私聊收入（$）','privateIncome']]);
 metricRow(306,[['总时长（min）','duration'],['单人直播（min）','singleDuration'],['多人直播（min）','multiDuration'],['上麦时长（min）','micDuration']]);
 text(x+pad,420,'每日明细',17,C.ink,650);text(x+pad,447,'已查询：2026-10-13 — 2026-10-19 · 按日期倒序 · 固定展示全部时长与收入明细',11,C.sub);
 dailyDetailTable(x+pad,466,tw);banner(x+pad,963,tw,'汇总覆盖所选周期全部记录；时长保留已有误差，业务收入与渠道收入是不同分类，不跨组相加。');
 line(x+pad,1022,W-pad,1022);text(x+pad,1066,'关闭后回到主播直播与收入列表，保留筛选、分页、列设置和位置。',11,C.sub);btn(W-142,1042,114,'关闭',parent);if(emit)save(page);
}
function columnDialog(page,expanded=false,sourceExpanded=expanded){
 const parent=sourceExpanded?30:10,applyTarget=expanded?30:10,defaultDialog=sourceExpanded?38:32,allDialog=sourceExpanded?34:36;
 mergedMain(page,sourceExpanded,false);link(parent,()=>rect(216,64,W-216,H-64,'#10223B8A',0,'none'));
 const x=410,y=112,w=1020,h=900;rect(x,y,w,h,'white',12);text(x+28,y+42,'显示字段',22,C.ink,650);link(parent,()=>text(x+w-44,y+42,'×',25,C.sub));text(x+28,y+72,'仅调整主列表字段和顺序；每日详情固定展示，不受此设置影响。',12,C.sub);
 btn(x+28,y+96,122,'恢复默认',defaultDialog,false,32);btn(x+162,y+96,122,'全部选中',allDialog,false,32);text(x+304,y+118,(expanded?'22':'12')+' / 22 个业务字段已选中',12,C.sub);if(expanded!==sourceExpanded)pill(x+516,y+99,'待应用','amber');
 const groups=[['人员资料',154],['工作时长',360],['业务收入',468],['渠道收入',576]];
 groups.forEach(([name,top])=>{text(x+28,y+top+22,name,14,C.ink,600);const items=businessSchema.filter(f=>f.group===name);items.forEach((f,i)=>{const xx=x+28+i%2*290,yy=y+top+40+Math.floor(i/2)*32,on=expanded||f.default;rect(xx,yy,16,16,on?C.purple:'white',3,on?C.purple:'#D5DDEA');if(on)text(xx+3,yy+12,'✓',11,'white',600);text(xx+26,yy+13,f.label,12,C.ink);if(f.locked)text(xx+168,yy+13,'固定',10,C.sub);});});
 card(x+656,y+154,336,600);text(x+674,y+183,'显示顺序',14,C.ink,600);text(x+674,y+208,'拖动调整 · 仅应用到主列表',11,C.sub);businessSchema.filter(f=>expanded||f.default).forEach((f,i)=>{const yy=y+238+i*23;text(x+674,yy,'⋮⋮',12,'#A5B2C6');text(x+698,yy,String(i+1).padStart(2,'0'),10,C.sub);text(x+728,yy,f.label,11,C.ink);});
 text(x+28,y+760,'主播ID、昵称固定；所有ID始终各占一列。',11,C.sub);text(x+28,y+786,'应用后只调整显示，不改变统计时间、汇总或权限范围。',11,C.sub);line(x+28,y+816,x+w-28,y+816);btn(x+w-286,y+838,114,'取消',parent);btn(x+w-158,y+838,130,'应用',applyTarget,true);save(page);
}
const agencyLedgerRows=[
 {proxyId:'G1024',proxyName:'星河代理',ownerId:'U1001',created:'2026-04-06\n10:20:00',operator:'Evan · BD',members:24,opened:18,valid:12,income:1200,childIncome:360,parentId:'—',parentOwner:'—'},
 {proxyId:'G1101',proxyName:'晨星代理',ownerId:'U1101',created:'2026-05-12\n14:30:00',operator:'Evan · BD',members:12,opened:9,valid:6,income:760,childIncome:160,parentId:'G1024',parentOwner:'U1001'},
 {proxyId:'G1201',proxyName:'星芒代理',ownerId:'U1201',created:'2026-06-18\n09:15:00',operator:'Evan · BD',members:8,opened:5,valid:3,income:480,childIncome:0,parentId:'G1101',parentOwner:'U1101'},
 {proxyId:'G2100',proxyName:'银河代理',ownerId:'U2100',created:'2026-05-08\n15:20:00',operator:'Aria · BD',members:32,opened:25,valid:20,income:1080,childIncome:240,parentId:'—',parentOwner:'—'},
 {proxyId:'G3100',proxyName:'蓝湾代理',ownerId:'U3100',created:'2026-06-02\n16:35:00',operator:'Nina · 运营',members:26,opened:17,valid:12,income:720,childIncome:126,parentId:'—',parentOwner:'—'}
].map(r=>({...r,openRate:r.members?r.opened/r.members:null,validRate:r.members?r.valid/r.members:null,inclusive:r.income+r.childIncome}));
const agencyLedgerColumns=[
 ['proxyId','代理ID',90],['proxyName','代理名称',100],['ownerId','代理长ID',95],['created','代理创建时间',130],['operator','所属运营',112],
 ['members','直属主播数',95],['opened','开播人数',86],['openRate','开播率',84,'percent'],['valid','有效开播人数',112],['validRate','有效开播率',106,'percent'],
 ['income','收入\n（$）',108,'money'],['childIncome','子代理收入\n（$）',116,'money'],['inclusive','含子代理收入\n（$）',128,'money'],['parentId','上级代理ID',108],['parentOwner','上级代理长ID',118],['action','操作',178]
];
const agencyDayRows=hostIncomeDaily.map((r,i)=>({date:r[0],proxyId:'G1024',members:24,opened:[10,14,12,15,11,13,10][i],valid:[6,9,8,10,7,9,6][i],income:[140,200,190,160,190,170,150][i],childIncome:[40,60,60,50,50,50,50][i]})).map(r=>({...r,openRate:r.opened/r.members,validRate:r.valid/r.members,inclusive:r.income+r.childIncome}));
const agencyDayColumns=[['date','日期',112],['proxyId','代理ID',92],['members','直属主播数',104],['opened','开播人数',98],['openRate','开播率',98,'percent'],['valid','有效开播人数',118],['validRate','有效开播率',118,'percent'],['income','收入\n（$）',120,'money'],['childIncome','子代理收入\n（$）',128,'money'],['inclusive','含子代理收入\n（$）',136,'money']];
const agencyHostRows=agencyDayRows.flatMap((r,i)=>[
 {date:r.date,hostId:'U2001',nick:'Lina',commission:r.income*.6,validDays:1,effective:[35,73.9,66.9,72,63,60,33][i],single:businessDaily[i].singleDuration,multi:businessDaily[i].multiDuration,mic:businessDaily[i].micDuration,total:hostIncomeDaily[i][1],normal:hostIncomeDaily[i][3],lucky:hostIncomeDaily[i][2]},
 {date:r.date,hostId:'U2008',nick:'Anna',commission:r.income*.4,validDays:[0,1,0,1,1,1,1][i],effective:[0,30,0,32,35,28,40][i],single:[25,30,20,32,35,28,40][i],multi:[0,0,20,0,0,0,0][i],mic:[12,14,18,16,15,14,17][i],total:[250,350,310,280,320,300,260][i],normal:[150,210,186,168,192,180,156][i],lucky:[100,140,124,112,128,120,104][i]}
]);
const agencyHostColumns=[['date','日期',104],['hostId','主播ID',82],['nick','主播昵称',80],['commission','贡献佣金\n（$）',108,'money'],['validDays','有效直播天数\n（天）',100],['effective','直播有效时长\n（min）',112],['single','单人直播时长\n（min）',112],['multi','多人直播时长\n（min）',112],['mic','上麦时长\n（min）',98],['total','总收入\n（$）',114,'money'],['normal','普通礼物收入\n（$）',120,'money'],['lucky','幸运礼物收入\n（$）',120,'money']];
function agencyLedgerTable(x,y,w,schema,rows,options={}){
 const {fixed=2,right=0,scrollEnd=false,groups=[],rowH=56,dayTarget=13,hostTarget=14}=options,natural=schema.reduce((v,c)=>v+c[2],0),scale=Math.max(1,w/natural),cols=schema.map(c=>({key:c[0],label:c[1],w:c[2]*scale,format:c[3]}));
 const left=cols.slice(0,fixed),middle=cols.slice(fixed,right?-right:undefined),last=right?cols.slice(-right):[],leftW=left.reduce((v,c)=>v+c.w,0),rightW=last.reduce((v,c)=>v+c.w,0),viewW=w-leftW-rightW,middleW=middle.reduce((v,c)=>v+c.w,0),maxScroll=Math.max(0,middleW-viewW),offset=scrollEnd?maxScroll:0,headerH=72,h=headerH+rowH*rows.length,clip='agency-'+id+'-'+y;
 rect(x,y,w,headerH,'#F1F4F9',6,'none');rows.forEach((_,i)=>line(x,y+headerH+(i+1)*rowH,x+w,y+headerH+(i+1)*rowH));
 function column(c,xx,index){const grouped=groups.some(g=>index>=g[0]&&index<g[1]),labels=c.label.split('\n');labels.forEach((label,j)=>text(xx+10,y+(grouped?47:labels.length>1?34:43)+j*16,label,10.5,'#596B84',600));rows.forEach((r,i)=>{const yy=y+headerH+i*rowH;if(c.key==='action'){link(dayTarget,()=>text(xx+10,yy+rowH/2+4,'代理日数据',11,C.purple));link(hostTarget,()=>text(xx+91,yy+rowH/2+4,'主播日数据',11,C.purple));return;}let value=r[c.key];value=value===null||value===undefined?'—':c.format==='money'?money(value):c.format==='percent'?(value*100).toFixed(1)+'%':String(value);const ls=value.split('\n');ls.forEach((v,j)=>text((c.format==='money'||c.format==='percent'||typeof r[c.key]==='number')?xx+c.w-width(v,ls.length>1?10:11)-12:xx+10,yy+(ls.length>1?rowH/2-5:rowH/2+4)+j*17,v,ls.length>1?10:11,C.ink,['income','inclusive','commission'].includes(c.key)?600:400));});}
 let xx=x;left.forEach((c,i)=>{column(c,xx,i);xx+=c.w;});
 b.push('<defs><clipPath id="'+clip+'"><rect x="'+(x+leftW)+'" y="'+y+'" width="'+viewW+'" height="'+h+'"/></clipPath></defs><g clip-path="url(#'+clip+')">');
 groups.forEach(([start,end,label])=>{const gx=x+cols.slice(0,start).reduce((v,c)=>v+c.w,0)-offset,gw=cols.slice(start,end).reduce((v,c)=>v+c.w,0),vx=x+leftW;if(gx+gw>vx&&gx<vx+viewW){const tx=Math.max(vx+8,Math.min(gx+(gw-width(label,12))/2,vx+viewW-width(label,12)-8));text(tx,y+20,label,12,C.ink,600);line(gx,y+28,gx+gw,y+28);rect(gx,y,1,h,'#DAE2EF',0,'none');}});
 xx=x+leftW-offset;middle.forEach((c,i)=>{if(xx+c.w>x+leftW&&xx<x+w-rightW)column(c,xx,i+fixed);xx+=c.w;});b.push('</g>');xx=x+w-rightW;last.forEach((c,i)=>{column(c,xx,cols.length-right+i);xx+=c.w;});rect(x+leftW,y,1,h,'#DAE2EF',0,'none');if(rightW)rect(x+w-rightW,y,1,h,'#DAE2EF',0,'none');
 if(maxScroll){const thumb=viewW*viewW/middleW;rect(x+leftW,y+h+12,viewW,6,'#EBEFF6',3,'none');rect(x+leftW+(scrollEnd?viewW-thumb:0),y+h+12,thumb,6,'#AAB7CD',3,'none');}return y+h;
}
function agencyBase(page=12,scrollEnd=false){
 shell(page,'代理收入','查看直属主播开播表现、佣金收入与上级关系');scope();
 let y=fields(218,[['代理ID','请输入代理ID','input'],['代理长ID','请输入代理长ID','input'],['上级代理ID','请输入上级代理ID','input'],['上级代理长ID','请输入上级代理长ID','input'],['运营','全部授权负责人'],['统计时间段','2026-10-13 — 2026-10-19','date'],['代理创建时间段','开始日期 — 结束日期','date'],['直属主播数','', 'range'],['有效开播人数','', 'range'],['收入（$）','', 'range']],5);y=filtersEnd(y);
 stats(y+12,[['收入（$）','$6,580.00','直属主播贡献佣金'],['子代理收入（$）','$1,846.00','子代理贡献佣金'],['含子代理收入（$）','$8,426.00','收入 + 子代理收入']],90);
 card(X,y+122,CW,554);titlebar(y+140,'代理收入明细','共18个代理 · 近7天含今天');pill(1364,y+139,'单场直播 > 25分钟有效','gray',10);
 const end=agencyLedgerTable(X+20,y+194,CW-40,agencyLedgerColumns,agencyLedgerRows,{right:1,scrollEnd,groups:[[5,10,'人员与开播'],[10,13,'收入'],[13,15,'上级关系']],rowH:62,dayTarget:scrollEnd?41:13,hostTarget:scrollEnd?42:14});
 btn(X+20,end+34,186,scrollEnd?'← 查看左侧列':'查看右侧列 →',scrollEnd?12:40,false,30);text(X+222,end+54,'固定代理ID、名称及操作；中间列横向滚动',10,C.sub);pager(end+76,'18');
}
function agencyDrawer(page=13,tab=0,sourceRight=false){
 const parent=sourceRight?40:12,dayPage=sourceRight?41:13,hostPage=sourceRight?42:14;agencyBase(page,sourceRight);link(parent,()=>overlay());const x=330,w=W-x,pad=28,tw=w-pad*2;
 rect(x,64,w,H-64,'white',0,'none');text(x+pad,111,'代理收入详情',23,C.ink,650);text(x+pad,139,'代理ID：G1024  ·  代理名称：星河代理  ·  代理长：Maya（U1001）  ·  所属运营：Evan（BD）',12,C.sub);link(parent,()=>text(W-49,111,'×',25,C.sub));
 dateRange(x+pad,164,460);btn(x+500,164,86,'近7天',null,false,32);btn(x+598,164,84,'查询',null,true,32);text(x+710,185,'初始沿用列表周期；两个标签共用所选时间',11,C.sub);
 const items=[['收入（$）','$1,200.00','直属主播贡献佣金'],['子代理收入（$）','$360.00','子代理贡献佣金'],['含子代理收入（$）','$1,560.00','收入 + 子代理收入']];const gap=12,cw=(tw-gap*2)/3;items.forEach((a,i)=>{const xx=x+pad+i*(cw+gap);rect(xx,218,cw,88,i===2?C.pale:'#F6F7FB',8,'none');text(xx+16,241,a[0],12,C.sub);text(xx+16,275,a[1],25,i===2?C.purple:C.ink,650);text(xx+16,294,a[2],10,C.sub);});
 tabbar(x+pad,318,440,['代理日数据','主播日数据'],tab,[dayPage,hostPage]);text(x+pad,390,'已查询：2026-10-13 — 2026-10-19 · 单场直播时长 > 25分钟为有效开播',11,C.sub);
 if(tab===0){text(x+pad,431,'每日代理经营情况',17,C.ink,650);agencyLedgerTable(x+pad,454,tw,agencyDayColumns,agencyDayRows,{groups:[[2,7,'人员与开播'],[7,10,'收入']],rowH:56});text(x+pad,958,'共7条 · 每个日期一行 · 日期倒序',11,C.sub);}else{
 compactField(x+pad,418,240,'主播ID','请输入主播ID','input');compactField(x+pad+254,418,240,'主播昵称','请输入昵称','input');btn(x+pad+508,425,68,'重置',null,false,32);btn(x+pad+588,425,84,'查询',null,true,32);text(x+pad+696,447,'日期倒序，同日贡献佣金倒序',11,C.sub);
 agencyLedgerTable(x+pad,478,tw,agencyHostColumns,agencyHostRows.slice(0,8),{fixed:3,groups:[[4,9,'工作时长与有效天数'],[9,12,'主播分成后收入']],rowH:44});text(x+pad,934,'共168条 · 当前第1页',11,C.sub);text(1460,934,'‹   1   2   3   …   ›',12,C.sub);text(1610,934,'20 条 / 页',11,C.sub);
 }
 banner(x+pad,977,tw,tab===0?'直属主播数不含子代理主播；期间开播人数去重，不将每日人数相加。':'有效直播天数按日为0或1；恰好25分钟不算有效，多场不足门槛不能累加判定。');
 line(x+pad,1030,W-pad,1030);text(x+pad,1073,'关闭后恢复代理收入列表的筛选、分页及横向滚动位置；切换标签保留各自位置。',11,C.sub);btn(W-142,1046,114,'关闭',parent);save(page);
}
function liveRooms(page=18,emit=true){shell(page,'当前直播间列表','查看范围内在播情况；列表字段与画面方式为待确认示意');scope();stats(218,[['当前在播主播','38','范围内已有在播状态'],['当前直播间','32','主播人数与房间数分别展示'],['我的主播','280','可进入人员列表',8]],94);card(X,333,CW,74);compactField(X+16,353,240,'主播ID','请输入主播ID','input');compactField(X+268,353,240,'代理ID','请输入代理ID','input');compactField(X+520,353,240,'渠道类型','全部直播渠道');btn(1540,360,68,'重置',null,false,32);btn(1620,360,88,'查询',null,true,32);text(X,445,'在播直播间',17,C.ink,650);pill(X+135,426,'字段与筛选待确认','amber');
 for(let i=0;i<6;i++){let col=i%3,row=Math.floor(i/3),x=X+col*499,y=470+row*281;card(x,y,474,263);portrait(x+14,y+14,139,230,i);pill(x+27,y+27,'● 在播','green');text(x+172,y+39,hosts[i][1],19,C.ink,650);text(x+172,y+65,hosts[i][0]+' · '+hosts[i][8],11,C.sub);text(x+172,y+96,hosts[i][4]+' / '+hosts[i][3],12,C.ink);text(x+172,y+123,hosts[i][7],11,C.sub);text(x+172,y+155,['单人直播','多人视频直播','音频直播'][i%3]+' · '+['01:42','00:58','02:10'][i%3],12,C.ink);text(x+172,y+183,'当前观众 '+[128,86,42,65,34,51][i]+'  ·  RM'+(88001+i),11,C.sub);btn(x+172,y+203,154,'进入实时审核 →',19,true);}
 if(emit)save(page);}
function audit(page=19,source='live',emit=true){
 const parent=source==='detail'?9:18,patrolTarget=source==='detail'?24:21;if(source==='detail')anchorDetail(page,false);else liveRooms(page,false);link(parent,()=>overlay());const x=470,w=W-x,pad=28;
 rect(x,64,w,H-64,'white',0,'none');text(x+pad,111,'实时审核',23,C.ink,650);text(x+pad,140,(source==='detail'?'主播详情':'直播间列表')+' / Lina · U2001 / RM88001',12,C.sub);link(parent,()=>text(W-49,111,'×',25,C.sub));
 rect(x+pad,163,w-pad*2,65,C.pale,8,'none');text(x+pad+16,189,'星河代理 G1024  ·  Evan / BD  ·  单人直播',13,C.ink,550);text(x+pad+16,212,'本场开播 12:48  ·  已播 01:42  ·  当前观众 128',11,C.sub);pill(1581,183,'● 正在直播','green');
 const lx=x+pad,ly=252,lw=382,rx=902,rw=W-rx-pad;
 card(lx,ly,lw,718);portrait(lx+12,ly+12,lw-24,510,0);pill(lx+28,ly+27,'画面示意占位','gray');rect(lx+12,ly+460,lw-24,62,'#142239CC',0,'none');text(lx+28,ly+487,'Lina  /  RM88001',17,'white',600);text(lx+28,ly+509,'画面更新于14:30:00',11,'#D9E3EE');text(lx+18,ly+563,'主播  Lina / U2001',13,C.ink);text(lx+18,ly+595,'代理长  Maya / U1001',12,C.sub);text(lx+18,ly+626,'实时画面能力及记录字段待确认',11,C.sub);source==='detail'?text(lx+18,ly+680,'当前主播：Lina / U2001',13,C.sub):link(9,()=>text(lx+18,ly+680,'查看主播详情 →',13,C.purple));
 card(rx,ly,rw,334);text(rx+18,ly+34,'近七天巡查',17,C.ink,650);link(patrolTarget,()=>text(rx+rw-151,ly+34,'查看全部七天 →',12,C.purple));text(rx+18,ly+62,'2026-10-19  ·  每天默认10张，可查看更多',12,C.sub);
 for(let i=0;i<10;i++){const xx=rx+18+i*78;portrait(xx,ly+82,64,105,i%4);text(xx,ly+207,['14:28','14:18','14:08','13:58','13:48','13:38','13:28','13:18','13:08','12:58'][i],10,C.sub);}btn(rx+18,ly+232,166,'查看更多当天记录 →',patrolTarget);text(rx+18,ly+307,'图像为示意占位，正式记录采用已有采集结果。',11,C.sub);
 card(rx,608,rw,362);text(rx+18,645,'已有巡查 / 审核记录',17,C.ink,650);pill(rx+245,625,'字段待确认','amber');table(rx+18,674,rw-36,['时间','记录类型','记录内容','操作人'],[['14:30','直播状态','当前在播 · 单人直播','系统'],['14:28','画面记录','保留直播截图','系统'],['13:58','巡查记录','使用已有记录展示','—']],[1,1.3,2.5,.8],56);banner(rx+18,916,rw-36,'查看画面与记录，处置动作尚未定义。');
 line(x+pad,1022,W-pad,1022);text(x+pad,1066,source==='detail'?'关闭后回到主播详情，保留原位置。':'关闭后回到直播间列表，保留筛选与位置。',11,C.sub);btn(W-142,1042,114,'关闭',parent);if(emit)save(page);
}
function patrol(page=20,context='detail',emit=true){
 const parent=context==='auditLive'?18:9,back=context==='auditLive'?19:context==='auditDetail'?23:null,preview=context==='auditLive'?25:context==='auditDetail'?26:22;
 if(parent===18)liveRooms(page,false);else anchorDetail(page,false);link(parent,()=>overlay());const x=470,w=W-x,pad=28;
 rect(x,64,w,H-64,'white',0,'none');if(back!==null){btn(x+pad,84,174,'← 返回实时审核',back);text(x+220,111,'近七天巡查记录',23,C.ink,650);}else{text(x+pad,111,'近七天巡查记录',23,C.ink,650);}link(parent,()=>text(W-49,111,'×',25,C.sub));
 text(x+pad,141,back!==null?'实时审核 / 七天巡查 · 同一抽屉内切换':'主播详情 / 七天巡查',12,C.sub);
 rect(x+pad,164,w-pad*2,64,C.pale,8,'none');text(x+pad+16,190,'Lina / U2001  ·  星河代理 G1024',14,C.ink,600);text(x+pad+16,215,'2026-10-13 — 2026-10-19  ·  每天默认10张，查看更多只扩展当天',11,C.sub);pill(1606,184,'近7天','purple');
 const dates=['2026-10-19','2026-10-18','2026-10-17','2026-10-16','2026-10-15','2026-10-14','2026-10-13'];
 dates.forEach((date,r)=>{const y=246+r*104;card(x+pad,y,w-pad*2,98);text(x+pad+16,y+30,date,12,C.ink,600);text(x+pad+16,y+54,'已加载10张',10,C.sub);
 for(let i=0;i<10;i++){const xx=x+180+i*88;link(preview,()=>{portrait(xx,y+9,78,62,(r+i)%5);text(xx,y+88,['14:28','14:18','14:08','13:58','13:48','13:38','13:28','13:18','13:08','12:58'][i],9,C.sub);});}btn(1568,y+30,140,'查看更多当天 →',null);});
 text(x+pad,994,'点击缩略图查看大图；更多记录在当前抽屉内容区加载。',11,C.sub);line(x+pad,1022,W-pad,1022);text(x+pad,1066,parent===9?'关闭后回到主播详情，保留原页面位置。':'关闭后回到直播间列表，保留筛选与位置。',11,C.sub);btn(W-142,1042,114,'关闭',parent);if(emit)save(page);
}
function imagePreview(page,patrolPage,context){
 patrol(patrolPage,context,false);id=page;link(patrolPage,()=>rect(0,0,W,H,'#0A1424BA',0,'none'));
 const x=560,y=144,w=760,h=852;rect(x,y,w,h,'white',12);text(x+28,y+43,'巡查图片预览',22,C.ink,650);link(patrolPage,()=>text(x+w-43,y+43,'×',25,C.sub));text(x+28,y+74,'Lina / U2001  ·  2026-10-19 14:28  ·  房间 RM88001',12,C.sub);line(x+28,y+94,x+w-28,y+94);
 portrait(x+218,y+113,324,512,0);btn(x+30,y+339,110,'‹ 上一张',null);btn(x+w-140,y+339,110,'下一张 ›',null);text(x+274,y+660,'2026-10-19 14:28',14,C.ink,600);pill(x+330,y+682,'1 / 10','gray');text(x+28,y+751,'关闭预览后回到原巡查抽屉，保留日期与已加载图片。',12,C.sub);btn(x+w-156,y+h-63,128,'关闭预览',patrolPage);save(page);
}

overview();bdBase();save(1);bdDetail();guildBase();save(5);anchorList();anchorDetail();deviceLookup();deviceLookup(29,'mac');mergedMain();mergedDrawer();mergedMain(30,true);mergedDrawer(31,true);columnDialog(32);columnDialog(34,true);columnDialog(36,true,false);columnDialog(38,false,true);agencyBase();save(12);agencyBase(40,true);save(40);agencyDrawer(13,0);agencyDrawer(14,1);agencyDrawer(41,0,true);agencyDrawer(42,1,true);liveRooms();audit();patrol();patrol(21,'auditLive');imagePreview(22,20,'detail');audit(23,'detail');patrol(24,'auditDetail');imagePreview(25,21,'auditLive');imagePreview(26,24,'auditDetail');
if(bounds.length){console.error('Text outside canvas:',bounds);throw Error('Text bounds validation failed');}
pages.forEach(p=>p.links.forEach(target=>{if(!pages.some(q=>q.id===target))throw Error('Missing target '+target);}));
fs.writeFileSync(path.join(__dirname,'pages.json'),JSON.stringify(pages,null,2),'utf8');
const groups=[['首页 / 运营概览',[0]],['组织管理 / BD列表',[1,4]],['组织管理 / 代理列表',[5]],['组织管理 / 主播列表与详情',[8,9,28,29]],['主播详情 / 实时审核、巡查与预览',[23,20,24,22,26]],['直播与收入 / 主播直播与收入',[10,27,30,31,32,34,36,38]],['直播与收入 / 代理收入',[12,40,13,14,41,42]],['直播与收入 / 直播审核、巡查与预览',[18,19,21,25]]];
const kindNames={main:'主界面',subpage:'子页面',drawer:'右侧抽屉',modal:'居中弹窗'};
function roleText(i){const p=pages.find(p=>p.id===i);return kindNames[p.kind];}
function originText(i){const p=pages.find(p=>p.id===i);return p.kind==='main'?'主导航入口':p.replacesDrawer?'同一抽屉切换 · 返回'+defs[p.backId][1]:'来源：'+defs[p.parentId][1];}
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SANO人员与直播管理 · 原型导航</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#192b46;font-family:'Microsoft YaHei',sans-serif}header{background:#0b1c35;color:white;padding:34px 5vw}header p{color:#b8c7da;font-size:14px;line-height:1.9}main{margin:30px 5vw}h2{font-size:19px;margin-top:34px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.card{background:white;border:1px solid #e5eaf2;border-radius:12px;overflow:hidden}img{display:block;width:100%;aspect-ratio:11/7;object-fit:contain;background:#f5f7fb;border-bottom:1px solid #e5eaf2}.body{padding:15px 18px}h3{font-size:14px;margin:0 0 12px}a{color:#6545e8;text-decoration:none;font-size:13px}.actions{display:flex;gap:20px}.type{display:inline-block;background:#f0edff;color:#6545e8;padding:4px 9px;border-radius:12px;font-size:11px;margin-bottom:10px}.context{font-size:12px;color:#6b7c93;min-height:20px}.tip{padding:16px;background:#fff6e5;border-radius:8px;font-size:13px;line-height:1.8}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><header><h1>SANO 人员与直播管理</h1><p>${pages.length}张页面与状态 · PNG评审图 + 可编辑SVG源文件<br>运营Nina的授权范围示例 · 全部数据均为虚构示例 · SVG中的链接可用于浏览主要路径</p></header><main><div class="tip">7个主界面入口（含运营概览），主播直播与收入包含默认、全部字段及列设置状态。抽屉固定14列，顶部一排主播资料；收入在第一排、时长在第二排，九个汇总块等大。字段设置仅用于主表，抽屉保留独立统计时间。代理收入含左右列视图，两个操作直接进入同一抽屉的代理日数据／主播日数据；有效开播为单场直播时长严格大于25分钟。实时审核进入巡查复用同一抽屉，关闭返回底层页面；图片预览关闭只回到巡查抽屉。筛选、树展开和图片加载为静态状态；链接用于原型导航，不执行业务。每天10张为默认加载量，非记录上限。</div>${groups.map(([name,ids])=>`<h2>${name}</h2><div class="grid">${ids.map(i=>`<div class="card"><a href="源文件/${defs[i][0]}.svg"><img src="原型图/${defs[i][0]}.png" loading="lazy" alt="${defs[i][1]}"></a><div class="body"><div class="type">${roleText(i)}</div><h3>${String(pages.findIndex(p=>p.id===i)+1).padStart(2,'0')} · ${defs[i][1]}</h3><p class="context">${originText(i)}</p><div class="actions"><a href="原型图/${defs[i][0]}.png">查看PNG</a><a href="源文件/${defs[i][0]}.svg">打开SVG原型</a></div></div></div>`).join('')}</div>`).join('')}<p style="margin-top:36px"><a href="交互关系说明.md">查看页面层级与返回规则</a> · <a href="../需求文档/人员与直播管理.md">查看需求文档</a></p></main></html>`;
fs.writeFileSync(path.join(root,'原型导航.html'),html,'utf8');
console.log('Generated '+pages.length+' SVG prototypes and navigation.');

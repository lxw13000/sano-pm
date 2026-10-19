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
['admin-05-01-01-主播收入数据','主播收入数据 · 全部收入列','income'],
['reserved-income-state','保留编号（收入列已合并）','income','retired'],
['admin-06-01-01-代理收入数据','代理收入数据','agency'],
['admin-06-01-02-代理收入抽屉-每日汇总','代理收入 · 每日汇总','agency','drawer'],
['admin-06-01-03-代理收入抽屉-主播明细','代理收入 · 主播明细','agency','drawer'],
['admin-06-01-04-代理收入抽屉-子代理明细','代理收入 · 子代理明细','agency','drawer'],
['admin-07-01-01-主播工作数据','主播工作数据','work'],
['admin-07-01-02-主播工作每日明细抽屉','主播工作 · 每日明细','work','drawer'],
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
 ['admin-08-03-06-巡查图片预览-主播审核来源','图片预览弹窗 · 主播审核来源','anchor','modal']
);
const pages=[],bounds=[];let b=[],links=[],id=0;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const width=(s,z)=>[...String(s)].reduce((v,c)=>v+(/[\u2E80-\uFFFF]/.test(c)?z:z*.56),0);
function text(x,y,s,z=14,col=C.ink,weight=400){b.push(`<text xml:space="preserve" x="${x}" y="${y}" font-size="${z}" fill="${col}" font-weight="${weight}">${esc(s)}</text>`);if(x<0||x+width(s,z)>W+1||y>H)bounds.push([id,x,y,s]);}
function rect(x,y,w,h,fill='white',r=10,stroke=C.line){b.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`);}
function line(x,y,x2,y2,col=C.line){b.push(`<path d="M${x} ${y}H${x2}" transform="${y2===y?'':`rotate(${Math.atan2(y2-y,x2-x)*180/Math.PI} ${x} ${y})`}" stroke="${col}" fill="none"/>`);}
function circle(x,y,r,col){b.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`);}
function link(target,draw){if(target===undefined||target===null){draw();return;}links.push(target);b.push(`<a href="${defs[target][0]}.svg">`);draw();b.push('</a>');}
function btn(x,y,w,label,target,primary=false,h=38){link(target,()=>{rect(x,y,w,h,primary?C.purple:'white',7,primary?C.purple:'#DAE1ED');text(x+14,y+h/2+5,label,13,primary?'white':C.purple,550);});}
function pill(x,y,label,tone='purple',z=11){const pair={purple:[C.pale,C.purple],green:[C.greenBg,C.green],amber:[C.amberBg,C.amber],gray:['#EDF1F6',C.sub],red:['#FFF0F3',C.red]}[tone];let w=width(label,z)+20;rect(x,y,w,24,pair[0],12,'none');text(x+10,y+16,label,z,pair[1],550);return w;}
function card(x,y,w,h){rect(x,y,w,h);}
function icon(x,y,type,col){const paths={overview:'M2 2h6v6H2z M12 2h6v6h-6z M2 12h6v6H2z M12 12h6v6h-6z',bd:'M4 18v-4h12v4 M6 6a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',guild:'M3 18V7h14v11 M7 7V2h6v5 M7 11h2 M12 11h2 M7 15h2 M12 15h2',anchor:'M3 18c0-6 14-6 14 0 M6 6a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',income:'M2 5h16v12H2z M2 9h16 M12 13h3',agency:'M2 5h16v12H2z M6 2v6 M14 2v6 M6 12h8',work:'M10 1a9 9 0 1 0 .1 0 M10 5v5l4 2',live:'M2 4h12v13H2z M14 8l5-3v11l-5-3'};b.push(`<path d="${paths[type]}" transform="translate(${x},${y})" fill="none" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/>`);}
function shell(page,title,subtitle){id=page;b=[];links=[];b.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>text{font-family:"Microsoft YaHei","Segoe UI",sans-serif}a{cursor:pointer}</style>`);rect(0,0,W,H,C.bg,0,'none');rect(0,0,216,H,C.nav,0,'none');text(28,48,'SANO',29,'white',750);text(29,73,'人员与直播管理',12,'#A0B0C7');
 const activeKey=defs[page][2];
 link(0,()=>{if(activeKey==='overview')rect(14,111,188,42,C.purple,8,'none');icon(29,122,'overview',activeKey==='overview'?'white':'#9CAEC6');text(62,138,'运营概览',14,activeKey==='overview'?'white':'#BBC8D9',activeKey==='overview'?600:400);});
 const navGroups=[['组织管理',178,[['BD列表',1,'bd'],['代理列表',5,'guild'],['主播列表',8,'anchor']]],['直播与收入',394,[['主播收入',10,'income'],['代理收入',12,'agency'],['主播工作',16,'work'],['直播审核',18,'live']]]];
 navGroups.forEach(([label,top,items])=>{icon(29,top+3,label==='组织管理'?'guild':'income','#A4B6CF');text(60,top+18,label,14,'#E1E8F3',600);text(180,top+18,'⌄',14,'#A4B6CF');items.forEach(([name,target,key],i)=>{const yy=top+35+i*44,on=key===activeKey;link(target,()=>{if(on)rect(30,yy,172,38,C.purple,7,'none');circle(46,yy+19,2.5,on?'white':'#536C8D');text(63,yy+25,name,13,on?'white':'#AABDD3',on?600:400);});});});
 rect(18,929,180,98,'#142943',9,'none');circle(43,959,13,'#4C4490');text(37,964,'N',13,'white',600);text(65,957,'Nina',13,'white',600);text(65,978,'运营 · 当前授权范围',10,'#A1B2CB');text(30,1008,'3 BD  /  18 代理',11,'#A1B2CB');text(28,1082,'SANO · 管理后台',10,'#738CA9');
 rect(216,0,W-216,64,'white',0);if([9,20,22,23,24,26].includes(page)){text(X,39,'组织管理  /',13,C.sub);link(8,()=>text(X+88,39,'主播列表',13,C.purple));text(X+158,39,'/  主播详情',13,C.sub);}else{text(X,39,(defs[page][2]==='overview'?'首页':(['bd','guild','anchor'].includes(defs[page][2])?'组织管理':'直播与收入'))+'  /  '+title,13,C.sub);}pill(1373,20,'原型示例数据','amber');text(1535,39,'Nina  ·  运营',12,C.sub);
 if([9,20,22,23,24,26].includes(page)){btn(X,84,168,'← 返回主播列表',8);text(X+190,112,title,27,C.ink,700);}else{text(X,112,title,27,C.ink,700);}text(X,140,subtitle,13,C.sub);pill(1519,89,'我的授权范围','purple');
 line(X,1081,1724,1081);text(X,1103,'示例数据仅供评审  ·  数据范围：运营 Nina  ·  金额 USD  ·  时区 UTC+8',10,C.sub);text(1470,1103,defs[page][0].split('-').slice(0,4).join('-')+'  /  V1',10,C.sub);
}
function scope(y=160,label='我的管理范围：3个BD / 18个代理 / 280名主播'){rect(X,y,CW,38,C.pale,7,'none');circle(X+16,y+19,3,C.purple);text(X+29,y+24,label,12,C.purple);text(1446,y+24,'今日数据更新于 14:30',11,C.sub);}
function stats(y,items,h=96){const gap=14,w=(CW-gap*(items.length-1))/items.length;items.forEach((a,i)=>{const x=X+i*(w+gap);link(a[3],()=>{card(x,y,w,h);text(x+18,y+26,a[0],12,C.sub);text(x+18,y+61,a[1],27,a[4]||C.ink,650);if(a[2])text(x+18,y+h-13,a[2],10,C.sub);});});}
function fields(y,items,cols=5){const rowH=78,gap=18,w=(CW-40-gap*(cols-1))/cols;card(X,y,CW,Math.ceil(items.length/cols)*rowH+74);items.forEach((a,i)=>field(X+20+(i%cols)*(w+gap),y+21+Math.floor(i/cols)*rowH,w,a[0],a[1]||'全部',a[2]));return y+Math.ceil(items.length/cols)*rowH+74;}
function field(x,y,w,label,value='全部',kind='select'){text(x,y,label,11,C.sub,500);rect(x,y+10,w,35,'white',6,'#DDE4EF');text(x+11,y+33,value,12,value.startsWith('请输入')||value.startsWith('请选择')?'#A0ACBD':C.ink);if(kind!=='input')text(x+w-22,y+33,kind==='date'?'▦':'⌄',13,C.sub);}
function filtersEnd(y,extra=''){text(X+20,y+24,extra,11,C.sub);btn(1512,y+1,84,'重置');btn(1608,y+1,96,'查询',null,true);return y+54;}
function titlebar(y,title,count,action){text(X+20,y+23,title,16,C.ink,650);if(count)text(X+20+width(title,16)+16,y+23,count,11,C.sub);if(action)btn(1570,y-2,134,action[0],action[1],true);}
function tabbar(x,y,w,labels,active,targets){labels.forEach((s,i)=>{let xx=x+i*w/labels.length;link(targets?.[i],()=>{text(xx+18,y+25,s,13,i===active?C.purple:C.sub,i===active?650:400);if(i===active)rect(xx+18,y+38,width(s,13),3,C.purple,1,'none');});});line(x,y+42,x+w,y+42);}
function table(x,y,w,headers,rows,weights,rowH=61,options={}){const total=weights.reduce((a,c)=>a+c,0),ww=weights.map(n=>n*w/total);rect(x,y,w,43,'#F1F4F9',6,'none');let xx=x;headers.forEach((s,i)=>{text(xx+12,y+27,s,11,'#596B84',600);xx+=ww[i];});rows.forEach((row,r)=>{let yy=y+43+r*rowH;if(options.high===r)rect(x,yy,w,rowH,'#F8F6FF',0,'none');line(x,yy+rowH,x+w,yy+rowH);let cx=x;row.forEach((cell,c)=>{const object=typeof cell==='object'?cell:{t:cell};const ls=String(object.t).split('\n');if(object.actions){let ax=cx+12;object.actions.forEach(([label,target],ai)=>{link(target,()=>text(ax,yy+rowH/2+4,label,11,C.purple));ax+=width(label,11)+13;});cx+=ww[c];return;}link(object.to,()=>{ls.forEach((s,j)=>{let z=j?10:12;while(width(s,z)>ww[c]-24&&z>9)z-=.5;text(cx+12,yy+(ls.length===1?rowH/2+4:ls.length===2?rowH/2-5:16)+j*17,s,z,j?C.sub:object.color||C.ink,object.bold?600:400);});});cx+=ww[c];});});return y+43+rows.length*rowH;}
function pager(y,total='280',size='20'){text(X+20,y+25,'共 '+total+' 条',11,C.sub);text(1394,y+25,'‹',15,C.sub);pill(1420,y+7,'1');text(1470,y+25,Number(total)>Number(size)?'2    3    …    ›':'›',12,C.sub);rect(1580,y+4,124,32,'white',6);text(1593,y+25,size+' 条 / 页  ⌄',11,C.sub);}
function banner(x,y,w,msg){rect(x,y,w,34,'#F4F6FA',6,'none');text(x+12,y+22,msg,11,C.sub);}
const uiRelations={4:{parentId:1},9:{parentId:8},13:{parentId:12},14:{parentId:12},15:{parentId:12},17:{parentId:16},19:{parentId:18},20:{parentId:9},21:{parentId:18,backId:19,replacesDrawer:true},22:{parentId:20},23:{parentId:9},24:{parentId:9,backId:23,replacesDrawer:true},25:{parentId:21},26:{parentId:24}};
function save(page){b.push('</svg>');fs.writeFileSync(path.join(src,defs[page][0]+'.svg'),b.join('\n'),'utf8');pages.push({id:page,file:defs[page][0],name:defs[page][1],kind:defs[page][3]||'main',...(uiRelations[page]||{}),links:[...new Set(links)],width:W,height:H});}
function money(n){return '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function avatar(x,y,name,color=C.purple,r=17){circle(x,y,r,color+'18');text(x-r*.35,y+r*.35,name.slice(0,1),r*.85,color,600);}
function portrait(x,y,w,h,seed=0){const colors=['#D8D1E7','#C9DDDC','#EBD9CF','#CFDAEC','#E3D1D8'];const bg=colors[seed%colors.length];rect(x,y,w,h,bg,8,'none');b.push(`<g clip-path="url(#clip-${id}-${x}-${y})"><defs><clipPath id="clip-${id}-${x}-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/></clipPath></defs><ellipse cx="${x+w*.52}" cy="${y+h*.85}" rx="${w*.43}" ry="${h*.38}" fill="${['#6E688E','#386F73','#896353'][seed%3]}"/><ellipse cx="${x+w*.5}" cy="${y+h*.42}" rx="${w*.22}" ry="${h*.29}" fill="#3E3444"/><ellipse cx="${x+w*.5}" cy="${y+h*.44}" rx="${w*.16}" ry="${h*.20}" fill="#E5B49D"/><path d="M${x+w*.34} ${y+h*.36}Q${x+w*.40} ${y+h*.16} ${x+w*.67} ${y+h*.35}" stroke="#3E3444" stroke-width="${w*.08}" fill="none"/><circle cx="${x+w*.44}" cy="${y+h*.42}" r="${w*.012}" fill="#574350"/><circle cx="${x+w*.56}" cy="${y+h*.42}" r="${w*.012}" fill="#574350"/><path d="M${x+w*.46} ${y+h*.51}q${w*.04} ${h*.025} ${w*.08} 0" stroke="#A97074" stroke-width="${Math.max(1,w*.008)}" fill="none"/></g>`);}
const hosts=[
['U2001','Lina','TH · 女','G1024','星河代理','U1001','Maya','Leo · BD','超级主播',6240,2100,3000,1140,2800,2200,740,500,150,452,260,150],
['U2002','Nok','TH · 女','G1101','晨星代理','U1101','Tom','Leo · BD','优质主播',4320,1200,2400,720,2000,1200,620,500,0,380,210,145],
['U2003','June','VN · 女','G1201','星芒代理','U1201','Amy','Leo · BD','主播',2880,960,1560,360,1300,900,380,300,80,325,180,110],
['U2004','Arun','IN · 男','G2100','银河代理','U2100','Ravi','Aria · BD','主播',2460,780,1320,360,1100,860,300,200,0,288,160,104],
['U2005','Ploy','TH · 女','G3100','蓝湾代理','U3100','Mali','Nina · 运营','优质主播',1920,600,1080,240,800,620,300,200,60,240,130,85],
['U2006','Mina','PH · 女','G3200','海蓝代理','U3200','Lily','Max · BD','主播',1680,480,960,240,700,540,240,200,0,216,110,80],
['U2007','Kai','VN · 男','G1101','晨星代理','U1101','Tom','Leo · BD','主播',1080,360,600,120,480,300,180,120,0,180,100,60],
['U2008','Anna','PH · 女','G1024','星河代理','U1001','Maya','Leo · BD','超级主播',960,240,600,120,400,300,160,100,30,165,90,55]
];
const guildRows=[
[{t:'▾ 星河代理\nG1024',to:12,bold:true},'Maya · U1001\n+66 81 245 6801','A级代理\n20%','Leo · BD\nBD1001','24 / 6 / 2\n主播 / 优质 / 超级','—\n顶级代理','—','2026-04-06\n10:20:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'    ▾ 晨星代理\n       G1101',to:12},'Tom · U1101\n+66 82 160 4532','B级代理\n16%','Leo · BD\nBD1001','12 / 3 / 1\n主播 / 优质 / 超级','星河代理\nG1024','Maya\nU1001','2026-05-12\n14:30:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'        星芒代理\n        G1201',to:12},'Amy · U1201\n+84 91 426 8810','C级代理\n12%','Leo · BD\nBD1001','8 / 2 / 0\n主播 / 优质 / 超级','晨星代理\nG1101','Tom\nU1101','2026-06-18\n09:15:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'    月光代理\n    G1102',to:12},'May · U1102\n+66 89 172 6008','C级代理\n8%','Leo · BD\nBD1001','16 / 4 / 1\n主播 / 优质 / 超级','星河代理\nG1024','Maya\nU1001','2026-06-20\n11:40:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'▸ 银河代理\nG2100',to:12},'Ravi · U2100\n+91 98 451 3302','A级代理\n20%','Aria · BD\nBD1002','32 / 7 / 3\n主播 / 优质 / 超级','—\n顶级代理','—','2026-05-08\n15:20:00',{t:'主播列表',actions:[['主播列表',8]]}],
[{t:'▸ 蓝湾代理\nG3100',to:12},'Mali · U3100\n+66 87 604 7712','B级代理\n16%','Nina · 运营\nOP1001','18 / 5 / 2\n主播 / 优质 / 超级','—\n顶级代理','—','2026-06-02\n16:35:00',{t:'主播列表',actions:[['主播列表',8]]}]
];
function bdBase(page=1){shell(page,'BD列表','查看BD基础资料、运营归属与负责情况');scope();let yy=fields(218,[['ID','请输入BD ID','input'],['名称','请输入名称','input'],['国家代码'],['所属运营','Nina · OP1001'],['创建时间段','开始日期 — 结束日期','date']]);yy=filtersEnd(yy-52);card(X,yy+12,CW,458);titlebar(yy+31,'BD列表','共3个BD');let end=table(X+20,yy+78,CW-40,['名称 / ID','联系方式','国家代码','所属运营','账号状态','创建时间','操作'],[
[{t:'Leo\nBD1001',to:4,bold:true},'+66 82 451 6630','TH','Nina · OP1001',{t:'● 正常',color:C.green},'2026-04-01 10:20',{t:'具体情况',actions:[['具体情况',4]]}],
[{t:'Aria\nBD1002',to:4,bold:true},'+91 98 154 2731','IN','Nina · OP1001',{t:'● 正常',color:C.green},'2026-05-06 15:40',{t:'具体情况',actions:[['具体情况',4]]}],
[{t:'Max\nBD1003',to:4,bold:true},'+63 91 564 8220','PH','Nina · OP1001',{t:'● 禁用',color:C.red},'2026-06-12 09:10',{t:'具体情况',actions:[['具体情况',4]]}]
],[1.3,1.5,.75,1.3,.8,1.6,1.4],74);pager(end+12,'3');banner(X,yy+490,CW,'查看BD资料及负责情况；点击具体情况打开右侧抽屉。');}
function guildBase(page=5){shell(page,'代理列表','树形查看代理层级、实际负责人和直属主播结构');scope();let yy=fields(218,[['代理ID','请输入代理ID','input'],['代理长ID','请输入代理长ID','input'],['上级代理ID','请输入上级代理ID','input'],['上级代理长ID','请输入上级代理长ID','input'],['代理等级'],['创建时间段','开始日期 — 结束日期','date'],['所属运营','BD / 直属运营'],['分成比例','4% / 8% / 12% / 16% / 20%']],5);yy=filtersEnd(yy-52,'当前显示：直属人数  ·  展开层级不会改变父行人数');card(X,yy+12,CW,566);titlebar(yy+31,'代理列表','共18个代理');let end=table(X+20,yy+78,CW-40,['代理名称 / ID','代理长 / WhatsApp','等级 / 比例','所属运营','直属主播结构','上级代理','上级代理长','创建时间','操作'],guildRows,[1.45,1.55,.85,1.05,1.15,1.1,1,1.15,1.35],65,{high:1});pager(end+10,'18');}
function overlay(){rect(216,64,W-216,H-64,'#10223B80',0,'none');}
function overview(){shell(0,'我的运营概览','先了解自己的管理规模，再进入人员列表与业务明细');scope();btn(1460,219,264,'2026-10-13 — 2026-10-19 ▦');text(X,244,'人员与组织',16,C.ink,650);stats(270,[['BD数量','3','查看BD及负责情况',1],['代理数量','18','包含授权范围内子代理',5],['主播总人数','280','按主播ID去重',8],['超级主播','18','已有身份结果',8],['优质主播','56','已有身份结果',8],['当前在播','38','按已有在播状态',18,C.green]],100);
 text(X,409,'收入与冻结收益',16,C.ink,650);stats(430,[['主播总收入','$48,260.00','近7天 · 主播分成后所得',10],['幸运礼物收入','$15,320.00','业务类型 · 不与渠道金额重复相加',10],['普通礼物收入','$26,480.00','业务类型 · 游戏收入 $6,460.00',10],['代理总收入','$8,426.00','已有代理收入汇总',12],['主播冻结收益','$1,380.00','范围内主播 · 金额时点待核对',9,C.amber]],110);
 card(X,566,720,226);text(X+22,599,'我管理的BD',17,C.ink,650);link(1,()=>text(X+611,599,'查看全部 →',12,C.purple));table(X+20,617,680,['BD / ID','所属运营','代理数','主播数','状态'],[
 [{t:'Leo · BD1001',to:4},'Nina','5','96',{t:'正常',color:C.green}],['Aria · BD1002','Nina','6','104',{t:'正常',color:C.green}],['Max · BD1003','Nina','4','62',{t:'禁用',color:C.red}]
 ],[1.9,1.2,.8,.8,.8],39);
 card(994,566,730,226);text(1016,599,'当前在播',17,C.ink,650);link(18,()=>text(1600,599,'进入直播间 →',12,C.purple));hosts.slice(0,3).forEach((a,i)=>{let xx=1016+i*230;portrait(xx,618,70,112,i);text(xx+83,641,a[1],14,C.ink,600);pill(xx+83,651,a[8],a[8]==='超级主播'?'purple':'green');text(xx+83,696,'开播 '+['01:42','00:58','02:10'][i],11,C.sub);link(18,()=>text(xx+83,721,'查看直播间 →',11,C.purple));});
 card(X,814,CW,229);text(X+22,849,'从这里继续查看',17,C.ink,650);const paths=[['代理关系','展开代理层级，查直属主播结构',5],['主播收入','按业务与渠道查看分成后所得',10],['代理收入','每日汇总、主播及子代理贡献',12],['主播工作','总时长与每日工作记录',16]];paths.forEach((a,i)=>{let x=X+22+i*361;link(a[2],()=>{rect(x,874,339,118,'#F8F9FD',8,'none');text(x+18,907,a[0],15,C.ink,600);text(x+18,934,a[1],11,C.sub);text(x+18,971,'查看详情 →',12,C.purple);});});save(0);}
function bdDetail(){
 bdBase(4);link(1,()=>overlay());const x=594,w=W-x,pad=28,inner=w-pad*2;
 rect(x,64,w,H-64,'white',0,'none');text(x+pad,111,'BD具体情况',23,C.ink,650);text(x+pad,140,'BD列表 / Leo · BD1001',12,C.sub);link(1,()=>text(W-49,111,'×',25,C.sub));
 rect(x+pad,163,inner,108,'#F7F8FC',9,'none');avatar(x+58,202,'L',C.purple,23);text(x+99,196,'Leo',23,C.ink,650);pill(x+165,178,'正常','green');text(x+99,224,'BD1001  ·  TH  ·  +66 82 451 6630',12,C.sub);text(x+99,250,'所属运营 Nina / OP1001    创建时间 2026-04-01 10:20',11,C.sub);
 const items=[['负责代理','5'],['主播人数','96'],['超级主播','6'],['优质主播','18']];const sw=(inner-36)/4;items.forEach((a,i)=>{let xx=x+pad+i*(sw+12);card(xx,291,sw,94);text(xx+16,317,a[0],12,C.sub);text(xx+16,355,a[1],27,C.ink,650);});
 text(x+pad,431,'负责代理',16,C.ink,650);text(x+136,431,'部分节点示例 · 人数均为直属口径',11,C.sub);
 table(x+pad,453,inner,['代理 / ID','代理长','上级代理','分成比例','直属主播结构','操作'],guildRows.slice(0,4).map(r=>[r[0],r[1].split('\n')[0],r[5],r[2].split('\n')[1],r[4],{t:'主播列表 →',to:8,color:C.purple}]),[1.5,1.3,1.3,.8,1.4,1.1],74);
 btn(x+pad,849,170,'查看主播收入 →',10);btn(x+pad+186,849,170,'查看主播工作 →',16);
 line(x+pad,1022,W-pad,1022);text(x+pad,1066,'关闭抽屉后，保留BD列表的筛选与位置。',11,C.sub);btn(W-142,1042,114,'关闭',1);save(4);
}
function anchorList(){shell(8,'主播列表','按人员身份与归属查找主播，点击进入同一份个人详情');scope();let y=fields(218,[['主播ID','请输入主播ID','input'],['昵称','请输入昵称','input'],['国家'],['代理ID','请输入代理ID','input'],['性别'],['注册时间段','开始日期 — 结束日期','date'],['是否实名']],5);y=filtersEnd(y-52);card(X,y+12,CW,572);titlebar(y+31,'主播列表','共280名主播');let end=table(X+20,y+78,CW-40,['主播ID / 昵称','国家 / 性别','代理ID / 昵称','所属运营','身份','实名认证','注册时间','操作'],hosts.slice(0,6).map((a,i)=>[{t:a[1]+'\n'+a[0],to:9,bold:true},a[2],a[4]+'\n'+a[3],a[7],{t:a[8],color:a[8]==='超级主播'?C.purple:a[8]==='优质主播'?C.green:C.ink},{t:'已实名',color:C.green},'2026-0'+(4+i%3)+'-'+(12+i)+'\n10:20:00',{t:'查看详情 →',to:9,color:C.purple}]),[1.3,1,1.5,1.2,1.1,1,1.4,1],66);pager(end+8);save(8);}
function anchorDetail(page=9,emit=true){
 shell(page,'主播详情','由主播列表进入 · 收入构成与每日工作记录同页展示');scope(160,'当前主播：Lina / U2001  ·  星河代理 G1024  ·  负责人 Leo / BD');
 card(X,218,CW,122);avatar(300,269,'L',C.purple,29);text(350,259,'Lina',25,C.ink,650);pill(427,239,'超级主播');pill(528,239,'已实名','green');text(350,291,'U2001  ·  泰国 TH  ·  女  ·  注册 2026-04-12 10:20',12,C.sub);text(1050,258,'代理长  Maya / U1001',12,C.ink);text(1050,290,'当前状态  ● 正在直播',12,C.green);btn(1520,251,180,'进入实时审核 →',23,true);
 stats(360,[['近7天收入','$6,240.00','分成后所得'],['本人消费','$286.00','个人消费示意 · 明细待细化'],['冻结收益','$150.00','使用已有冻结收益字段'],['总工作时长','452 min','允许已有计算误差']],103);
 card(X,486,934,562);text(X+22,522,'直播与收入',17,C.ink,650);btn(1000,497,164,'近7天 ▾');text(X+22,557,'收入构成（$）',13,C.ink,600);text(X+164,557,'业务类型与渠道类型同时展示',11,C.sub);
 const mx=X+22,mw=890;
 function amounts(y,items,tone){const gap=10,ww=(mw-gap*(items.length-1))/items.length;items.forEach((a,i)=>{let xx=mx+i*(ww+gap);rect(xx,y,ww,55,tone,6,'none');text(xx+13,y+19,a[0],11,C.sub);text(xx+13,y+43,a[1],18,C.ink,650);});}
 amounts(572,[['幸运礼物收入','$2,100.00'],['普通礼物收入','$3,000.00'],['游戏收入','$1,140.00']],'#F1F5FF');
 amounts(636,[['单人直播收入','$2,800.00'],['多人视频直播收入','$2,200.00'],['音频直播收入','$740.00'],['私聊收入','$500.00']],'#EDF7F3');
 text(X+22,728,'每日收入与工作记录',14,C.ink,650);text(970,728,'近7天 · 时长 min',11,C.sub);
 table(mx,748,mw,['日期','总收入（$）','总时长（min）','单人（min）','多人（min）','上麦（min）'],['10-19','10-18','10-17','10-16','10-15','10-14','10-13'].map((d,i)=>[d,money([850,1100,1050,780,930,810,720][i]),[60,74,67,72,63,60,56][i],[35,42,40,40,36,34,33][i],[24.9,31.9,26.9,32,27,26,23][i],[20,25,18,26,22,20,16][i]]),[1,1.25,1.2,1.1,1.1,1.1],32);
 text(X+22,1036,'今日更新于14:30 · 历史数据固定 · 保留已有时长计算误差',10,C.sub);
 card(1208,486,516,251);text(1230,522,'身份与归属',17,C.ink,650);[['所属代理','星河代理 / G1024'],['代理长','Maya / U1001'],['所属运营','Leo / BD1001'],['上级代理','无上级代理']].forEach((a,i)=>{text(1230,565+i*37,a[0],12,C.sub);text(1350,565+i*37,a[1],12,C.ink);});card(1208,757,516,291);text(1230,793,'近七天巡查',17,C.ink,650);text(1230,820,'按天查看截图，每天默认10张',12,C.sub);for(let i=0;i<4;i++)portrait(1230+i*116,840,99,115,i);link(20,()=>text(1230,1006,'查看七天记录 →',13,C.purple));if(emit)save(page);
}
function income(){
 const page=10;shell(page,'主播收入数据','分成后所得 · 业务类型与渠道类型各列同时展示');scope();let y=fields(218,[['主播ID','请输入主播ID','input'],['代理ID','请输入代理ID','input'],['代理长ID','请输入代理长ID','input'],['运营人员','全部授权负责人'],['统计时间段','2026-10-13 — 2026-10-19','date'],['国家地区'],['性别'],['总收入 ≥','最低金额（$）','input'],['总收入 ≤','最高金额（$）','input']],5);y=filtersEnd(y-52);
 stats(y+12,[['主播总收入','$48,260.00','分成后总计'],['幸运礼物收入','$15,320.00','业务类型'],['普通礼物收入','$26,480.00','业务类型'],['游戏收入','$6,460.00','业务类型']],94);
 card(X,y+124,CW,480);titlebar(y+143,'主播收入明细','近7天 · 含今天');
 const tx=X+20,tw=CW-40,weights=[110,70,110,100,100,110,115,115,100,110,110,100,90],sum=weights.reduce((a,n)=>a+n,0);let gx=tx;
 [[5,'人员与归属','#F1F4F9',C.sub],[1,'总收入','#EDE9FE',C.purple],[3,'业务类型收入','#EFF5FF',C.blue],[4,'渠道类型收入','#EAF6F2',C.green]].forEach(([n,label,bg,fg],i)=>{const offset=[0,5,6,9][i],gw=weights.slice(offset,offset+n).reduce((a,v)=>a+v,0)*tw/sum;rect(gx,y+175,gw-3,27,bg,4,'none');text(gx+12,y+193,label,11,fg,600);gx+=gw;});
 const headers=['主播 / ID','国家 / 性别','代理 / ID','代理长 / ID','运营人员','总收入（$）','幸运礼物（$）','普通礼物（$）','游戏（$）','单人直播（$）','多人视频（$）','音频直播（$）','私聊（$）'];
 const rows=hosts.slice(0,5).map(a=>[{t:a[1]+'\n'+a[0],to:9,bold:true},a[2],a[4]+'\n'+a[3],a[6]+'\n'+a[5],a[7],{t:money(a[9]),bold:true},...a.slice(10,17).map(money)]);
 const end=table(tx,y+209,tw,headers,rows,weights,56);pager(end+8);banner(X,y+578,CW,'业务类型与渠道类型同时展示，两个维度不重复相加。今日更新于14:30，历史数据固定。');save(page);
}
const agencies=[['星河代理\nG1024','Maya\nU1001','20%','Leo · BD',1560,1200,360],['晨星代理\nG1101','Tom\nU1101','16%','Leo · BD',920,760,160],['星芒代理\nG1201','Amy\nU1201','12%','Leo · BD',480,480,0],['银河代理\nG2100','Ravi\nU2100','20%','Aria · BD',1320,1080,240],['蓝湾代理\nG3100','Mali\nU3100','16%','Nina · 运营',846,720,126]];
function agencyBase(page=12){
 shell(page,'代理收入数据','查看代理提成收入，以及直属主播和子代理的贡献来源');scope();
 let y=fields(218,[['代理ID','请输入代理ID','input'],['代理长ID','请输入代理长ID','input'],['运营人员','全部授权负责人'],['代理创建时间段','开始日期 — 结束日期','date'],['统计时间段','2026-10-13 — 2026-10-19','date'],['总收入 ≥','最低金额（$）','input'],['总收入 ≤','最高金额（$）','input']],5);
 y=filtersEnd(y-52,'代理创建时间用于筛选代理，统计时间用于汇总收入');
 stats(y+12,[['代理总收入','$8,426.00','范围内代理 · 已有汇总'],['直属主播提成收入','$6,580.00','实际归属当前代理'],['子代理提成收入','$1,846.00','实际归属当前代理']],94);
 card(X,y+124,CW,480);titlebar(y+143,'代理收入明细','共18个代理');
 const creation=['2026-04-06\n10:20:00','2026-05-12\n14:30:00','2026-06-18\n09:15:00','2026-05-08\n15:20:00','2026-06-02\n16:35:00'];
 let end=table(X+20,y+195,CW-40,['代理 / ID','代理长ID / 昵称','分成比例','所属运营','总收入（$）','直属主播提成（$）','子代理提成（$）','创建时间','操作'],agencies.map((a,i)=>[...a.slice(0,4),...a.slice(4).map(money),creation[i],{t:'查看详情 →',to:13,color:C.purple}]),[1.3,1.2,.8,1.2,1.1,1.35,1.3,1.25,1],58);pager(end+10,'18');
}
function drawerStart(page,title,sub,base){base(page);link(defs[page][2]==='work'?16:12,()=>overlay());const dx=594,dw=W-dx;rect(dx,64,dw,H-64,'white',0,'none');text(dx+28,111,title,23,C.ink,650);text(dx+28,139,sub,12,C.sub);link(defs[page][2]==='work'?16:12,()=>text(W-49,111,'×',25,C.sub));return [dx,dw];}
const daily=[['2026-10-19',180,140,40],['2026-10-18',260,200,60],['2026-10-17',250,190,60],['2026-10-16',210,160,50],['2026-10-15',240,190,50],['2026-10-14',220,170,50],['2026-10-13',200,150,50]];
function agencyDrawer(page,tab){let [x,w]=drawerStart(page,'代理收入详情','星河代理 G1024  /  Maya U1001  /  Leo · BD  /  2026-10-13 — 2026-10-19',agencyBase);const items=[['总收入','$1,560.00'],['直属主播提成','$1,200.00'],['子代理提成','$360.00']];items.forEach((a,i)=>{let xx=x+28+i*369;rect(xx,164,346,92,'#F6F7FB',8,'none');text(xx+16,191,a[0],12,C.sub);text(xx+16,229,a[1],25,C.ink,650);});tabbar(x+12,276,w-24,['每日汇总','主播明细','子代理明细'],tab,[13,14,15]);text(x+28,356,tab===0?'按日汇总当前代理所得':tab===1?'主播贡献与父级所得分别展示':'直属子代理对当前代理的贡献',14,C.ink,600);text(x+28,384,'统计周期继承来源列表；各金额使用已有分账结果',11,C.sub);
 const yy=411,tw=w-56;if(tab===0){table(x+28,yy,tw,['日期','总收入（$）','直属主播提成（$）','子代理提成（$）'],daily.map(a=>[a[0],...a.slice(1).map(money)]),[1.3,1.2,1.4,1.4],61);banner(x+28,928,tw,'合计 $1,560.00 = 直属主播提成 $1,200.00 + 子代理提成 $360.00');}else if(tab===1){table(x+28,yy,tw,['日期','主播 / ID','主播总收入（$）','提成比例','主播贡献（$）','父级贡献（$）'],[['10-19','Lina\nU2001','$850.00','20%','$56.00','$0.00'],['10-19','Anna\nU2008','$140.00','20%','$24.00','$0.00'],['10-18','Lina\nU2001','$1,100.00','20%','$80.00','$0.00'],['10-18','Anna\nU2008','$160.00','20%','$32.00','$0.00'],['10-17','Lina\nU2001','$1,050.00','20%','$84.00','$0.00']],[1,1.3,1.5,1,1.4,1.4],72);banner(x+28,875,tw,'金额为已有结果示意。主播总收入是分成后所得，不以该列重新计算提成。');}else{table(x+28,yy,tw,['日期','子代理 / ID','子代理分成比例','当前代理比例','总贡献（$）'],[['10-19','晨星代理\nG1101','16%','20%','$24.00'],['10-19','月光代理\nG1102','8%','20%','$16.00'],['10-18','晨星代理\nG1101','16%','20%','$36.00'],['10-18','月光代理\nG1102','8%','20%','$24.00'],['10-17','晨星代理\nG1101','16%','20%','$36.00']],[1.1,1.6,1.4,1.4,1.4],72);banner(x+28,875,tw,'仅展示当前代理的已有贡献结果；比例字段含义在数据对接时核对。');}line(x+28,1022,W-28,1022);text(x+28,1066,'关闭后回到代理收入列表，保留筛选与位置。',11,C.sub);btn(W-142,1042,114,'关闭',12);save(page);}
function workBase(page=16){shell(page,'主播工作数据','查看已有总时长、渠道时长及每日工作记录，允许已有计算误差');scope();let y=fields(218,[['ID','请输入主播ID','input'],['名称','请输入主播昵称','input'],['国家代码'],['性别'],['所属运营','全部授权负责人'],['创建时间段','开始日期 — 结束日期','date'],['统计时间段','2026-10-13 — 2026-10-19','date']],5);y=filtersEnd(y-52,'创建时间用于筛选人员，统计时间用于查询工作数据');card(X,y+12,CW,571);titlebar(y+31,'主播工作明细','近7天 · 共280名主播');let end=table(X+20,y+78,CW-40,['主播 / ID','国家 / 性别','代理 / ID','所属运营','身份','总时长（min）','单人（min）','多人（min）','操作'],hosts.slice(0,6).map((a,i)=>[{t:a[1]+'\n'+a[0],to:9},a[2],a[4]+'\n'+a[3],a[7],{t:a[8],color:i===0?C.purple:C.ink},[452,380,325,288,240,216][i],[260,210,180,160,130,110][i],[191.8,169.8,145.1,127.9,109.9,105.9][i],{t:'查看详情 →',to:17,color:C.purple}]),[1.2,1,1.4,1.2,1.1,1.2,1,1,1.1],66);pager(end+8);banner(X,y+584,CW,'各项时长使用已有输出，保留计算误差；创建时间对应字段需在数据对接时确认。');}
function workDrawer(){let [x,w]=drawerStart(17,'主播工作每日明细','Lina U2001  /  星河代理 G1024  /  2026-10-13 — 2026-10-19',workBase);[['总时长','452 min'],['单人直播','260 min'],['多人直播','191.8 min']].forEach((a,i)=>{let xx=x+28+i*369;rect(xx,164,346,92,'#F6F7FB',8,'none');text(xx+16,191,a[0],12,C.sub);text(xx+16,229,a[1],25,C.ink,650);});banner(x+28,278,w-56,'已有计算误差予以保留，不为满足等式调整时长。');text(x+28,353,'每日工作记录',16,C.ink,600);table(x+28,380,w-56,['日期','总时长（min）','单人（min）','多人（min）','上麦（min）'],['10-19','10-18','10-17','10-16','10-15','10-14','10-13'].map((d,i)=>['2026-'+d,[60,74,67,72,63,60,56][i],[35,42,40,40,36,34,33][i],[24.9,31.9,26.9,32,27,26,23][i],[20,25,18,26,22,20,16][i]]),[1.3,1.4,1.2,1.2,1.2],63);text(x+28,938,'今天数据更新于 14:30，历史数据保持固定。',12,C.sub);line(x+28,1022,W-28,1022);text(x+28,1066,'关闭后回到主播工作列表，保留筛选与位置。',11,C.sub);btn(W-142,1042,114,'关闭',16);save(17);}
function liveRooms(page=18,emit=true){shell(page,'当前直播间列表','查看范围内在播情况；列表字段与画面方式为待确认示意');scope();stats(218,[['当前在播主播','38','范围内已有在播状态'],['当前直播间','32','主播人数与房间数分别展示'],['我的主播','280','可进入人员列表',8]],94);card(X,333,CW,74);field(X+20,353,245,'主播ID','请输入主播ID','input');field(X+288,353,245,'代理ID','请输入代理ID','input');field(X+556,353,245,'渠道类型','全部直播渠道');btn(1512,356,84,'重置');btn(1608,356,96,'查询',null,true);text(X,445,'在播直播间',17,C.ink,650);pill(X+135,426,'字段与筛选待确认','amber');
 for(let i=0;i<6;i++){let col=i%3,row=Math.floor(i/3),x=X+col*499,y=470+row*281;card(x,y,474,263);portrait(x+14,y+14,139,230,i);pill(x+27,y+27,'● 在播','green');text(x+172,y+39,hosts[i][1],19,C.ink,650);text(x+172,y+65,hosts[i][0]+' · '+hosts[i][8],11,C.sub);text(x+172,y+96,hosts[i][4]+' / '+hosts[i][3],12,C.ink);text(x+172,y+123,hosts[i][7],11,C.sub);text(x+172,y+155,['单人直播','多人视频直播','音频直播'][i%3]+' · '+['01:42','00:58','02:10'][i%3],12,C.ink);text(x+172,y+183,'当前观众 '+[128,86,42,65,34,51][i]+'  ·  RM'+(88001+i),11,C.sub);btn(x+172,y+203,154,'进入实时审核 →',19,true);}
 if(emit)save(page);}
function audit(page=19,source='live',emit=true){
 const parent=source==='detail'?9:18,patrolTarget=source==='detail'?24:21;if(source==='detail')anchorDetail(page,false);else liveRooms(page,false);link(parent,()=>overlay());const x=470,w=W-x,pad=28;
 rect(x,64,w,H-64,'white',0,'none');text(x+pad,111,'实时审核',23,C.ink,650);text(x+pad,140,(source==='detail'?'主播详情':'直播间列表')+' / Lina · U2001 / RM88001',12,C.sub);link(parent,()=>text(W-49,111,'×',25,C.sub));
 rect(x+pad,163,w-pad*2,65,C.pale,8,'none');text(x+pad+16,189,'星河代理 G1024  ·  Leo / BD  ·  单人直播',13,C.ink,550);text(x+pad+16,212,'本场开播 12:48  ·  已播 01:42  ·  当前观众 128',11,C.sub);pill(1581,183,'● 正在直播','green');
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

overview();bdBase();save(1);bdDetail();guildBase();save(5);anchorList();anchorDetail();income();agencyBase();save(12);agencyDrawer(13,0);agencyDrawer(14,1);agencyDrawer(15,2);workBase();save(16);workDrawer();liveRooms();audit();patrol();patrol(21,'auditLive');imagePreview(22,20,'detail');audit(23,'detail');patrol(24,'auditDetail');imagePreview(25,21,'auditLive');imagePreview(26,24,'auditDetail');
if(bounds.length){console.error('Text outside canvas:',bounds);throw Error('Text bounds validation failed');}
pages.forEach(p=>p.links.forEach(target=>{if(!pages.some(q=>q.id===target))throw Error('Missing target '+target);}));
fs.writeFileSync(path.join(__dirname,'pages.json'),JSON.stringify(pages,null,2),'utf8');
const groups=[['首页 / 运营概览',[0]],['组织管理 / BD列表',[1,4]],['组织管理 / 代理列表',[5]],['组织管理 / 主播列表与详情',[8,9]],['主播详情 / 实时审核、巡查与预览',[23,20,24,22,26]],['直播与收入 / 主播收入',[10]],['直播与收入 / 代理收入',[12,13,14,15]],['直播与收入 / 主播工作',[16,17]],['直播与收入 / 直播审核、巡查与预览',[18,19,21,25]]];
const kindNames={main:'主界面',subpage:'子页面',drawer:'右侧抽屉',modal:'居中弹窗'};
function roleText(i){const p=pages.find(p=>p.id===i);return kindNames[p.kind];}
function originText(i){const p=pages.find(p=>p.id===i);return p.kind==='main'?'主导航入口':p.replacesDrawer?'同一抽屉切换 · 返回'+defs[p.backId][1]:'来源：'+defs[p.parentId][1];}
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SANO人员与直播管理 · 原型导航</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#192b46;font-family:'Microsoft YaHei',sans-serif}header{background:#0b1c35;color:white;padding:34px 5vw}header p{color:#b8c7da;font-size:14px;line-height:1.9}main{margin:30px 5vw}h2{font-size:19px;margin-top:34px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.card{background:white;border:1px solid #e5eaf2;border-radius:12px;overflow:hidden}img{display:block;width:100%;border-bottom:1px solid #e5eaf2}.body{padding:15px 18px}h3{font-size:14px;margin:0 0 12px}a{color:#6545e8;text-decoration:none;font-size:13px}.actions{display:flex;gap:20px}.type{display:inline-block;background:#f0edff;color:#6545e8;padding:4px 9px;border-radius:12px;font-size:11px;margin-bottom:10px}.context{font-size:12px;color:#6b7c93;min-height:20px}.tip{padding:16px;background:#fff6e5;border-radius:8px;font-size:13px;line-height:1.8}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><header><h1>SANO 人员与直播管理</h1><p>${pages.length}张页面与状态 · PNG评审图 + 可编辑SVG源文件<br>运营Nina的授权范围示例 · 全部数据均为虚构示例 · SVG中的链接可用于浏览主要路径</p></header><main><div class="tip">8个主界面、1个子页面、10个抽屉状态、3个图片预览弹窗状态。实时审核进入巡查复用同一抽屉，关闭返回底层页面；图片预览关闭只回到巡查抽屉。筛选、树展开和图片加载为静态状态；链接用于原型导航，不执行业务。每天10张为默认加载量，非记录上限。</div>${groups.map(([name,ids])=>`<h2>${name}</h2><div class="grid">${ids.map(i=>`<div class="card"><a href="源文件/${defs[i][0]}.svg"><img src="原型图/${defs[i][0]}.png" loading="lazy" alt="${defs[i][1]}"></a><div class="body"><div class="type">${roleText(i)}</div><h3>${String(pages.findIndex(p=>p.id===i)+1).padStart(2,'0')} · ${defs[i][1]}</h3><p class="context">${originText(i)}</p><div class="actions"><a href="原型图/${defs[i][0]}.png">查看PNG</a><a href="源文件/${defs[i][0]}.svg">打开SVG原型</a></div></div></div>`).join('')}</div>`).join('')}<p style="margin-top:36px"><a href="交互关系说明.md">查看页面层级与返回规则</a> · <a href="../需求文档/人员与直播管理.md">查看需求文档</a></p></main></html>`;
fs.writeFileSync(path.join(root,'原型导航.html'),html,'utf8');
console.log('Generated '+pages.length+' SVG prototypes and navigation.');

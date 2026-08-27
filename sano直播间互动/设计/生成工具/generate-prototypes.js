const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', '源文件');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  navy: '#071B34', ink: '#101828', text: '#344054', muted: '#667085', line: '#E4E7EC',
  bg: '#F6F8FC', white: '#FFFFFF', purple: '#5B34F2', purple2: '#7C4DFF', soft: '#F4F0FF',
  blue: '#2E7CF6', blueSoft: '#EFF6FF', green: '#12B76A', greenSoft: '#ECFDF3',
  orange: '#F79009', orangeSoft: '#FFF7E8', red: '#F04438', redSoft: '#FFF1F0', dark: '#111827'
};

function esc(v) {
  return String(v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[m]));
}

class Canvas {
  constructor(w, h, bg = C.bg) {
    this.w = w; this.h = h; this.parts = [];
    this.parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
    this.parts.push(`<defs>
      <linearGradient id="liveGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#243B66"/><stop offset="0.55" stop-color="#34205F"/><stop offset="1" stop-color="#101828"/></linearGradient>
      <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#4F2BEE"/></linearGradient>
      <linearGradient id="warmGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF7A00"/><stop offset="1" stop-color="#FF3D71"/></linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#101828" flood-opacity="0.14"/></filter>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#4F2BEE" flood-opacity="0.16"/></filter>
    </defs>`);
    this.parts.push(`<style>text{font-family:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",Arial,sans-serif}.shadow{filter:url(#shadow)}.soft-shadow{filter:url(#softShadow)}</style>`);
    this.rect(0, 0, w, h, bg, 0);
  }
  add(s) { this.parts.push(s); return this; }
  rect(x, y, w, h, fill = C.white, r = 10, stroke = 'none', sw = 1, cls = '') {
    return this.add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${cls ? ` class="${cls}"` : ''}/>`);
  }
  line(x1, y1, x2, y2, stroke = C.line, sw = 1, dash = '') {
    return this.add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
  }
  circle(cx, cy, r, fill, stroke = 'none', sw = 1) {
    return this.add(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
  }
  text(x, y, value, size = 14, fill = C.text, weight = 400, anchor = 'start', opacity = 1) {
    return this.add(`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}" opacity="${opacity}">${esc(value)}</text>`);
  }
  multiline(x, y, lines, size = 14, fill = C.text, weight = 400, gap = 24, anchor = 'start') {
    const spans = lines.map((t, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : gap}">${esc(t)}</tspan>`).join('');
    return this.add(`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}">${spans}</text>`);
  }
  badge(x, y, label, fill = C.soft, color = C.purple, w) {
    const width = w || Math.max(64, 26 + label.length * 15);
    this.rect(x, y, width, 30, fill, 15);
    this.text(x + width / 2, y + 20, label, 12, color, 600, 'middle');
    return width;
  }
  button(x, y, w, label, primary = true, h = 44) {
    this.rect(x, y, w, h, primary ? C.purple : C.white, 8, primary ? C.purple : '#C8BFFF', 1);
    this.text(x + w / 2, y + h / 2 + 5, label, 14, primary ? C.white : C.purple, 600, 'middle');
    return this;
  }
  field(x, y, w, label, value, h = 44) {
    this.text(x, y, label, 12, C.muted, 500);
    this.rect(x, y + 12, w, h, C.white, 7, '#D0D5DD', 1);
    this.text(x + 14, y + 40, value, 13, C.ink, 400);
    return this;
  }
  end(file) {
    this.parts.push('</svg>');
    fs.writeFileSync(path.join(OUT, file), this.parts.join('\n'), 'utf8');
  }
}

function adminBase(title, subtitle, active = '平台模板') {
  const s = new Canvas(1672, 941, '#F8FAFD');
  s.rect(0, 0, 250, 941, C.navy, 0);
  s.text(30, 48, '☰', 24, C.white, 400);
  s.text(30, 94, 'SANO LIVE', 17, C.white, 700);
  s.text(30, 126, '直播运营管理', 13, '#A7B4C7', 400);
  s.text(30, 188, '▣', 18, C.white, 500);
  s.text(62, 188, '互动礼物菜单', 16, C.white, 700);
  s.text(218, 188, '⌄', 16, '#A7B4C7', 400);
  const items = [['平台音效库', 248], ['平台模板', 304], ['主播模板审核', 360]];
  items.forEach(([label, y]) => {
    if (label === active) s.rect(26, y - 34, 206, 46, C.purple, 8);
    s.circle(54, y - 11, 4, label === active ? C.white : '#8EA0B8');
    s.text(76, y - 5, label, 15, label === active ? C.white : '#E6ECF4', label === active ? 600 : 400);
  });
  s.text(290, 66, title, 30, C.ink, 700);
  s.text(292, 98, subtitle, 14, C.muted, 400);
  return s;
}

function tabs(s, selected) {
  const data = [['平台模板', 300], ['主播模板审核', 430], ['规则配置', 590], ['平台音效库', 720], ['互动数据', 870]];
  data.forEach(([label, x]) => {
    const on = label === selected;
    s.text(x, 152, label, 15, on ? C.purple : C.muted, on ? 700 : 400);
    if (on) s.rect(x - 8, 170, 94, 3, C.purple, 2);
  });
  s.line(250, 180, 1672, 180, C.line);
}

function table(s, x, y, widths, headers, rows, rowH = 58) {
  const total = widths.reduce((a, b) => a + b, 0);
  s.rect(x, y, total, 44, '#F8FAFC', 6, C.line, 1);
  let cx = x;
  headers.forEach((h, i) => { s.text(cx + 12, y + 28, h, 12, '#475467', 600); cx += widths[i]; });
  rows.forEach((row, ri) => {
    const ry = y + 44 + ri * rowH;
    s.rect(x, ry, total, rowH, C.white, 0, '#EAECF0', 1);
    cx = x;
    row.forEach((v, i) => { s.text(cx + 12, ry + 35, v, 12, C.text, 400); cx += widths[i]; });
  });
}

function kpi(s, x, label, value, color, note) {
  s.rect(x, 204, 300, 106, C.white, 12, C.line, 1);
  s.circle(x + 48, 257, 25, color);
  s.text(x + 88, 242, label, 13, C.muted, 500);
  s.text(x + 88, 274, value, 24, C.ink, 700);
  s.text(x + 214, 274, note, 12, C.muted, 400);
}

// 03 管理端：平台音效库
{
  const s = adminBase('平台音效库', '维护互动礼物菜单可选的公开播放音效', '平台音效库');
  s.button(1452, 52, 168, '＋ 新增平台音效');
  s.rect(280, 128, 1360, 66, C.white, 10, C.line, 1);
  s.rect(304, 140, 340, 42, C.white, 7, '#D0D5DD', 1);
  s.text(322, 167, '搜索音效名称或文件地址', 13, '#98A2B3', 400);
  s.badge(666, 146, '全部状态', '#F2F4F7', C.text, 104);
  s.button(1494, 140, 116, '查询', false, 42);
  s.rect(280, 218, 1360, 54, C.blueSoft, 8, '#B2D4FF', 1);
  s.text(304, 251, 'ⓘ 平台音效由运营统一维护，主播只能选择和试听；触发互动后音效在直播间公开播放。', 13, C.text, 400);
  const x = 280, y = 300, widths = [100, 210, 430, 140, 140, 160, 170];
  const headers = ['Icon', '音效名称', '文件地址', '时长（秒）', '状态', '更新时间', '操作'];
  const rows = [
    ['♫', '欢呼短音效', 'https://cdn.sano.live/audio/cheer-01.mp3', '3.2', '已启用', '08-26 16:40', '试听  编辑  停用'],
    ['鼓', '节奏鼓点', 'https://cdn.sano.live/audio/drum-beat-02.mp3', '4.8', '已启用', '08-25 11:20', '试听  编辑  停用'],
    ['★', '闪亮登场', 'https://cdn.sano.live/audio/sparkle-01.mp3', '2.6', '已启用', '08-24 18:05', '试听  编辑  停用'],
    ['♪', '全场欢呼', 'https://cdn.sano.live/audio/crowd-cheer-03.mp3', '5.0', '已启用', '08-23 14:12', '试听  编辑  停用'],
    ['铃', '轻提示铃', 'https://cdn.sano.live/audio/notice-bell-01.mp3', '1.8', '已停用', '08-18 09:35', '试听  编辑  启用']
  ];
  const total = widths.reduce((a, b) => a + b, 0);
  s.rect(x, y, total, 46, '#F8FAFC', 6, C.line, 1);
  let cx = x;
  headers.forEach((h, i) => { s.text(cx + 14, y + 29, h, 12, '#475467', 600); cx += widths[i]; });
  rows.forEach((row, ri) => {
    const ry = y + 46 + ri * 86;
    s.rect(x, ry, total, 86, C.white, 0, '#EAECF0', 1);
    s.circle(x + 48, ry + 43, 24, ri === 0 ? C.purple : '#EEF2F6');
    s.text(x + 48, ry + 50, row[0], 15, ri === 0 ? C.white : C.text, 700, 'middle');
    cx = x + widths[0];
    row.slice(1).forEach((v, i) => { s.text(cx + 14, ry + 49, v, 12, C.text, i === 0 ? 600 : 400); cx += widths[i + 1]; });
  });
  s.end('03-管理端-平台音效库.svg');
}

// 04 管理端：平台模板管理（新增、编辑同页）
{
  const s = adminBase('平台模板', '左侧选择模板，右侧维护基础信息和模板菜单项', '平台模板');
  s.rect(280, 128, 400, 780, C.white, 10, C.line, 1);
  s.text(304, 166, '模板列表', 18, C.ink, 700);
  s.button(520, 144, 136, '＋ 新增模板');
  s.rect(304, 196, 352, 40, C.white, 7, '#D0D5DD', 1);
  s.text(322, 222, '搜索模板名称或编码', 13, '#98A2B3', 400);
  const templates = [
    ['舞蹈互动', 'DANCE_01', '4项', '已启用'],
    ['唱歌点单', 'SONG_01', '6项', '已启用'],
    ['轻量趣味互动', 'FUN_01', '5项', '已启用'],
    ['新人欢迎', 'WELCOME', '3项', '草稿'],
    ['节日特别场', 'FESTIVAL', '6项', '已停用']
  ];
  templates.forEach((t, i) => {
    const ty = 258 + i * 94;
    s.rect(304, ty, 352, 76, i === 0 ? '#F8F5FF' : C.white, 8, i === 0 ? C.purple : C.line, 1);
    s.text(322, ty + 30, t[0], 14, C.ink, 600);
    s.text(322, ty + 55, `${t[1]} · ${t[2]}`, 11, C.muted, 400);
    const fill = t[3] === '已启用' ? C.greenSoft : t[3] === '草稿' ? C.orangeSoft : '#F2F4F7';
    const color = t[3] === '已启用' ? C.green : t[3] === '草稿' ? C.orange : C.muted;
    s.badge(556, ty + 23, t[3], fill, color, 82);
  });

  s.rect(702, 128, 938, 780, C.white, 10, C.line, 1);
  s.text(728, 166, '模板内容', 18, C.ink, 700);
  s.button(1372, 144, 112, '保存草稿', false);
  s.button(1498, 144, 112, '保存模板');
  s.text(728, 218, '模板基础信息', 16, C.ink, 700);
  s.field(728, 248, 200, '模板名称', '舞蹈互动');
  s.field(950, 248, 170, '模板编码', 'DANCE_01');
  s.field(1142, 248, 200, '适用直播类型', '才艺直播');
  s.field(1364, 248, 120, '最大菜单项', '6项');
  s.text(1506, 248, '状态', 12, C.muted, 500);
  s.badge(1506, 260, '已启用', C.greenSoft, C.green, 82);
  s.text(728, 342, '模板菜单项', 16, C.ink, 700);
  s.text(728, 366, '同一礼物仅关联一个互动；公开音效只能从平台音效库选择。', 12, C.muted, 400);
  s.button(1450, 330, 160, '＋ 新增菜单项');
  table(s, 728, 392, [120, 80, 190, 160, 90, 160], ['关联礼物', '数量', '互动名称', '平台公开音效', '状态', '操作'], [
    ['棒棒糖', '2个', '跳1分钟舞蹈', '欢呼短音效', '启用', '编辑  删除  ↓'],
    ['小星星', '5个', '随机舞蹈30秒', '节奏鼓点', '启用', '编辑  删除  ↑↓'],
    ['玫瑰花', '10个', '指定动作连拍', '闪亮登场', '启用', '编辑  删除  ↑↓'],
    ['礼花筒', '1个', '感谢并比心', '全场欢呼', '启用', '编辑  删除  ↑']
  ], 56);

  // 先输出平台模板主页面，保证基础信息和菜单项列表完整可见。
  fs.writeFileSync(path.join(OUT, '04-管理端-平台模板管理.svg'), [...s.parts, '</svg>'].join('\n'), 'utf8');

  // 再输出新增菜单项弹窗状态，不占用页面固定内容区。
  s.add('<rect x="250" y="0" width="1422" height="941" fill="#101828" opacity="0.34"/>');
  s.rect(560, 206, 790, 520, C.white, 14, 'none', 0, 'shadow');
  s.text(592, 250, '新增菜单项', 20, C.ink, 700);
  s.text(1310, 250, '×', 24, C.muted, 400, 'middle');
  s.line(560, 274, 1350, 274, C.line);
  s.field(592, 318, 230, '关联礼物', '棒棒糖');
  s.field(846, 318, 120, '触发数量', '2');
  s.field(990, 318, 326, '互动名称', '跳1分钟舞蹈');
  s.field(592, 402, 374, '平台公开音效', '欢呼短音效  ▶');
  s.button(990, 414, 124, '试听音效', false, 44);
  s.text(592, 494, '互动说明（选填）', 12, C.muted, 500);
  s.rect(592, 508, 724, 76, C.white, 7, '#D0D5DD', 1);
  s.text(608, 542, '完成一段约1分钟的舞蹈', 12, C.text, 400);
  s.text(592, 620, '启用状态', 12, C.muted, 500);
  s.badge(592, 634, '启用', C.greenSoft, C.green, 72);
  s.button(1080, 632, 108, '取消', false, 48);
  s.button(1202, 632, 114, '保存本项', true, 48);
  s.end('04A-管理端-平台模板-新增菜单项弹窗.svg');
}

// 05 管理端：主播模板审核
{
  const s = adminBase('主播模板审核', '审核主播在平台模板基础上修改的互动名称和说明', '主播模板审核');
  s.rect(280, 128, 450, 780, C.white, 10, C.line, 1);
  s.text(304, 166, '模板列表', 18, C.ink, 700);
  s.rect(304, 188, 240, 40, C.white, 7, '#D0D5DD', 1);
  s.text(322, 214, '搜索主播ID或模板名称', 12, '#98A2B3', 400);
  s.rect(558, 188, 148, 40, C.white, 7, '#D0D5DD', 1);
  s.text(574, 214, '状态：全部  ▾', 12, C.text, 500);
  s.text(304, 264, '审核模板', 14, C.ink, 700);
  s.badge(590, 246, '23条待处理', C.orangeSoft, C.orange, 108);
  const audits = [
    ['主播小鹿', 'UID 821930', '舞蹈互动', '高风险命中', C.redSoft, C.red],
    ['夏天同学', 'UID 190233', '唱歌点单', '机器通过', C.greenSoft, C.green],
    ['阿柒直播间', 'UID 552018', '轻量趣味互动', '人工待审', C.orangeSoft, C.orange]
  ];
  audits.forEach((a, i) => {
    const y = 286 + i * 96;
    s.rect(304, y, 402, 80, i === 0 ? '#FBF9FF' : C.white, 9, i === 0 ? C.purple : C.line, 1);
    s.circle(340, y + 40, 22, i === 0 ? C.purple : '#D0D5DD');
    s.text(340, y + 46, a[0].slice(0, 1), 14, C.white, 700, 'middle');
    s.text(376, y + 31, a[0], 14, C.ink, 600);
    s.text(376, y + 55, `${a[1]} · ${a[2]}`, 11, C.muted, 400);
    s.badge(584, y + 25, a[3], a[4], a[5], 102);
  });
  s.rect(752, 128, 888, 780, C.white, 10, C.line, 1);
  s.text(778, 168, '当前模板基础信息', 18, C.ink, 700);
  s.badge(1272, 146, '高风险命中', C.redSoft, C.red, 104);
  s.button(1390, 144, 96, '驳回', false);
  s.button(1500, 144, 112, '审核通过');
  s.rect(778, 204, 820, 142, '#FAFAFF', 8, '#D9D2FF', 1);
  const base = [
    ['模板名称', '小鹿的舞蹈菜单', 800, 234], ['主播', '主播小鹿 · UID 821930', 1080, 234],
    ['来源模板', '舞蹈互动（DANCE_01）', 800, 278], ['菜单项数量', '4项', 1080, 278],
    ['提交版本', 'V3', 800, 322], ['提交时间', '08-26 17:42', 1080, 322]
  ];
  base.forEach(([label, value, x, y]) => { s.text(x, y, label, 11, C.muted, 400); s.text(x + 84, y, value, 12, C.ink, 600); });
  s.text(778, 382, '模板详细信息', 16, C.ink, 700);
  s.text(778, 406, '仅审核主播修改的互动名称和说明，礼物、数量和音效沿用平台可用范围。', 11, C.muted, 400);
  table(s, 778, 428, [140, 90, 230, 170, 150], ['关联礼物', '数量', '主播互动文案', '平台音效', '审核结果'], [
    ['棒棒糖', '2个', '跳1分钟舞蹈', '欢呼短音效', '通过'],
    ['小星星', '5个', '贴身热舞30秒', '节奏鼓点', '高风险命中'],
    ['玫瑰花', '10个', '随机动作连拍', '闪亮登场', '通过'],
    ['礼花筒', '1个', '感谢并比心', '全场欢呼', '通过']
  ], 52);
  s.rect(778, 724, 820, 146, C.redSoft, 8, '#FFB4AE', 1);
  s.text(800, 758, '风险提示', 14, C.red, 700);
  s.text(800, 786, '“贴身热舞”命中低俗风险词，建议主播修改为“随机舞蹈30秒”。', 12, C.text, 400);
  s.field(800, 820, 540, '主播可见驳回原因', '互动名称包含不适宜词语，请修改后重新提交。', 34);
  s.button(1364, 832, 100, '保存原因', false, 40);
  s.button(1478, 832, 96, '驳回', true, 40);
  s.end('05-管理端-主播模板审核.svg');
}

function phoneBase(title, subtitle = '') {
  const s = new Canvas(941, 1672, '#F5F3FF');
  s.rect(0, 0, 941, 106, C.white, 0);
  s.text(42, 45, '9:41', 17, C.ink, 700);
  s.text(850, 45, '▰  5G', 15, C.ink, 600, 'middle');
  s.text(48, 82, '‹', 40, C.ink, 400);
  s.text(470, 80, title, 25, C.ink, 700, 'middle');
  if (subtitle) s.text(470, 108, subtitle, 12, C.muted, 400, 'middle');
  return s;
}

function toggle(s, x, y, on = true) {
  s.rect(x, y, 68, 36, on ? C.purple : '#D0D5DD', 18);
  s.circle(on ? x + 50 : x + 18, y + 18, 14, C.white);
}

function liveCanvas(s, h = 620) {
  s.rect(0, 0, 941, h, 'url(#liveGrad)', 0);
  s.text(42, 45, '9:41', 17, C.white, 700);
  s.text(850, 45, '▰  5G', 15, C.white, 600, 'middle');
  s.circle(54, 108, 28, '#F4C9AA', C.white, 2);
  s.text(94, 103, '主播小鹿', 17, C.white, 700);
  s.text(94, 128, '1.2万观看', 12, '#D0D5DD', 400);
  s.badge(250, 90, '＋ 关注', '#FFFFFF', C.purple, 82);
  s.circle(876, 105, 22, '#FFFFFF33'); s.text(876, 112, '×', 24, C.white, 400, 'middle');
  s.text(470, 280, 'LIVE', 56, '#FFFFFF22', 700, 'middle');
  s.text(470, 322, '直播画面预览区', 18, '#FFFFFF88', 500, 'middle');
  s.text(42, h - 120, '小安：今天互动菜单有什么？', 16, C.white, 500);
  s.text(42, h - 82, 'Momo：棒棒糖已安排～', 16, C.white, 500);
  s.text(42, h - 44, '阿柒：主播跳得好可爱', 16, C.white, 500);
}

// 06 App主播端：直播准备
{
  const s = phoneBase('直播准备');
  s.rect(34, 136, 873, 330, 'url(#liveGrad)', 18);
  s.circle(470, 286, 46, '#FFFFFF22');
  s.text(470, 300, '▶', 34, C.white, 600, 'middle');
  s.text(470, 396, '摄像头预览', 16, '#FFFFFFAA', 500, 'middle');
  s.text(44, 516, '开播设置', 24, C.ink, 700);
  const cards = [
    ['直播标题', '今天跳舞给你看', '›'], ['封面与分类', '才艺直播', '›'], ['美颜与设备', '已设置', '›']
  ];
  cards.forEach((c, i) => {
    const y = 552 + i * 94;
    s.rect(34, y, 873, 78, C.white, 14, '#E7E2FF', 1);
    s.text(62, y + 34, c[0], 16, C.ink, 600);
    s.text(812, y + 34, c[1], 14, C.muted, 400, 'end');
    s.text(872, y + 36, c[2], 24, C.muted, 400, 'middle');
  });
  s.text(44, 862, '直播互动', 24, C.ink, 700);
  s.rect(34, 900, 873, 210, C.white, 18, '#D8D0FF', 1, 'soft-shadow');
  s.circle(88, 956, 34, C.purple);
  s.text(88, 968, '礼', 21, C.white, 700, 'middle');
  s.text(140, 948, '互动礼物菜单', 20, C.ink, 700);
  s.badge(140, 968, '已审核通过', C.greenSoft, C.green, 96);
  toggle(s, 800, 930, true);
  s.text(62, 1036, '舞蹈互动', 17, C.text, 600);
  s.text(228, 1036, '共4项', 14, C.muted, 400);
  s.text(812, 1036, '编辑设置', 14, C.purple, 600, 'end');
  s.text(62, 1074, '开播后只能暂停、恢复、关闭或静音，不能继续编辑', 13, C.muted, 400);
  s.rect(34, 1144, 873, 294, C.white, 18, C.line, 1);
  s.text(62, 1186, '本场菜单预览', 18, C.ink, 700);
  const items = [['棒棒糖 ×2', '跳1分钟舞蹈', '欢呼短音效'], ['小星星 ×5', '随机舞蹈30秒', '节奏鼓点'], ['玫瑰花 ×10', '指定动作连拍', '闪亮登场']];
  items.forEach((it, i) => {
    const y = 1216 + i * 66;
    s.circle(74, y + 22, 20, i === 0 ? '#FFB547' : i === 1 ? '#FFD84D' : '#F670C7');
    s.text(108, y + 20, it[0], 15, C.ink, 600);
    s.text(330, y + 20, it[1], 14, C.text, 400);
    s.text(830, y + 20, `🔊 ${it[2]}`, 13, C.muted, 400, 'end');
    if (i < 2) s.line(62, y + 50, 880, y + 50, '#F0EDF9');
  });
  s.rect(34, 1482, 873, 86, 'url(#purpleGrad)', 43, 'none', 0, 'soft-shadow');
  s.text(470, 1536, '开始直播', 23, C.white, 700, 'middle');
  s.text(470, 1618, '互动菜单将在开播时生成本场快照', 13, C.muted, 400, 'middle');
  s.end('06-App主播端-直播准备互动礼物菜单.svg');
}

// 07 App主播端：直播中强提醒与任务队列
{
  const s = new Canvas(941, 1672, C.dark);
  liveCanvas(s, 720);
  s.rect(24, 150, 893, 126, 'url(#warmGrad)', 16, 'none', 0, 'shadow');
  s.circle(78, 213, 28, '#FFFFFF33');
  s.text(78, 222, '!', 28, C.white, 800, 'middle');
  s.text(124, 194, '用户A送出棒棒糖 ×4', 18, C.white, 700);
  s.text(124, 226, '触发「跳1分钟舞蹈」×2 · 当前待完成5次', 15, C.white, 500);
  s.badge(744, 194, '公开音效已播放', '#FFFFFF33', C.white, 140);
  s.rect(0, 690, 941, 982, '#F8F7FC', 30);
  s.rect(414, 710, 112, 6, '#D0D5DD', 3);
  s.text(42, 768, '互动任务', 26, C.ink, 700);
  s.badge(206, 744, '待完成 5', C.redSoft, C.red, 104);
  s.button(622, 736, 106, '静音', false, 42);
  s.button(740, 736, 138, '暂停菜单', false, 42);
  s.rect(34, 812, 873, 284, C.white, 18, '#F6B7B2', 2, 'soft-shadow');
  s.circle(88, 870, 30, '#FFB547');
  s.text(88, 878, '棒', 16, C.white, 700, 'middle');
  s.text(136, 858, '用户A｜跳1分钟舞蹈', 19, C.ink, 700);
  s.text(136, 890, '棒棒糖 ×2/次', 14, C.muted, 400);
  s.badge(720, 838, '待完成2次', C.redSoft, C.red, 110);
  s.rect(64, 930, 812, 48, '#FFF8F7', 10);
  s.text(88, 960, '送礼批次：棒棒糖×4  ·  强提醒已合并  ·  音效播放1次', 13, C.text, 400);
  s.button(64, 1002, 812, '完成 1 次', true, 60);
  s.rect(34, 1122, 873, 180, C.white, 18, C.line, 1);
  s.circle(88, 1180, 30, '#FFD84D');
  s.text(88, 1188, '星', 16, C.white, 700, 'middle');
  s.text(136, 1168, 'Momo｜随机舞蹈30秒', 18, C.ink, 700);
  s.text(136, 1200, '小星星 ×5/次', 14, C.muted, 400);
  s.badge(728, 1152, '待完成3次', C.orangeSoft, C.orange, 110);
  s.button(620, 1222, 256, '完成 1 次', false, 48);
  s.rect(34, 1330, 873, 126, C.blueSoft, 16, '#B2D4FF', 1);
  s.text(62, 1370, 'ⓘ 暂停后保留个人累计进度和已生成任务', 14, C.text, 600);
  s.text(62, 1404, '关闭菜单会清除未达门槛进度，但任务仍需继续处理', 13, C.muted, 400);
  s.rect(34, 1490, 873, 78, C.white, 39, C.line, 1);
  s.text(72, 1538, '说点什么…', 15, '#98A2B3', 400);
  s.circle(760, 1529, 24, C.soft); s.text(760, 1537, '礼', 15, C.purple, 700, 'middle');
  s.circle(830, 1529, 24, C.soft); s.text(830, 1537, '⋯', 20, C.purple, 700, 'middle');
  s.end('07-App主播端-直播中互动任务.svg');
}

// 08 App观众端：直播间互动菜单与完成反馈
{
  const s = new Canvas(941, 1672, C.dark);
  liveCanvas(s, 670);
  s.rect(128, 154, 685, 72, '#111827DD', 36, '#FFFFFF33', 1, 'shadow');
  s.circle(170, 190, 20, C.green);
  s.text(170, 197, '✓', 17, C.white, 800, 'middle');
  s.text(208, 184, '主播已完成你点的「跳1分钟舞蹈」', 15, C.white, 600);
  s.text(208, 208, '本次剩余待完成：1次', 12, '#D0D5DD', 400);
  s.rect(0, 640, 941, 1032, '#F8F7FC', 30);
  s.rect(414, 658, 112, 6, '#D0D5DD', 3);
  s.text(42, 716, '互动礼物菜单', 25, C.ink, 700);
  s.text(42, 748, '送出指定礼物即可点单，进度仅自己可见', 13, C.muted, 400);
  s.badge(742, 694, '舞蹈互动', C.soft, C.purple, 116);
  const menu = [
    { y: 788, color: '#FFB547', gift: '棒棒糖 ×2', action: '跳1分钟舞蹈', progress: '当前进度 1/2', sound: '欢呼短音效', btn: '送2个并点单' },
    { y: 1008, color: '#FFD84D', gift: '小星星 ×5', action: '随机舞蹈30秒', progress: '当前进度 0/5', sound: '节奏鼓点', btn: '送5个并点单' },
    { y: 1228, color: '#F670C7', gift: '玫瑰花 ×10', action: '指定动作连拍', progress: '当前进度 3/10', sound: '闪亮登场', btn: '送10个并点单' }
  ];
  menu.forEach((m, i) => {
    s.rect(34, m.y, 873, 198, C.white, 18, i === 0 ? '#C8BFFF' : C.line, i === 0 ? 2 : 1, i === 0 ? 'soft-shadow' : '');
    s.circle(92, m.y + 58, 34, m.color);
    s.text(92, m.y + 66, i === 0 ? '棒' : i === 1 ? '星' : '花', 17, C.white, 700, 'middle');
    s.text(144, m.y + 42, m.gift, 18, C.ink, 700);
    s.text(144, m.y + 76, m.action, 15, C.text, 500);
    s.text(144, m.y + 108, `🔊 ${m.sound}`, 12, C.muted, 400);
    s.badge(650, m.y + 26, m.progress, i === 0 ? C.soft : '#F2F4F7', i === 0 ? C.purple : C.muted, 160);
    s.rect(144, m.y + 132, 344, 10, '#ECE8FA', 5);
    const pw = i === 0 ? 172 : i === 1 ? 0 : 103;
    if (pw > 0) s.rect(144, m.y + 132, pw, 10, C.purple, 5);
    s.button(612, m.y + 124, 250, m.btn, i === 0, 50);
  });
  s.rect(34, 1460, 873, 84, C.blueSoft, 14, '#B2D4FF', 1);
  s.text(62, 1492, '普通礼物面板送出关联礼物也会累计', 14, C.text, 600);
  s.text(62, 1522, '一次送4个棒棒糖将成功点单2次，主播只收到一条合并提醒', 12, C.muted, 400);
  s.rect(34, 1570, 873, 74, C.white, 37, C.line, 1);
  s.text(72, 1616, '说点什么…', 15, '#98A2B3', 400);
  s.circle(760, 1607, 25, C.purple); s.text(760, 1615, '礼', 15, C.white, 700, 'middle');
  s.circle(830, 1607, 25, C.soft); s.text(830, 1615, '⋯', 20, C.purple, 700, 'middle');
  s.end('08-App观众端-直播间互动菜单.svg');
}

console.log('Generated 7 SVG prototypes in', OUT);

// Static mobile review prototypes. All accounts and amounts are fictional.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '源文件');
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));
fs.mkdirSync(sourceDir, { recursive: true });

const W = 390;
const H = 844;
const C = {
  ink: '#282334',
  muted: '#837E8D',
  faint: '#B0ABB9',
  purple: '#6F3CF6',
  purpleDark: '#4621C6',
  pink: '#EF65E8',
  orange: '#FF8A2A',
  line: '#ECE9F2',
  bg: '#F6F4FA',
  white: '#FFFFFF',
  red: '#D84B64'
};

const esc = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

let body = [];

function rect(x, y, width, height, fill = C.white, radius = 0, stroke = 'none', opacity = 1) {
  body.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" opacity="${opacity}"/>`);
}

function circle(x, y, radius, fill, stroke = 'none', strokeWidth = 1) {
  body.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`);
}

function line(x1, y1, x2, y2, stroke = C.line, width = 1, cap = 'round') {
  body.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="${cap}"/>`);
}

function text(x, y, value, size = 14, color = C.ink, weight = 400, anchor = 'start', className = '') {
  body.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}"${className ? ` class="${className}"` : ''}>${esc(value)}</text>`);
}

function link(pageId, render) {
  body.push(`<a href="${pages[pageId].file}.svg">`);
  render();
  body.push('</a>');
}

function begin() {
  body = [];
  body.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#A87BFA"/>
      <stop offset="0.48" stop-color="#F37BE8"/>
      <stop offset="1" stop-color="#FFE7D8"/>
    </linearGradient>
    <linearGradient id="avatar" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4F2E8D"/>
      <stop offset="1" stop-color="#E9B4F2"/>
    </linearGradient>
    <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3A2B13"/>
      <stop offset="1" stop-color="#9A6C1B"/>
    </linearGradient>
    <linearGradient id="vip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2C176E"/>
      <stop offset="1" stop-color="#7046E9"/>
    </linearGradient>
    <linearGradient id="agency" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#813CF1"/>
      <stop offset="1" stop-color="#4168F1"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-30%" width="140%" height="170%">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#40217D" flood-opacity="0.13"/>
    </filter>
  </defs>
  <style>
    text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",Arial,sans-serif}
    .time{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-variant-numeric:tabular-nums;letter-spacing:.2px}
    a{cursor:pointer}
  </style>`);
}

function statusBar() {
  text(24, 28, '10:12', 14, C.white, 650);
  line(299, 25, 299, 20, C.white, 2);
  line(304, 25, 304, 18, C.white, 2);
  line(309, 25, 309, 15, C.white, 2);
  body.push('<path d="M321 21 Q329 13 337 21 M324 24 Q329 19 334 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>');
  rect(348, 15, 24, 13, 'none', 3, C.white);
  rect(350, 17, 11, 9, C.white, 1, 'none');
  rect(373, 19, 2, 5, C.white, 1, 'none');
  text(364, 26, '47', 9, C.white, 700, 'middle');
}

function profileHeader() {
  rect(0, 0, W, 418, 'url(#hero)');
  statusBar();
  circle(48, 92, 31, 'url(#avatar)', C.white, 1.5);
  circle(48, 92, 22, '#FFFFFF', 'none', 1);
  text(48, 97, 'LXW', 13, C.purpleDark, 700, 'middle');
  text(91, 78, 'lxw', 17, C.white, 600);
  rect(130, 64, 41, 20, '#55B9F8', 10, 'none');
  text(151, 79, '♂ 26', 11, C.white, 600, 'middle');
  text(91, 101, 'ID: 54914863', 11, '#FFF8FE', 400);
  rect(178, 91, 10, 10, 'none', 2, '#FFF8FE');
  body.push('<path d="M368 83 l7 7 -7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
  const stats = [
    ['9', 'Friends'],
    ['25', 'Follow'],
    ['1127', 'Followers']
  ];
  stats.forEach((item, index) => {
    const x = [65, 195, 325][index];
    text(x, 158, item[0], 21, C.ink, 650, 'middle');
    text(x, 181, item[1], 12, '#817983', 400, 'middle');
  });
}

function clockGlyph(x, y, color = C.purple) {
  circle(x, y, 12, '#F2EEFF');
  circle(x, y, 7, 'none', color, 1.5);
  line(x, y, x, y - 4, color, 1.5);
  line(x, y, x + 3.5, y + 2, color, 1.5);
}

function timeCard(mode = 'normal') {
  if (mode === 'normal') {
    link(1, () => {
      rect(16, 201, 358, 66, '#FFFFFF', 16, 'none', 0.88);
      clockGlyph(42, 234);
      text(65, 224, 'SANO TIME · UTC+8', 10, C.purple, 700);
      text(65, 247, '2026-09-21 10:12:35', 16, C.ink, 650, 'start', 'time');
      circle(349, 234, 10, '#F3EFFF');
      text(349, 238, 'i', 12, C.purple, 700, 'middle');
    });
  } else {
    rect(16, 201, 358, 66, '#FFFFFF', 16, 'none', 0.94);
    circle(42, 234, 12, '#FFF0F3');
    text(42, 239, '!', 15, C.red, 700, 'middle');
    text(65, 226, 'Unable to sync SANO Time', 13, C.ink, 650);
    text(65, 246, 'Check your connection and try again.', 10.5, C.muted);
    link(0, () => {
      rect(309, 219, 50, 30, '#F2EEFF', 15, 'none');
      text(334, 239, 'Retry', 11, C.purple, 650, 'middle');
    });
  }
}

function coinCards() {
  rect(16, 284, 171, 76, 'url(#coin)', 16, 'none');
  text(30, 309, 'COIN', 17, '#FFE8A7', 750);
  text(30, 340, '577,866', 22, C.white, 700);
  circle(156, 304, 18, '#FFD76A', '#FFF0A9', 2);
  text(156, 311, '★', 18, '#FFF5B8', 700, 'middle');
  rect(203, 284, 171, 76, 'url(#vip)', 16, 'none');
  text(220, 311, 'VIP', 21, '#FFE9A9', 750);
  rect(220, 327, 48, 20, '#FFF0B4', 10, 'none');
  text(244, 341, 'CHECK', 9, '#7A5415', 700, 'middle');
  body.push('<path d="M337 294 l7 10 12 1-9 8 3 12-13-7-12 7 3-12-9-8 12-1z" fill="#FFD873" stroke="#FFF0AC"/>');
}

function agencyBanner() {
  rect(16, 376, 358, 70, 'url(#agency)', 17, 'none');
  circle(51, 411, 20, '#A77AF7');
  circle(42, 408, 8, '#E9D8FF');
  circle(59, 408, 8, '#E9D8FF');
  rect(38, 416, 26, 12, '#E9D8FF', 6, 'none');
  text(82, 407, 'Apply to Become an Agency', 16, C.white, 700);
  text(82, 427, 'Recruit hosts  ·  Earn rewards', 11, '#E9E2FF', 400);
  rect(297, 394, 62, 34, '#FFF3BA', 17, 'none');
  text(328, 416, 'Join ›', 11, '#5533B3', 700, 'middle');
}

function featureIcon(x, y, tone, symbol) {
  circle(x, y, 20, tone, 'none');
  circle(x, y, 13, '#FFFFFF', 'none', 1);
  text(x, y + 5, symbol, 14, tone, 750, 'middle');
}

function featureGrid() {
  rect(16, 462, 358, 266, C.white, 22, 'none');
  const items = [
    ['Diamond', '#D84DE8', '◆'],
    ['Level', '#E9A93E', '♛'],
    ['Store', '#FF8C55', '□'],
    ['Bag', '#B85DF3', 'B'],
    ['Recharge', '#F0A13B', '+'],
    ['Task', '#FF6D70', '✓'],
    ['Invite', '#F7BE46', '✦'],
    ['Verification', '#6D87F6', '✓']
  ];
  items.forEach((item, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = 61 + col * 89;
    const y = 508 + row * 105;
    featureIcon(x, y, item[1], item[2]);
    text(x, y + 38, item[0], 11.5, C.ink, 450, 'middle');
  });
}

function bottomNav() {
  rect(0, 772, W, 72, '#FFFFFF', 0, 'none', 0.98);
  line(0, 772, W, 772, '#F1EEF5');
  const xs = [46, 121, 196, 271, 345];
  xs.forEach((x, index) => {
    if (index === 4) {
      rect(313, 786, 68, 39, '#FF8C2A', 20, 'none');
      circle(332, 805, 13, '#FFF4D9');
      text(332, 809, '☺', 14, '#F3A13C', 600, 'middle');
      text(357, 810, 'Profile', 9, C.white, 700, 'middle');
    } else {
      circle(x, 805, 14, '#E7E3EC');
      const glyph = index === 0 ? '▷' : index === 1 ? '◇' : index === 2 ? '⌂' : '♟';
      text(x, 810, glyph, 13, C.white, 650, 'middle');
    }
  });
  rect(128, 836, 134, 5, '#111111', 3, 'none');
}

function profilePage(mode = 'normal') {
  rect(0, 0, W, H, C.bg);
  profileHeader();
  timeCard(mode);
  coinCards();
  agencyBanner();
  featureGrid();
  bottomNav();
}

function finish(pageId) {
  body.push('</svg>');
  fs.writeFileSync(path.join(sourceDir, pages[pageId].file + '.svg'), body.join('\n'), 'utf8');
}

// 01 / Default profile state
begin();
profilePage('normal');
finish(0);

// 02 / Information sheet state
begin();
profilePage('normal');
rect(0, 0, W, H, '#21152F', 0, 'none', 0.42);
link(0, () => rect(0, 0, W, 386, '#21152F', 0, 'none', 0.01));
rect(0, 386, W, 458, C.white, 26, 'none');
rect(166, 397, 58, 5, '#DDD8E3', 3, 'none');
text(24, 438, 'About SANO Time', 21, C.ink, 700);
link(0, () => {
  circle(355, 430, 16, '#F5F2F8');
  text(355, 436, '×', 22, C.muted, 400, 'middle');
});
rect(24, 466, 342, 86, '#F6F2FF', 17, 'none');
clockGlyph(48, 509);
text(70, 494, 'SANO TIME · UTC+8', 10, C.purple, 700);
text(70, 525, '2026-09-21 10:12:35', 18, C.ink, 700, 'start', 'time');
text(24, 590, 'Official time for settlement', 16, C.ink, 700);
text(24, 617, 'SANO Time is used for daily resets, activity', 13, C.muted);
text(24, 637, 'periods, rankings and settlements.', 13, C.muted);
circle(31, 674, 4, C.purple);
text(45, 679, 'Fixed at UTC+8 all year round', 13, C.ink, 500);
circle(31, 708, 4, C.purple);
text(45, 713, 'Shown in 24-hour format', 13, C.ink, 500);
circle(31, 742, 4, C.purple);
text(45, 747, 'Your device time zone does not change it', 13, C.ink, 500);
link(0, () => {
  rect(24, 779, 342, 48, C.purple, 24, 'none');
  text(195, 809, 'Got it', 15, C.white, 700, 'middle');
});
finish(1);

// 03 / Server-time sync error state
begin();
profilePage('error');
finish(2);

const cards = pages.map(page => `
  <article class="card">
    <div class="meta"><span>${String(page.id + 1).padStart(2, '0')}</span><strong>${esc(page.name)}</strong></div>
    <a class="preview" href="原型图/${page.file}.png" target="_blank" rel="noreferrer">
      <img src="原型图/${page.file}.png" alt="${esc(page.name)}">
    </a>
    <div class="actions">
      <a href="原型图/${page.file}.png" target="_blank" rel="noreferrer">PNG</a>
      <a href="源文件/${page.file}.svg" target="_blank" rel="noreferrer">SVG</a>
    </div>
  </article>`).join('');

const navigation = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SANO Time 原型导航</title>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;color:#282334;background:#efedf4}
    *{box-sizing:border-box}body{margin:0}.wrap{max-width:1220px;margin:0 auto;padding:42px 28px 60px}
    header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}
    h1{margin:0;font-size:30px;letter-spacing:-.5px}.sub{margin:8px 0 0;color:#766f80;font-size:14px}
    .rule{font-size:13px;color:#6f3cf6;background:#f4efff;border:1px solid #ded3ff;border-radius:999px;padding:9px 14px;white-space:nowrap}
    .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.card{background:#fff;border-radius:22px;padding:14px;box-shadow:0 12px 30px rgba(55,35,91,.09)}
    .meta{height:42px;display:flex;align-items:center;gap:10px}.meta span{font:700 12px ui-monospace,monospace;color:#6f3cf6}.meta strong{font-size:15px}
    .preview{display:block;background:#e8e4ef;border-radius:15px;overflow:hidden}.preview img{display:block;width:100%;height:auto}
    .actions{display:flex;gap:10px;padding-top:12px}.actions a{flex:1;text-align:center;text-decoration:none;color:#5930d8;background:#f4f0ff;border-radius:10px;padding:9px;font-size:13px;font-weight:700}
    @media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:620px){.wrap{padding:28px 16px 44px}header{display:block}.rule{display:inline-block;margin-top:16px}.grid{grid-template-columns:1fr}.card{max-width:430px;margin:0 auto}}
  </style>
</head>
<body>
  <main class="wrap">
    <header>
      <div><h1>SANO Time 原型</h1><p class="sub">个人中心官方时间 · 默认态、说明弹层与同步异常态</p></div>
      <div class="rule">Official time · UTC+8 · No local conversion</div>
    </header>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(root, '原型导航.html'), navigation, 'utf8');
console.log('Generated ' + pages.length + ' SVG prototypes and navigation.');


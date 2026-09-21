const fs = require('fs');
const path = require('path');

const moduleRoot = process.argv[2];
if (!moduleRoot) throw Error('Usage: node render-prototypes.js <node_modules>');
const sharp = require(path.join(moduleRoot, 'sharp'));
const root = path.resolve(__dirname, '..');
const dir = path.join(root, '原型图');
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));
fs.mkdirSync(dir, { recursive: true });

(async () => {
  for (const page of pages) {
    const target = path.join(dir, page.file + '.png');
    await sharp(path.join(root, '源文件', page.file + '.svg')).png().toFile(target);
    const meta = await sharp(target).metadata();
    if (meta.width !== 390 || meta.height !== 844) throw Error('Invalid size ' + page.file);
    console.log(page.file);
  }

  const composites = [];
  for (const [index, page] of pages.entries()) {
    composites.push({
      input: path.join(dir, page.file + '.png'),
      left: index * 390,
      top: 0
    });
  }
  await sharp({
    create: { width: pages.length * 390, height: 844, channels: 4, background: '#ECEAF3' }
  }).composite(composites).png().toFile(path.join(dir, '00-原型总览.png'));
  console.log('Rendered ' + pages.length + ' PNGs and contact sheet.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});


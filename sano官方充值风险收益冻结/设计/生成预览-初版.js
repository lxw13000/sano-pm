const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const assert = require('assert');
const { chromium } = require('C:/Users/24725/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

async function main() {
  const root = __dirname;
  const html = path.join(root, '管理端原型.html');
  const out = path.join(root, '预览图');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = pathToFileURL(html).toString();
  const shots = [
    ['01-主播冻结钻石列表.png', '?view=anchors'],
    ['02-主播按日数据.png', '?view=daily&anchor=20101849'],
    ['03-消费者贡献明细.png', '?view=daily&anchor=20101849&detail=2026-09-25'],
    ['04-风险充值用户.png', '?view=risks'],
    ['05-解封审核列表.png', '?view=reviews'],
    ['06-人工解封审核.png', '?view=reviews&case=FR-20261010-001'],
  ];
  for (const [filename, query] of shots) {
    await page.goto(url + query);
    await page.screenshot({ path: path.join(out, filename), fullPage: !query.includes('detail=') && !query.includes('case=') });
    assert(await page.locator('h1').count(), `页面标题缺失：${query}`);
    console.log(filename);
  }
  await page.goto(url + '?view=daily&anchor=20101849');
  const days = await page.locator('[data-action="show-contribution"]').all();
  for (const day of days) {
    const freeze = Number((await day.locator('xpath=../preceding-sibling::td[1]').innerText()).replaceAll(',', ''));
    await day.click();
    const total = Number((await page.locator('.detail-cell').nth(1).locator('strong').innerText()).replaceAll(',', ''));
    assert.equal(total, freeze, '消费者贡献合计与当日冻结数不一致');
    await page.locator('[data-action="close-drawer"]').last().click();
  }
  await page.goto(url + '?view=daily&anchor=20101849&detail=2026-09-25');
  await page.locator('#contrib-uid').fill('20101849');
  await page.locator('[data-action="filter-contribution"]').click();
  assert.equal(await page.locator('#contrib-body tr').count(), 1, '消费者 UID 筛选未生效');
  await page.goto(url + '?view=reviews&case=FR-20261010-001');
  await page.locator('#review-comment').fill('已核对该收益入账满 180 天。');
  await page.locator('[data-decision="通过"]').click();
  await page.locator('[data-tab="审核记录"]').click();
  assert(await page.locator('text=已通过 · 待执行').count(), '审核状态未更新');
  assert.deepEqual(errors, [], '页面脚本错误');
  await browser.close();
  console.log('页面、筛选、对账和审核演示检查通过');
}

main().catch(error => { console.error(error); process.exitCode = 1; });

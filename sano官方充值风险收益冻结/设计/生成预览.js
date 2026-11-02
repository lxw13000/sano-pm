const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const assert = require('assert');
const { chromium } = require('C:/Users/24725/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

async function main() {
  const root = __dirname;
  const html = path.join(root, '管理端原型.html');
  const output = path.join(root, '预览图-三表流程');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = pathToFileURL(html).toString();
    const shots = [
      ['01-风险充值用户.png', '?view=risk'],
      ['02-主播冻结钻石.png', '?view=freeze'],
      ['03-上账用户日数据.png', '?view=freeze&receive=20101849'],
      ['04-消费者贡献明细.png', '?view=freeze&receive=20101849&day=20260925'],
      ['05-解封钻石退款列表.png', '?view=refund'],
      ['11-风险录入权限.png', '?view=risk&role=entry'],
      ['12-人工解除权限.png', '?view=risk&role=release'],
      ['13-退款操作权限.png', '?view=refund&role=refund'],
    ];
    for (const [filename, query] of shots) {
      await page.goto(url + query);
      assert(await page.locator('h1').count(), `标题缺失：${query}`);
      await page.screenshot({ path: path.join(output, filename), fullPage: !query.includes('day=') });
      console.log(filename);
    }
    await page.goto(url + '?view=risk');
    assert(!(await page.locator('#screen').innerText()).includes('退款'), '风险充值用户页不应显示退款信息');
    assert.equal(await page.locator('#screen [data-action="open-refund"]').count(), 0, '风险充值用户页不应有退款操作');
    await page.goto(url + '?view=risk&role=entry');
    assert.equal(await page.locator('[data-action="add-risk"]').count(), 1, '风险录入员应能加入名单');
    assert.equal(await page.locator('[data-action="manual-release"]').count(), 0, '风险录入员不应看到人工解除');
    assert.equal(await page.locator('[data-nav="refund"]:visible').count(), 0, '风险录入员不应看到退款入口');
    await page.goto(url + '?view=risk&role=release');
    assert.equal(await page.locator('[data-action="add-risk"]').count(), 0, '风险解除员不应看到加入按钮');
    assert(await page.locator('[data-action="manual-release"]').count(), '风险解除员应能人工解除');
    await page.goto(url + '?view=refund&role=refund');
    assert.equal(await page.locator('[data-nav="risk"]:visible').count(), 0, '退款操作员不应看到风险名单操作入口');
    assert.equal(await page.locator('tbody tr').count(), 7, '退款页应展示全部风险用户');
    assert.equal(await page.locator('[data-action="open-refund"]').count(), 2, '仅满足条件的用户可进入退款操作');
    await page.locator('[data-action="open-refund"][data-id="39912001"]').click();
    assert(await page.locator('#overlay:visible .refund-drawer').count(), '退款操作前未打开批量解封抽屉');
    const risky = await page.evaluate(() => assess(freezeUsers.find(u => u.userId === '39912001')));
    assert.deepEqual([risky.official, risky.third, risky.value, risky.diamonds, risky.shortfall], [50, 10, 504000, 560000, true], '充值价值不足示例计算错误');
    assert.equal(await page.locator('.refund-table-scroll tbody tr').count(), 1, '抽屉应展示该用户全部可解封记录');
    assert(await page.locator('.refund-summary .hint.danger').count(), '充值价值不足应显示提示');
    assert(await page.locator('.refund-drawer .drawer-foot [data-action="refund-all"]').count(), '抽屉底部应有一次性解封按钮');
    await page.screenshot({ path: path.join(output, '14-充值价值不足提示.png') });
    await page.locator('[data-action="refund-all"]').click();
    assert.equal(await page.evaluate(() => freezeRows.filter(r => r.userId === '39912001' && r.refund).length), 1, '风险提示不应阻止批量解封');
    assert.equal(await page.evaluate(() => freezeUsers.find(u => u.userId === '39912001').refund), 1, '批量完成后用户退款状态应更新');
    await page.screenshot({ path: path.join(output, '15-充值不足仍可解封.png') });
    await page.goto(url + '?view=refund&role=refund');
    await page.locator('[data-action="open-refund"][data-id="20101849"]').click();
    const safe = await page.evaluate(() => assess(freezeUsers.find(u => u.userId === '20101849')));
    assert.deepEqual([safe.official, safe.third, safe.value, safe.diamonds, safe.shortfall], [40, 5, 378000, 81162, false], '充值价值覆盖示例计算错误');
    assert.equal(await page.locator('.refund-table-scroll tbody tr').count(), 2, '同一用户的可解封汇总记录应全部展示');
    const layout = await page.evaluate(() => {
      const table = document.querySelector('.refund-table-scroll');
      const footer = document.querySelector('.refund-drawer .drawer-foot');
      return { overflow: getComputedStyle(table).overflowY, tableBottom: table.getBoundingClientRect().bottom, footerTop: footer.getBoundingClientRect().top };
    });
    assert(layout.overflow === 'auto' && layout.tableBottom <= layout.footerTop + 2, '汇总表需内部滚动且底部按钮固定');
    await page.screenshot({ path: path.join(output, '06-按用户批量解封抽屉.png') });
    await page.screenshot({ path: path.join(output, '16-充值价值覆盖提示.png') });
    await page.locator('[data-action="refund-all"]').click();
    const batch = await page.evaluate(() => ({ rows: freezeRows.filter(r => r.userId === '20101849').map(r => [r.refund, r.refundUser, r.refundTime]), user: freezeUsers.find(u => u.userId === '20101849') }));
    assert.deepEqual(batch.rows, [[1, 'refund.operator', '2026-10-10 14:00:00'], [1, 'refund.operator', '2026-10-10 14:00:00']], '应在一次操作中解除该用户全部可解封汇总记录');
    assert.equal(batch.user.refund, 1, '全部处理后应更新用户级退款状态');
    await page.screenshot({ path: path.join(output, '10-批量解封完成.png') });
    await page.goto(url + '?view=risk');
    await page.locator('[data-action="add-risk"]').click();
    await page.screenshot({ path: path.join(output, '08-手动加入风险用户.png') });
    await page.locator('[data-action="close-modal"]').click();
    await page.locator('[data-action="manual-release"]').first().click();
    await page.screenshot({ path: path.join(output, '09-人工解除封禁.png') });
    await page.locator('[data-action="close-modal"]').click();
    await page.goto(url + '?view=risk');
    await page.locator('[data-action="add-risk"]').click();
    await page.locator('#new-uid').fill('45000001');
    await page.locator('[data-action="confirm-modal"]').click();
    assert(await page.locator('text=45000001').count(), '手动加入未生效');
    await page.locator('#risk-uid').fill('45000001');
    await page.locator('[data-action="filter-risk"]').click();
    assert.equal(await page.locator('tbody tr').count(), 1, '风险用户 UID 筛选未生效');
    await page.locator('[data-action="manual-release"]').click();
    await page.locator('#release-note').fill('人工核验通过');
    await page.locator('[data-action="confirm-modal"]').click();
    assert(await page.locator('text=已解除').count(), '人工解除后名单状态应更新');
    await page.locator('[data-nav="refund"]').click();
    await page.locator('#refund-uid').fill('45000001');
    await page.locator('[data-action="filter-refund"]').click();
    assert(await page.locator('text=等待 24 小时').count(), '人工解除后退款操作应等待 24 小时');
    await page.goto(url + '?view=freeze&receive=20101849');
    const days = await page.locator('[data-action="open-contribution"]').all();
    for (const day of days) {
      const total = Number((await day.locator('xpath=../preceding-sibling::td[4]').innerText()).replaceAll(',', ''));
      await day.click();
      const detailTotal = Number((await page.locator('.detail-cell strong').first().innerText()).replaceAll(',', ''));
      assert.equal(detailTotal, total, '日数据与消费者贡献合计不一致');
      await page.locator('[data-action="close-drawer"]').last().click();
    }
    await page.goto(url + '?view=freeze&receive=20101849&day=20260925');
    await page.locator('#consumer-uid').fill('39818897');
    await page.locator('[data-action="filter-consumer"]').click();
    assert.equal(await page.locator('.drawer tbody tr').count(), 1, '消费者 UID 筛选未生效');
    await page.locator('[data-action="record-detail"]').click();
    assert(await page.locator('text=冻结钻石逐笔流水').count(), '逐笔流水未打开');
    await page.goto(url + '?view=refund');
    await page.locator('#refund-uid').fill('42001772');
    await page.locator('[data-action="filter-refund"]').click();
    assert.equal(await page.locator('[data-action="open-refund"]').count(), 0, '未满 24 小时应禁止批量解封');
    await page.screenshot({ path: path.join(output, '07-未满24小时.png') });
    assert.deepEqual(errors, [], '页面脚本错误');
    console.log('页面、筛选、逐层对账、24 小时限制和按用户批量解封检查通过');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

// Browser verification: runs a full journey for all three products at each target
// viewport, checking layout rules (A13) and a keyboard-only pass (A14), and saves
// screenshots. Needs the dev server (npm run dev) or DEMO_URL pointing at a build.
//
//   node scripts/verify.mjs   -> report + docs/screenshots/* + docs/verification-results.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BASE_URL, VIEWPORTS, launch, newPage } from './browser.mjs';

const OUT = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const results = [];
const record = (area, ok, detail = '') => {
  results.push({ area, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${area}${detail ? ` — ${detail}` : ''}`);
};

/** Layout rules that must hold on every screen. */
async function checkLayout(page, label) {
  const r = await page.evaluate(() => {
    const out = { overflowX: false, small: [], covered: [] };
    const de = document.documentElement;
    out.overflowX = de.scrollWidth > de.clientWidth + 1;
    const content = document.querySelector('.content');
    if (content && content.scrollWidth > content.clientWidth + 1) out.overflowX = true;
    for (const el of document.querySelectorAll('button, a[href]')) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (b.width < 43.5 || b.height < 43.5) {
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);
        out.small.push(`${name} ${Math.round(b.width)}x${Math.round(b.height)}`);
      }
    }
    // the footer must never cover what sits at the end of the scrolling content
    if (content) {
      content.scrollTop = content.scrollHeight;
      const footer = document.querySelector('.footer');
      const fTop = footer ? footer.getBoundingClientRect().top : innerHeight;
      if (content.getBoundingClientRect().bottom > fTop + 1) out.covered.push('content extends under footer');
      // the summary aside scrolls inside itself, so judge the main column
      const scope = content.querySelector('.configure-main') ?? content;
      const last = [...scope.querySelectorAll('button, li, p, section')].pop();
      if (last && last.getBoundingClientRect().bottom > fTop + 1) out.covered.push('last element under footer');
      content.scrollTop = 0;
    }
    return out;
  });
  const ok = !r.overflowX && r.small.length === 0 && r.covered.length === 0;
  record(`layout ${label}`, ok, ok ? '' : JSON.stringify(r));
}

const shot = (page, vp, name) => page.screenshot({ path: `${OUT}${vp}__${name}.png` });

async function freshStart(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-product]');
}

async function journey(page, vp, product) {
  await freshStart(page);
  const tag = `${vp} ${product}`;
  if (product === 'suit') {
    await checkLayout(page, `${tag} start`);
    await shot(page, vp, '01-start');
  }
  await page.click(`[data-product="${product}"]`);
  if (product === 'suit') await page.click('[data-mode="preset"]');
  await page.getByRole('button', { name: 'Bắt đầu tư vấn' }).click();
  await checkLayout(page, `${tag} configure`);
  if (product === 'suit') await shot(page, vp, '02-configure-closure');

  // Walk every group of the first garment (manual products choose the second option).
  const total = await page.locator('nav ol li').count();
  for (let i = 0; i < total; i += 1) {
    if (product !== 'suit') {
      const cards = page.locator('.option');
      await cards.nth(Math.min(1, (await cards.count()) - 1)).click();
    }
    if (i < total - 1) await page.getByRole('button', { name: 'Tiếp tục' }).click();
  }
  if (product === 'suit') {
    await page.locator('.garment-tab').nth(1).click();
    await shot(page, vp, '03-configure-trousers');
    await checkLayout(page, `${tag} configure trousers`);
    await page.getByRole('button', { name: 'Tìm hiểu thêm' }).click();
    await shot(page, vp, '04-learn-more');
    await checkLayout(page, `${tag} configure learn-more`);
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  const toggle = page.locator('.summary-toggle');
  if (await toggle.isVisible()) await toggle.click();
  if (product === 'suit') await shot(page, vp, '05-summary');
  await page.locator('.summary-panel').getByRole('button', { name: 'Xem lại thiết kế' }).click();
  await checkLayout(page, `${tag} review`);
  await shot(page, vp, `06-review-${product}`);
  await page.getByRole('button', { name: 'Xác nhận thiết kế' }).click();
  await checkLayout(page, `${tag} confirmed`);
  await shot(page, vp, `07-confirmed-${product}`);

  if (product === 'suit') {
    await page.getByRole('button', { name: 'Chỉnh sửa thiết kế' }).click();
    await page.getByRole('button', { name: 'Chỉnh sửa: Gấu quần' }).click();
    await page.click('[data-option="hem.turnUp"]');
    await page.getByRole('button', { name: 'Xong, về xem lại' }).click();
    await page.getByRole('button', { name: 'Xác nhận thiết kế' }).click();
    await shot(page, vp, '08-confirmed-revision-2');
    await page.getByRole('button', { name: 'EN' }).click();
    await shot(page, vp, '09-confirmed-english');
    await checkLayout(page, `${tag} confirmed (EN)`);
  }
}

/** A14: everything below is done with the keyboard only. */
async function keyboardPass(page, vp) {
  await freshStart(page);
  const focusVisible = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return 'focus is on <body>';
      const cs = getComputedStyle(el);
      const ok = el.matches(':focus-visible') && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
      return ok ? null : `no ring on <${el.tagName.toLowerCase()}> ${(el.textContent || '').trim().slice(0, 30)}`;
    });
  const ringProblems = [];
  const press = async (key) => {
    await page.keyboard.press(key);
    const problem = await focusVisible();
    if (problem) ringProblems.push(`${key}: ${problem}`);
  };

  // Tab from the page start to the blazer card, using only the keyboard to select.
  for (let i = 0; i < 6; i += 1) {
    await press('Tab');
    if (await page.evaluate(() => document.activeElement?.matches('[data-product="blazer"]'))) break;
  }
  await page.keyboard.press('Enter');
  await press('Tab'); // trousers card
  await press('Tab'); // manual mode
  await press('Tab'); // preset mode
  await page.keyboard.press('Space');
  await press('Tab'); // start button
  await page.keyboard.press('Enter');
  const heading = await page.getByRole('heading', { level: 1 }).textContent();
  record(`keyboard ${vp} start -> configure`, heading?.includes('Kiểu cài áo'), heading ?? '');

  // Modal: focus is trapped, Escape closes it, focus returns to the opener.
  await page.getByRole('button', { name: 'Nhờ nhà may gợi ý' }).focus();
  await page.keyboard.press('Enter');
  let trapped = true;
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('Tab');
    trapped = trapped && (await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')));
  }
  await page.keyboard.press('Escape');
  const returned = await page.evaluate(() => document.activeElement?.textContent?.includes('Nhờ nhà may gợi ý'));
  record(`keyboard ${vp} modal traps focus, Escape closes, focus returns`, trapped && returned, JSON.stringify({ trapped, returned }));

  // Change a value, move through every group, review, confirm.
  await page.locator('[data-option="closure.sb1"]').focus();
  await page.keyboard.press('Space');
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('button', { name: 'Tiếp tục' }).focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: 'Xem lại thiết kế' }).last().focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Xác nhận thiết kế' }).focus();
  await press('Enter');
  const done = await page.getByRole('heading', { level: 1 }).textContent();
  record(`keyboard ${vp} full journey to confirmation`, done?.includes('Đã xác nhận'), done ?? '');
  record(`keyboard ${vp} focus ring visible while tabbing`, ringProblems.length === 0, ringProblems.join('; '));
}

const browser = await launch();
for (const [vp, size] of Object.entries(VIEWPORTS)) {
  const { page, context } = await newPage(browser, size);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const product of ['suit', 'blazer', 'trousers']) await journey(page, vp, product);
  await keyboardPass(page, vp);
  record(`no console errors ${vp}`, errors.length === 0, errors.join(' | '));
  await context.close();
}
await browser.close();

writeFileSync(
  fileURLToPath(new URL('../docs/verification-results.json', import.meta.url)),
  JSON.stringify(results, null, 2),
);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

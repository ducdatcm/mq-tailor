// Browser verification: runs a full journey for all three products at each target
// viewport, checking layout rules (A13) and a keyboard-only pass (A14), and saves
// screenshots. Needs the dev server (npm run dev) or DEMO_URL pointing at a build.
//
//   node scripts/verify.mjs   -> report + docs/screenshots/* + docs/verification-results.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BASE_URL, VIEWPORTS, launch, newPage } from './browser.mjs';
import { startMockSheet } from './mock-sheet-server.mjs';

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
// The original three products keep a full set of screenshots; the newer ones only the screens that differ.
const ORIGINAL = ['suit', 'blazer', 'trousers'];

/** The order screen: fill in the three details (unless already there) and confirm the order. */
async function confirmOrder(page, tag, vp, shotName) {
  await page.waitForSelector('#order-orderId');
  await checkLayout(page, `${tag} order`);
  if (shotName) await shot(page, vp, shotName);
  if (!(await page.inputValue('#order-orderId'))) {
    await page.fill('#order-orderId', 'MQ-0001');
    await page.fill('#order-customerName', 'Nguyễn Văn An');
    await page.fill('#order-phone', '0912 345 678');
  }
  await page.getByRole('button', { name: 'Xác nhận đơn' }).click();
}

async function freshStart(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-product]');
}

/** The cuffs screen: four drawn button counts, plus the functional / closed choice shared by all four. */
async function cuffsScreenOk(page) {
  await page.locator('.garment-tab').first().click();
  await page.locator('nav ol button').nth(6).click();
  const counts = await page.locator('[data-option^="cuffs."]').count();
  const drawn = await page.locator('[data-option^="cuffs."] svg.sk').count();
  const shared = page.locator('[data-companion="cuffMode"] [data-option]');
  const sharedCount = await shared.count();
  await page.click('[data-option="cuffMode.functional"]');
  const pressed = await page.getAttribute('[data-option="cuffMode.functional"]', 'aria-pressed');
  const note = await page.locator('[data-option="cuffMode.functional"]').textContent();
  return counts === 4 && drawn === 4 && sharedCount === 2 && pressed === 'true' && /sport jacket/i.test(note ?? '');
}

async function journey(page, vp, product) {
  await freshStart(page);
  const tag = `${vp} ${product}`;
  // Multi-garment products start from the house suggestion; single-garment ones are chosen by hand.
  const preset = product === 'suit' || product === 'suit3Trousers' || product === 'suit3Waistcoat' || product === 'shirt';
  if (product === 'suit') {
    await checkLayout(page, `${tag} start`);
    await shot(page, vp, '01-start');
    const brand = await page.evaluate(() => ({
      logo: !!document.querySelector('.header svg[aria-label="Minh Quang Bespoke"]'),
      oldText: document.querySelector('.header')?.textContent?.includes('Nhà may') ?? false,
    }));
    record(`header shows the logo and no tagline ${vp}`, brand.logo && !brand.oldText, JSON.stringify(brand));
  }
  await page.click(`[data-product="${product}"]`);
  // two of the three-piece suit and of the shirt, to see the quantity reach the order
  const quantity = product === 'suit3Trousers' || product === 'shirt' ? 2 : 1;
  if (quantity === 2) await page.click(`[data-quantity="${product}"] [data-qty="plus"]`);
  if (product === 'suit3Trousers') {
    const list = await page.textContent('[data-order-list]');
    record(`the start screen says what the order holds ${vp}`, /Suit ba mảnh \(1 áo \+ 2 quần\) × 2/.test(list ?? ''), list ?? '');
  }
  if (preset) await page.click('[data-mode="preset"]');
  await page.getByRole('button', { name: 'Bắt đầu tư vấn' }).click();
  await checkLayout(page, `${tag} configure`);
  if (product === 'suit') await shot(page, vp, '02-configure-closure');

  // Walk every group of the first garment (manual products choose the second option).
  const total = await page.locator('nav ol li').count();
  for (let i = 0; i < total; i += 1) {
    if (!preset) {
      const cards = page.locator('.option');
      await cards.nth(Math.min(1, (await cards.count()) - 1)).click();
      // a choice made on this screen for the group above (e.g. functional / closed cuff buttons)
      const shared = page.locator('[data-companion] .option');
      if (await shared.count()) await shared.nth(1).click();
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
  if (product === 'suit3Trousers') {
    // the second trousers can copy the first
    await page.click('[data-unit="trousers2"]');
    await page.click('[data-same-as-source="trousers1"]');
    await checkLayout(page, `${tag} configure trousers 2`);
    if (vp === 'tablet-1280x800') await shot(page, vp, '03b-configure-trousers2-same');
    const same = await page.evaluate(() => JSON.parse(sessionStorage.getItem('mq-tablet-demo/v1')).state);
    record(`second trousers copy the first ${vp}`, same.sameAs.trousers2 === 'trousers1' && JSON.stringify(same.selections.trousers1) === JSON.stringify(same.selections.trousers2), '');
  }
  if (product === 'waistcoat' || product === 'suit3Waistcoat') {
    if (product === 'suit3Waistcoat') await page.locator('.garment-tab').nth(1).click();
    await checkLayout(page, `${tag} configure waistcoat`);
    if (vp === 'tablet-1280x800') await shot(page, vp, '03c-configure-waistcoat');
    record(`waistcoat shows four options ${vp} ${product}`, (await page.locator('.option').count()) === 4, '');
  }
  if (product === 'shirt') {
    // short sleeves have no cuffs: the step goes away and comes back
    await page.locator('nav ol button').first().click();
    const steps = () => page.locator('nav ol li').count();
    const before = await steps();
    await page.click('[data-option="sleeve.short"]');
    const short = await steps();
    const shortSummary = await page.evaluate(() => document.querySelector('.summary-panel')?.textContent ?? '');
    await page.click('[data-option="sleeve.long"]');
    const back = await steps();
    record(`shirt: short sleeves drop the cuff step ${vp}`, before === 6 && short === 5 && back === 6 && !/Cổ tay áo/.test(shortSummary), JSON.stringify({ before, short, back }));
    if (vp === 'tablet-1280x800') await shot(page, vp, '03d-configure-shirt');
    await page.locator('nav ol button').nth(1).click();
    await checkLayout(page, `${tag} configure collar`);
    if (vp === 'tablet-1280x800') await shot(page, vp, '03e-configure-collar');
  }
  if (!preset) {
    // the trims (buttons and buttonholes) are chosen by hand too
    await page.locator('.garment-tab').last().click();
    await checkLayout(page, `${tag} configure trims`);
    const trimSteps = await page.locator('nav ol li').count();
    for (let i = 0; i < trimSteps; i += 1) {
      await page.locator('.option').nth(1).click();
      if (i < trimSteps - 1) await page.getByRole('button', { name: 'Tiếp tục' }).click();
    }
  }
  if (product === 'blazer') {
    record(`cuffs: four button counts and a shared functional / closed choice ${vp}`, await cuffsScreenOk(page), '');
  }
  const toggle = page.locator('.summary-toggle');
  if (await toggle.isVisible()) await toggle.click();
  if (product === 'suit') await shot(page, vp, '05-summary');
  await page.locator('.summary-panel').getByRole('button', { name: 'Xem lại thiết kế' }).click();
  await checkLayout(page, `${tag} review`);
  if (ORIGINAL.includes(product)) await shot(page, vp, `06-review-${product}`);
  await page.getByRole('button', { name: 'Xác nhận thiết kế' }).click();
  await confirmOrder(page, tag, vp, ORIGINAL.includes(product) ? `06b-order-${product}` : undefined);
  await checkLayout(page, `${tag} confirmed`);
  if (ORIGINAL.includes(product)) await shot(page, vp, `07-confirmed-${product}`);

  // the order row reaches the (mock) spreadsheet, and the design sheet exports as a PDF
  await page.waitForSelector('[data-sheet-status="sent"]', { timeout: 5000 }).catch(() => {});
  const status = await page.getAttribute('[data-sheet-status]', 'data-sheet-status');
  const row = mock.rows.filter((r) => r.orderId === 'MQ-0001' && r.rows?.length > 0).at(-1);
  record(`order row sent ${tag}`, status === 'sent' && Boolean(row) && row.customerName === 'Nguyễn Văn An', `status=${status}`);
  if (quantity === 2) {
    const lines = (row?.rows ?? []).map((r) => `${r.item} × ${r.quantity}`).join(', ');
    const expected = product === 'shirt' ? 'Sơ mi × 2' : 'Áo × 2, Quần × 4'; // the two three-piece suits are made alike
    record(`spreadsheet lines carry the quantity ${tag}`, lines === expected, lines);
  }
  if (product === 'suit' || product === 'suit3Trousers') {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('[data-export-pdf]')]);
    const stream = await dl.createReadStream();
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    const pdf = Buffer.concat(chunks);
    record(`pdf export ${tag}`, pdf.subarray(0, 5).toString() === '%PDF-' && pdf.length > 50000 && /phieu-thiet-ke_MQ-0001_\d{8}\.pdf/.test(dl.suggestedFilename()) && /MediaBox \[0 0 595\.28 841\.94\]/.test(pdf.toString('latin1', 0, 2000)), `${dl.suggestedFilename()} ${pdf.length} bytes`);
  }

  if (product === 'suit') {
    await page.getByRole('button', { name: 'Chỉnh sửa thiết kế' }).click();
    await page.getByRole('button', { name: 'Chỉnh sửa: Gấu quần' }).click();
    await page.click('[data-option="hem.turnUp"]');
    await page.getByRole('button', { name: 'Xong, về xem lại' }).click();
    await page.getByRole('button', { name: 'Xác nhận thiết kế' }).click();
    await confirmOrder(page, tag, vp);
    await shot(page, vp, '08-confirmed-revision-2');
    await page.getByRole('button', { name: 'EN' }).click();
    await shot(page, vp, '09-confirmed-english');
    await checkLayout(page, `${tag} confirmed (EN)`);
  }
}

/** An order of several products: 1 suit and 2 trousers, where trousers 2 and 3 are "same as trousers 1". */
async function mixedOrderJourney(page, vp) {
  await freshStart(page);
  const tag = `${vp} mixed order`;
  await page.click('[data-product="suit"]');
  await page.click('[data-product="trousers"]');
  await page.click('[data-quantity="trousers"] [data-qty="plus"]');
  const list = (await page.textContent('[data-order-list]')) ?? '';
  record(`start screen: several products with their own quantities ${vp}`, /Suit hai mảnh × 1/.test(list) && /Quần tây × 2/.test(list), list);
  if (vp === 'tablet-1280x800') await shot(page, vp, '01b-start-order');
  await checkLayout(page, `${tag} start`);
  await page.click('[data-mode="preset"]');
  await page.getByRole('button', { name: 'Bắt đầu tư vấn' }).click();
  const units = await page.locator('[data-unit]').evaluateAll((els) => els.map((e) => e.getAttribute('data-unit')));
  record(`every piece is designed: jacket, trousers 1 to 3, trims ${vp}`, units.join(',') === 'jacket1,trousers1,trousers2,trousers3,trims', units.join(','));
  await checkLayout(page, `${tag} configure`);

  await page.click('[data-unit="trousers1"]');
  await page.click('[data-option="pleats.two"]');
  await page.click('[data-unit="trousers2"]');
  const offered = await page.locator('[data-same-as-source]').evaluateAll((els) => els.map((e) => e.getAttribute('data-same-as-source')));
  record(`trousers 2 can copy trousers 1 ${vp}`, offered.join(',') === 'trousers1,none', offered.join(','));
  await page.click('[data-same-as-source="trousers1"]');
  const copied = await page.getAttribute('[data-option="pleats.two"]', 'aria-pressed');
  record(`"same as trousers 1" copies the choices ${vp}`, copied === 'true', copied ?? '');
  if (vp === 'tablet-1280x800') await shot(page, vp, '03f-same-as');
  await checkLayout(page, `${tag} configure trousers 2`);
  await page.click('[data-unit="trousers3"]');
  const offered3 = await page.locator('[data-same-as-source]').evaluateAll((els) => els.map((e) => e.getAttribute('data-same-as-source')));
  record(`trousers 3 can copy trousers 1 or 2 ${vp}`, offered3.join(',') === 'trousers1,trousers2,none', offered3.join(','));
  await page.click('[data-same-as-source="trousers2"]');

  const toggle = page.locator('.summary-toggle');
  if (await toggle.isVisible()) await toggle.click();
  await page.locator('.summary-panel').getByRole('button', { name: 'Xem lại thiết kế' }).click();
  if (vp === 'tablet-1280x800') await shot(page, vp, '06c-review-order');
  await checkLayout(page, `${tag} review`);
  await page.getByRole('button', { name: 'Xác nhận thiết kế' }).click();
  await confirmOrder(page, tag, vp);
  await page.waitForSelector('[data-sheet-status="sent"]', { timeout: 5000 }).catch(() => {});
  const row = mock.rows.filter((r) => r.orderId === 'MQ-0001' && r.rows?.length > 0).at(-1);
  const lines = (row?.rows ?? []).map((r) => `${r.item} × ${r.quantity}`).join(', ');
  record(`spreadsheet: jacket once, the three identical trousers as one line of 3 ${vp}`, lines === 'Áo × 1, Quần × 3', lines);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('[data-export-pdf]')]);
  const stream = await dl.createReadStream();
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  const pdf = Buffer.concat(chunks);
  record(`pdf export of the order ${vp}`, pdf.subarray(0, 5).toString() === '%PDF-' && pdf.length > 50000, `${pdf.length} bytes`);
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
  for (let i = 0; i < 14; i += 1) {
    await press('Tab');
    if (await page.evaluate(() => document.activeElement?.matches('[data-product="blazer"]'))) break;
  }
  await page.keyboard.press('Enter');
  await page.locator('[data-mode="preset"]').focus(); // the mode cards come after the products
  await page.keyboard.press('Space');
  await press('Tab'); // the start button, next in the footer
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
  for (let i = 0; i < 9; i += 1) {
    await page.getByRole('button', { name: 'Tiếp tục' }).focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: 'Xem lại thiết kế' }).last().focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Xác nhận thiết kế' }).focus();
  await press('Enter');
  await page.waitForSelector('#order-orderId');
  // the order screen: the first field has focus; type, tab to the next, and confirm with Enter
  await page.locator('#order-orderId').focus();
  await page.keyboard.type('MQ-0002');
  await press('Tab');
  await page.keyboard.type('Trần Thị Bích');
  await press('Tab');
  await page.keyboard.type('0987654321');
  await press('Enter'); // Enter in the last field submits the form
  await page.waitForSelector('[data-export-pdf]');
  const done = await page.getByRole('heading', { level: 1 }).textContent();
  record(`keyboard ${vp} full journey to confirmation`, done?.includes('Đã xác nhận'), done ?? '');
  record(`keyboard ${vp} focus ring visible while tabbing`, ringProblems.length === 0, ringProblems.join('; '));
}

const mock = await startMockSheet(8787);
const browser = await launch();
for (const [vp, size] of Object.entries(VIEWPORTS)) {
  const { page, context } = await newPage(browser, size);
  const errors = [];
  await page.route('**/config.json', (r) => r.fulfill({ json: { orderSheetUrl: 'http://localhost:8787/', orderSheetToken: '' } }));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const product of ['suit', 'suit3Trousers', 'suit3Waistcoat', 'blazer', 'trousers', 'waistcoat']) await journey(page, vp, product);
  await mixedOrderJourney(page, vp);
  await keyboardPass(page, vp);
  record(`no console errors ${vp}`, errors.length === 0, errors.join(' | '));
  await context.close();
}
await browser.close();
mock.server.close();

writeFileSync(
  fileURLToPath(new URL('../docs/verification-results.json', import.meta.url)),
  JSON.stringify(results, null, 2),
);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

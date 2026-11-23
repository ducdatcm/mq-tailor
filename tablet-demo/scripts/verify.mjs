// Browser verification: runs a full journey for all three products at each target
// viewport, checking layout rules (A13) and a keyboard-only pass (A14), and saves
// screenshots. Needs the dev server (npm run dev) or DEMO_URL pointing at a build.
//
//   node scripts/verify.mjs   -> report + docs/screenshots/* + docs/verification-results.json
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

/** Option ids still to choose on the open screen: for each group shown with nothing chosen, its first available option. */
const openChoices = (page) =>
  page.evaluate(() => {
    const groups = new Map();
    for (const b of document.querySelectorAll('[data-option]')) {
      const g = b.dataset.option.split('.')[0];
      groups.set(g, [...(groups.get(g) ?? []), b]);
    }
    return [...groups.values()]
      .filter((opts) => !opts.some((b) => b.getAttribute('aria-pressed') === 'true'))
      .map((opts) => opts.find((b) => !b.hasAttribute('aria-disabled'))?.dataset.option)
      .filter(Boolean);
  });

/**
 * Completes every piece of the order on screen, as staff would: a piece with nothing chosen copies
 * the first earlier piece of its kind when it can; otherwise every empty group gets its first option.
 */
async function fillAll(page) {
  const units = await page.locator('[data-unit]').evaluateAll((els) => els.map((e) => e.getAttribute('data-unit')));
  for (const unit of units) {
    await page.click(`[data-unit="${unit}"]`);
    const count = (await page.textContent(`[data-unit="${unit}"] .garment-count`)) ?? '';
    const source = page.locator('[data-same-as-source]:not([data-same-as-source="none"])').first();
    if (count.trim().startsWith('0/') && (await source.count())) {
      await source.click();
      continue;
    }
    const steps = page.locator('nav ol button');
    const n = await steps.count();
    for (let i = 0; i < n; i += 1) {
      await steps.nth(i).click();
      for (const id of await openChoices(page)) await page.click(`[data-option="${id}"]`);
    }
  }
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
  // The first piece is chosen by hand (the second option in every group); the rest is completed on screen before the review.
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
  await page.getByRole('button', { name: 'Bắt đầu tư vấn' }).click();
  await checkLayout(page, `${tag} configure`);
  if (product === 'suit') await shot(page, vp, '02-configure-closure');

  // Walk every group of the first garment (manual products choose the second option). The steps are
  // counted again after each choice: a short sleeve takes the shirt's cuff step away.
  const stepCount = () => page.locator('nav ol li').count();
  for (let i = 0; i < (await stepCount()); i += 1) {
    const cards = page.locator('.option');
    await cards.nth(Math.min(1, (await cards.count()) - 1)).click();
    // a choice made on this screen for the group above (e.g. functional / closed cuff buttons)
    const shared = page.locator('[data-companion] .option');
    if (await shared.count()) await shared.nth(1).click();
    if (i < (await stepCount()) - 1) await page.getByRole('button', { name: 'Tiếp tục' }).click();
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
    await page.click('[data-option="sleeve.long"]');
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
    await page.locator('nav ol button').nth(2).click();
    await checkLayout(page, `${tag} configure cuffs`);
    const cuffs = await page.locator('[data-option^="shirtCuffs."]').count();
    const drawn = await page.locator('[data-option^="shirtCuffs."] svg.sk').count();
    // the double cuff is chosen beside the cuffs, and the cuff drawings follow it
    const cuffArt = () => page.locator('[data-option="shirtCuffs.rounded"] svg.sk').innerHTML();
    await page.click('[data-option="doubleCuff.no"]');
    const single = await cuffArt();
    await page.click('[data-option="doubleCuff.yes"]');
    const double = await cuffArt();
    record(`shirt: two cuffs, drawn, following the double-cuff choice ${vp}`, cuffs === 2 && drawn === 2 && single !== double, JSON.stringify({ cuffs, drawn, follows: single !== double }));
    if (vp === 'tablet-1280x800') await shot(page, vp, '03f-configure-cuffs');
    // the pocket flap is asked only when there is a pocket, and the pocket drawings follow it
    await page.locator('nav ol button').nth(4).click();
    await checkLayout(page, `${tag} configure pocket`);
    await page.click('[data-option="chestPocket.none"]');
    const flapsWithout = await page.locator('[data-companion="pocketFlap"]').count();
    await page.click('[data-option="chestPocket.rounded"]');
    const flapsWith = await page.locator('[data-companion="pocketFlap"]').count();
    const pocketArt = () => page.locator('[data-option="chestPocket.square"] svg.sk').innerHTML();
    await page.click('[data-option="pocketFlap.plain"]');
    const plain = await pocketArt();
    await page.click('[data-option="pocketFlap.flapButton"]');
    const buttoned = await pocketArt();
    record(`shirt: pocket flap only with a pocket, drawings follow it ${vp}`, flapsWithout === 0 && flapsWith === 1 && plain !== buttoned, JSON.stringify({ flapsWithout, flapsWith }));
    if (vp === 'tablet-1280x800') await shot(page, vp, '03g-configure-pocket');
    await page.locator('nav ol button').nth(5).click();
    await checkLayout(page, `${tag} configure hem`);
    record(`shirt: two hems, drawn ${vp}`, (await page.locator('[data-option^="shirtHem."] svg.sk').count()) === 2, '');
    // an order of shirts alone has no trims step
    record(`shirt: no trims step ${vp}`, (await page.locator('[data-unit="trims"]').count()) === 0, '');
  }
  if (product !== 'shirt') {
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
  await fillAll(page);
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

  await fillAll(page);
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

/**
 * Real photos of the choices: the website (here a stand-in answering the same two addresses) links two
 * photos to "one-row, two buttons"; the card is marked and the enlarged view shows them beside the drawing.
 */
async function photosCheck(page, vp) {
  const square = readFileSync(fileURLToPath(new URL('../public/icons/icon-512.png', import.meta.url)));
  // photo 2 is an upright phone photo whose size the website recorded sideways (1200 × 900):
  // the file itself is portrait, and the app must show it portrait, in the enlarged view and full screen
  const portrait = await page.evaluate(async () => {
    const c = Object.assign(document.createElement('canvas'), { width: 600, height: 900 });
    const g = c.getContext('2d');
    g.fillStyle = '#7a2e26';
    g.fillRect(0, 0, 600, 900);
    g.fillStyle = '#fff';
    g.fillRect(100, 100, 400, 700);
    return c.toDataURL('image/png').split(',')[1];
  });
  const photo = (id, w, h) => ({ id, src: `api/photo/${id}/1200.webp`, width: w, height: h, full: { src: `api/photo/${id}/1920.webp`, width: w * 1.6, height: h * 1.6 }, altVi: `Ảnh mẫu ${id}`, altEn: `Sample ${id}`, focalX: 50, focalY: 50 });
  await page.route('**/api/option-photos', (route) => route.fulfill({ json: { photos: { 'closure.sb2': [photo(1, 1200, 900), photo(2, 1200, 900)] } } }));
  await page.route('**/api/photo/**', (route) =>
    route.fulfill({ body: /\/photo\/2\//.test(route.request().url()) ? Buffer.from(portrait, 'base64') : square, contentType: 'image/png' }),
  );
  await freshStart(page);
  await page.click('[data-product="blazer"]');
  await page.getByRole('button', { name: 'Bắt đầu tư vấn' }).click();
  await page.waitForSelector('[data-has-photos]', { timeout: 5000 }).catch(() => {});
  const marked = await page.locator('[data-has-photos]').count();
  await page.getByRole('button', { name: /Phóng to hình: Một hàng 2 khuy/ }).click();
  await page.waitForSelector('[data-photo-viewer] img');
  const shown = await page.evaluate(() => {
    const img = document.querySelector('[data-photo-viewer] img');
    return img && img.complete && img.naturalWidth > 0;
  });
  await checkLayout(page, `${vp} photos zoom`);
  if (vp === 'tablet-1280x800') await shot(page, vp, '04b-real-photos');
  const cropped = await page.evaluate(() => getComputedStyle(document.querySelector('[data-photo-viewer] img')).objectFit);
  await page.getByRole('button', { name: 'Ảnh sau' }).click();
  const second = await page.locator('[data-photo-viewer] img').getAttribute('alt');
  await page.waitForFunction(() => { const i = document.querySelector('[data-photo-viewer] img'); return i && i.complete && i.naturalWidth > 0; });
  await page.waitForTimeout(100);
  const shape = await page.evaluate(() => {
    const r = document.querySelector('.photo-frame').getBoundingClientRect();
    return Math.round((r.width / r.height) * 100) / 100;
  });
  record(`real photos: the card is marked, the enlarged view shows them whole and in their real shape ${vp}`, marked === 1 && shown && second === 'Ảnh mẫu 2' && cropped === 'contain' && shape < 0.9, JSON.stringify({ marked, shown, second, cropped, shape }));

  // full screen: tap the photo, zoom with a double tap, close with Escape (back to the enlarged view)
  await page.click('.photo-open');
  // the sharper 1920 px copy replaces the placeholder once it has loaded
  await page.waitForSelector('.pswp--open img.pswp__img[src$="1920.webp"]', { timeout: 8000 }).catch(() => {});
  const full = await page.evaluate(() => ({
    open: !!document.querySelector('.pswp--open'),
    src: [...document.querySelectorAll('.pswp--open img.pswp__img')].map((i) => i.getAttribute('src')).find((x) => x.endsWith('1920.webp')) ?? '',
    zoomButton: !!document.querySelector('.pswp__button--zoom'),
    counter: document.querySelector('.pswp__counter')?.textContent?.trim() ?? '',
    // the photo on screen keeps the file's portrait shape (not stretched to the recorded landscape size)
    portrait: (() => {
      const img = [...document.querySelectorAll('.pswp--open img.pswp__img')].find((i) => i.getAttribute('src')?.endsWith('2/1920.webp'));
      const r = img?.getBoundingClientRect();
      return !!r && r.height > r.width * 1.2;
    })(),
  }));
  if (vp === 'tablet-1280x800') await shot(page, vp, '04c-photo-full-screen');
  // zoom with the button (a mouse here; on the tablet a pinch or a double tap does the same)
  await page.click('.pswp__button--zoom');
  await page.waitForTimeout(500);
  const zoomed = await page.evaluate(() => document.querySelector('.pswp')?.classList.contains('pswp--zoomed-in') ?? false);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.pswp', { state: 'detached', timeout: 5000 }).catch(() => {});
  const back = await page.evaluate(() => !document.querySelector('.pswp') && !!document.querySelector('[data-photo-viewer]'));
  record(`real photos: full screen with zoom, Escape returns to the enlarged view ${vp}`, full.open && /1920\.webp$/.test(full.src) && full.portrait && full.zoomButton && zoomed && back, JSON.stringify({ ...full, zoomed, back }));
  await page.keyboard.press('Escape');
  await page.unroute('**/api/option-photos');
  await page.unroute('**/api/photo/**');
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
  await page.getByRole('button', { name: 'Bắt đầu tư vấn' }).focus(); // the start button, in the footer
  await page.keyboard.press('Enter');
  const heading = await page.getByRole('heading', { level: 1 }).textContent();
  record(`keyboard ${vp} start -> configure`, heading?.includes('Kiểu cài áo'), heading ?? '');

  // Modal: focus is trapped, Escape closes it, focus returns to the opener.
  await page.getByRole('button', { name: /Phóng to hình/ }).first().focus();
  await page.keyboard.press('Enter');
  let trapped = true;
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('Tab');
    trapped = trapped && (await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')));
  }
  await page.keyboard.press('Escape');
  const returned = await page.evaluate(() => !!document.activeElement?.matches('.zoom-btn'));
  record(`keyboard ${vp} modal traps focus, Escape closes, focus returns`, trapped && returned, JSON.stringify({ trapped, returned }));

  // Choose in every group with the keyboard (Space on an option, Enter on Next), review, confirm.
  for (let i = 0; i < 30; i += 1) {
    for (const id of await openChoices(page)) {
      await page.locator(`[data-option="${id}"]`).focus();
      await page.keyboard.press('Space');
    }
    const next = page.getByRole('button', { name: 'Tiếp tục' });
    if (!(await next.count())) break;
    await next.focus();
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
  // stands in for the website: the dev server has no photo list (the photos check links some)
  await context.route('**/api/option-photos', (route) => route.fulfill({ json: { photos: {} } }));
  const errors = [];
  await page.route('**/config.json', (r) => r.fulfill({ json: { orderSheetUrl: 'http://localhost:8787/', orderSheetToken: '' } }));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const product of ['suit', 'suit3Trousers', 'suit3Waistcoat', 'blazer', 'trousers', 'waistcoat', 'shirt']) await journey(page, vp, product);
  await mixedOrderJourney(page, vp);
  await photosCheck(page, vp);
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

// Turns the shirt drawings (src/sketches/assets/shirt) into the app's sketch style: warm beige ground,
// white cloth, charcoal line. Run again after replacing a drawing:
//
//   node scripts/shirt-art.mjs   -> src/sketches/assets/shirtArt.ts
//
// Three kinds of source:
//   collar-*.svg  stock line art (black fills, a few white button faces; open shapes). The lines are kept; the
//                 cloth is found by flooding the ground in from the top edge (the shoulder lines run to the
//                 sides, so everything below them is the shirt), then traced to one white shape behind.
//   cuff-*.svg    stock drawing in greys. The sheet's white is left out (the frame's ground shows); every
//                 other fill is mapped by lightness to the app's colours: the cuff to white cloth, the
//                 sleeve to the shade, shading to the tie colour, the darkest to the line.
//   hem-*.svg     stock line art of a whole shirt front (closed outline): the cloth is flooded in from every
//                 edge, then the view is cut to the lower body (HEM_CROP), where the two hems differ.
//   sleeve-*.jpg  bold outline drawings: traced like the jacket drawings (scripts/vectorize.mjs).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import potrace from 'potrace';
import { launch } from './browser.mjs';

const DIR = fileURLToPath(new URL('../src/sketches/assets/', import.meta.url));
const SRC = DIR + 'shirt/';

const round = (d) => d.replace(/-?\d*\.\d+/g, (n) => String(Math.round(parseFloat(n) * 10) / 10)).replace(/\s+/g, ' ').trim();

const trace = (png, params) =>
  new Promise((resolve, reject) =>
    potrace.trace(png, params, (err, svg) => {
      if (err) return reject(err);
      resolve(round([...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join(' ')));
    }),
  );
const INK = { turdSize: 4, alphaMax: 1, optCurve: true, optTolerance: 0.9, threshold: 128 };
const PAPER = { ...INK, turdSize: 300, optTolerance: 6, alphaMax: 1.2 };

/** The class for a cuff fill, by lightness. */
function cuffClass(fill) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(fill.slice(i, i + 2), 16));
  const l = (r + g + b) / 3;
  if (l >= 254) return 'art-ground';
  if (l >= 236) return 'art-paper';
  if (l >= 215) return 'art-shade';
  if (l >= 190) return 'art-tie';
  if (l >= 90) return 'art-mark';
  return 'art-ink';
}

/** The class for a line-art fill: white is cloth, a light grey (the back seen under a curved hem) the shade. */
function lineClass(fill) {
  const c = cuffClass(fill);
  return c === 'art-ground' ? 'art-paper' : c === 'art-paper' ? 'art-shade' : c;
}

/** The part of the hem drawings shown: shares of the drawing's box (x0, y0, x1, y1). */
const HEM_CROP = [0.15, 0.55, 0.85, 1];

const browser = await launch();
const page = await browser.newPage();
await page.setContent('<body style="margin:0"><canvas id="c"></canvas><div id="host"></div></body>');

/**
 * Draws an image on a canvas `cw` wide and returns, as PNG data URLs, the dark lines and the cloth: every
 * light pixel the ground cannot reach from the seed edges (dark pixels are walls).
 *   drop  boxes [x0, y0, x1, y1] (canvas pixels): a line drawn wholly inside one is left out
 *   thin  pixels taken off each side of every line, to bring a bold drawing to the app's line weight
 *   seal  pixels added round every line for the flood only, so a small gap where two lines nearly meet
 *         does not let the ground into the cloth
 */
const masks = (args) =>
  page.evaluate(async ({ url, cw, dark, seeds, walls, drop = [], thin = 0, seal = 0 }) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w = cw;
    const h = Math.round((cw * img.height) / img.width);
    const c = document.getElementById('c');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, w, h);
    const px = g.getImageData(0, 0, w, h).data;
    const L = new Float32Array(w * h);
    for (let i = 0; i < w * h; i += 1) L[i] = (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3;
    let solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i += 1) solid[i] = L[i] < dark ? 1 : 0;
    for (let k = 0; k < seal; k += 1) {
      const next = solid.slice();
      for (let i = 0; i < w * h; i += 1) {
        if (solid[i]) continue;
        const x = i % w;
        if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (i >= w && solid[i - w]) || (i < w * (h - 1) && solid[i + w])) next[i] = 1;
      }
      solid = next;
    }
    const outside = new Uint8Array(w * h);
    const wall = (x, y) => solid[y * w + x] === 1 || (walls && y > 0 && (x < 2 || x >= w - 2));
    const stack = [];
    const seed = (x, y) => {
      if (!wall(x, y) && !outside[y * w + x]) {
        outside[y * w + x] = 1;
        stack.push(y * w + x);
      }
    };
    for (let x = 0; x < w; x += 1) {
      seed(x, 0);
      if (seeds === 'all') seed(x, h - 1);
    }
    if (seeds === 'all') for (let y = 0; y < h; y += 1) (seed(0, y), seed(w - 1, y));
    while (stack.length) {
      const i = stack.pop();
      const x = i % w;
      const y = (i - x) / w;
      if (x > 0) seed(x - 1, y);
      if (x < w - 1) seed(x + 1, y);
      if (y > 0) seed(x, y - 1);
      if (y < h - 1) seed(x, y + 1);
    }
    const toPng = (on) => {
      const m = g.createImageData(w, h);
      for (let i = 0; i < w * h; i += 1) {
        const v = on(i) ? 0 : 255;
        m.data[i * 4] = m.data[i * 4 + 1] = m.data[i * 4 + 2] = v;
        m.data[i * 4 + 3] = 255;
      }
      g.putImageData(m, 0, 0);
      return c.toDataURL('image/png');
    };
    let ink = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i += 1) ink[i] = L[i] < 128 ? 1 : 0;
    if (drop.length) {
      const seen = new Uint8Array(w * h);
      for (let s0 = 0; s0 < w * h; s0 += 1) {
        if (!ink[s0] || seen[s0]) continue;
        const part = [s0];
        seen[s0] = 1;
        let [x0, y0, x1, y1] = [w, h, 0, 0];
        for (let k = 0; k < part.length; k += 1) {
          const i = part[k];
          const x = i % w;
          const y = (i - x) / w;
          [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
          for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
            if (j >= 0 && ink[j] && !seen[j]) {
              seen[j] = 1;
              part.push(j);
            }
          }
        }
        if (drop.some(([a, b, c2, d]) => x0 >= a && y0 >= b && x1 <= c2 && y1 <= d)) for (const i of part) ink[i] = 0;
      }
    }
    for (let k = 0; k < thin; k += 1) {
      const next = ink.slice();
      for (let i = 0; i < w * h; i += 1) {
        if (!ink[i]) continue;
        const x = i % w;
        if ((x > 0 && !ink[i - 1]) || (x < w - 1 && !ink[i + 1]) || (i >= w && !ink[i - w]) || (i < w * (h - 1) && !ink[i + w])) next[i] = 0;
      }
      ink = next;
    }
    return { w, h, ink: toPng((i) => ink[i] === 1), paper: toPng((i) => !outside[i]) };
  }, args);

const png = (u) => Buffer.from(u.split(',')[1], 'base64');
const out = {};

for (const file of readdirSync(SRC).sort()) {
  const name = file.replace(/\.\w+$/, '');
  if (file.startsWith('sleeve-')) {
    const url = `data:image/jpeg;base64,${readFileSync(SRC + file).toString('base64')}`;
    // The supplied lines are about 15 px at this size: thinned to the weight of the other drawings. The
    // short-sleeved shirt's chest pocket is left out, so the two shirts differ only in the sleeve.
    const drop = file === 'sleeve-short.jpg' ? [[790, 410, 1000, 660]] : [];
    const m = await masks({ url, cw: 1400, dark: 160, seeds: 'all', walls: false, drop, thin: 4 });
    out[name] = { vb: [0, 0, m.w, m.h], layers: [['photo-paper', await trace(png(m.paper), PAPER)], ['photo-ink', await trace(png(m.ink), INK)]] };
  } else if (file.endsWith('.svg')) {
    const svg = readFileSync(SRC + file, 'utf8');
    if (/transform=/.test(svg)) throw new Error(`${file}: transforms are not handled`);
    const paths = [...svg.matchAll(/<path\b([^>]*?)\/?>/g)].map((m) => ({
      fill: (/fill="(#[0-9a-fA-F]{6})/.exec(m[1]) ?? [, '#000000'])[1].toLowerCase(),
      d: round(/\sd="([^"]+)"/.exec(m[1])[1]),
    }));
    if (file.startsWith('cuff-')) {
      const vb = /viewBox="([^"]+)"/.exec(svg)[1].split(/[\s,]+/).map(Number);
      // The first shape is the white sheet behind every drawing: left out, so the frame's own ground shows.
      // Any later white is a highlight on the cloth.
      if (cuffClass(paths[0].fill) !== 'art-ground') throw new Error(`${file}: expected the sheet first`);
      out[name] = { vb, layers: paths.slice(1).map((p) => [cuffClass(p.fill).replace('art-ground', 'art-paper'), p.d]) };
    } else {
      // Collars: a tight box, so the shoulder lines reach the sides and wall the ground off from the shirt.
      const { box, boxes } = await page.evaluate((markup) => {
        document.getElementById('host').innerHTML = markup;
        const b = document.querySelector('#host svg').getBBox();
        const boxes = [...document.querySelectorAll('#host path')].map((p) => {
          const r = p.getBBox();
          return [r.x, r.y, r.x + r.width, r.y + r.height];
        });
        return { box: [b.x, b.y, b.width, b.height], boxes };
      }, svg);
      const vb = box.map((v) => Math.round(v * 10) / 10);
      const hem = file.startsWith('hem-');
      const tight = svg.replace(/viewBox="[^"]+"/, `viewBox="${vb.join(' ')}"`).replace(/\swidth="[^"]+"/, ' width="1600"').replace(/\sheight="[^"]+"/, ` height="${Math.round((1600 * vb[3]) / vb[2])}"`);
      const url = `data:image/svg+xml;base64,${Buffer.from(tight).toString('base64')}`;
      const m = await masks({ url, cw: 1600, dark: 215, seeds: hem ? 'all' : 'top', walls: !hem, seal: 3 });
      const k = vb[2] / m.w;
      // the hems show only the lower body: the view is cut, and shapes wholly outside it are left out
      const view = hem
        ? [vb[0] + HEM_CROP[0] * vb[2], vb[1] + HEM_CROP[1] * vb[3], (HEM_CROP[2] - HEM_CROP[0]) * vb[2], (HEM_CROP[3] - HEM_CROP[1]) * vb[3]].map((v) => Math.round(v * 10) / 10)
        : vb;
      const inView = (b) => b[2] >= view[0] && b[0] <= view[0] + view[2] && b[3] >= view[1] && b[1] <= view[1] + view[3];
      out[name] = {
        vb: view,
        layers: [
          ['photo-paper', await trace(png(m.paper), PAPER), `translate(${vb[0]} ${vb[1]}) scale(${Math.round(k * 1e5) / 1e5})`],
          // (whole units: a unit of these large drawings is a sixth of a pixel on screen)
          ...paths.filter((p, i) => inView(boxes[i])).map((p) => [lineClass(p.fill), hem ? p.d.replace(/-?\d*\.\d+/g, (n) => String(Math.round(parseFloat(n)))) : p.d]),
        ],
      };
    }
  }
  const kb = out[name].layers.reduce((s, l) => s + l[1].length, 0) / 1024;
  console.log(name, `${out[name].layers.length} layers, ${kb.toFixed(0)} KB`);
}
await browser.close();

const lines = Object.entries(out).map(([n, v]) => `  '${n}': ${JSON.stringify(v)},`);
writeFileSync(
  DIR + 'shirtArt.ts',
  `// Generated by scripts/shirt-art.mjs from assets/shirt/* — do not edit by hand.\n\nexport interface ShirtArt {\n  /** The drawing's own view box: x, y, width, height. */\n  vb: readonly number[];\n  /** Shapes back to front: [class, path, transform?]. */\n  layers: readonly (readonly string[])[];\n}\n\nexport const SHIRT_ART: Record<string, ShirtArt> = {\n${lines.join('\n')}\n};\n`,
);

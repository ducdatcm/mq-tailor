import { PRODUCTS, groupsFor, type OptionId } from '../catalog/catalog';
import type { Copy } from '../content/copy';
import { fmt } from '../content/copy';
import { formatDateTime } from '../order/format';
import type { OrderRecord, Snapshot } from '../state/types';

/**
 * Draws the design sheet straight onto a canvas (no HTML-to-image step, which is slow and fragile
 * on tablet WebViews). Sizes are CSS pixels of an A4 page at 96 dpi; the canvas is scaled up.
 * A sheet that needs more than one A4 page at this size (a three-piece suit) is laid out on a
 * proportionally larger page and shrunk to fit, so the PDF is always a single A4 page.
 */
export const SHEET_WIDTH = 794;
const A4_HEIGHT = 1123;
const MARGIN = 48;
const INK = '#2b2620';
const MUTED = '#655d51';
const LINE = '#d9d0bf';
const PAPER_TINT = '#f5f1ea';
const THUMB_BG = '#edeae2';
const SERIF = "Lora, Georgia, 'Times New Roman', serif";
const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const THUMB_W = 108;
const THUMB_H = 81;

/** Fonts the sheet uses, so the canvas does not fall back while a font file is still loading. */
export const SHEET_FONTS = [`500 24px ${SERIF}`, `500 26px ${SERIF}`, `400 12px ${SANS}`, `600 15px ${SANS}`];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Splits text into lines no wider than maxWidth; long words are broken as a last resort. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 2): string[] {
  const lines: string[] = [];
  let line = '';
  const push = () => {
    lines.push(line);
    line = '';
  };
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) push();
    let rest = word;
    while (ctx.measureText(rest).width > maxWidth && rest.length > 1) {
      let n = rest.length - 1;
      while (n > 1 && ctx.measureText(rest.slice(0, n)).width > maxWidth) n -= 1;
      line = rest.slice(0, n);
      push();
      rest = rest.slice(n);
    }
    line = rest;
  }
  if (line) push();
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

const upper = (s: string, lang: string) => s.toLocaleUpperCase(lang === 'vi' ? 'vi' : 'en');

export interface SheetInput {
  t: Copy;
  lang: string;
  snap: Snapshot;
  order: OrderRecord;
  /** The sketch of each chosen option, already rasterised. */
  sketches: Map<OptionId, CanvasImageSource>;
  /** The brand logo and its width / height, drawn in the header. */
  logo: { image: CanvasImageSource; ratio: number };
  scale: number;
}

/** Returns the canvas holding the finished page (always A4 proportions). */
export function drawSheet({ t, lang, snap, order, sketches, logo, scale }: SheetInput): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // Measure on a throwaway context first: the page height depends on how the text wraps.
  const probe = document.createElement('canvas').getContext('2d')!;
  const build = (ctx: CanvasRenderingContext2D, draw: boolean, pageW: number): number => {
    const fill = (c: string) => {
      if (draw) ctx.fillStyle = c;
    };
    const text = (s: string, x: number, y: number, align: CanvasTextAlign = 'left') => {
      if (!draw) return;
      ctx.textAlign = align;
      ctx.fillText(s, x, y);
    };
    ctx.textBaseline = 'alphabetic';

    // ── header
    const logoH = 40;
    if (draw) ctx.drawImage(logo.image, MARGIN, 56, logoH * logo.ratio, logoH);
    ctx.font = `500 26px ${SERIF}`;
    fill(INK);
    text(t.pdf.title, pageW - MARGIN, 88, 'right');
    if (draw) {
      ctx.fillStyle = INK;
      ctx.fillRect(MARGIN, 108, pageW - MARGIN * 2, 2);
    }

    // ── order details box: 3 columns x 2 rows
    const boxX = MARGIN;
    const boxY = 128;
    const boxW = pageW - MARGIN * 2;
    const cellW = (boxW - 32) / 3;
    const cells: [string, string][] = [
      [t.pdf.date, formatDateTime(order.confirmedAt)],
      [t.pdf.orderId, order.orderId],
      [t.pdf.customer, order.customerName],
      [t.pdf.phone, order.phone],
      [t.pdf.product, t.products[snap.product].name],
      [t.pdf.revision, fmt(t.confirmed.revision, { n: snap.revision })],
    ];
    ctx.font = `600 15px ${SANS}`;
    const rowLines = [0, 1].map((r) =>
      Math.max(...cells.slice(r * 3, r * 3 + 3).map(([, v]) => wrap(ctx, v, cellW - 12, 2).length)),
    );
    const rowH = rowLines.map((n) => 16 + n * 19 + 10);
    const boxH = 16 + rowH[0] + rowH[1] + 4;
    if (draw) {
      fill(PAPER_TINT);
      roundRect(ctx, boxX, boxY, boxW, boxH, 8);
      ctx.fill();
    }
    let rowY = boxY + 16;
    [0, 1].forEach((r) => {
      cells.slice(r * 3, r * 3 + 3).forEach(([label, value], c) => {
        const x = boxX + 16 + c * cellW;
        ctx.font = `400 10px ${SANS}`;
        fill(MUTED);
        text(upper(label, lang), x, rowY + 10);
        ctx.font = `600 15px ${SANS}`;
        fill(INK);
        wrap(ctx, value, cellW - 12, 2).forEach((l, i) => text(l, x, rowY + 29 + i * 19));
      });
      rowY += rowH[r];
    });

    // ── garments
    let y = boxY + boxH + 30;
    const colW = (boxW - 20) / 2;
    PRODUCTS[snap.product].garments.forEach((garment) => {
      ctx.font = `500 17px ${SERIF}`;
      fill(INK);
      text(t.garments[snap.product][garment], MARGIN, y);
      if (draw) {
        ctx.fillStyle = LINE;
        ctx.fillRect(MARGIN, y + 8, boxW, 1);
      }
      y += 22;
      const groups = groupsFor(garment);
      // a row of options that have no drawing (the trims) is shorter
      const rowHeights: number[] = [];
      for (let r = 0; r * 2 < groups.length; r += 1) {
        rowHeights.push(groups.slice(r * 2, r * 2 + 2).some((g) => !g.noSketch) ? 90 : 56);
      }
      groups.forEach((g, i) => {
        const col = i % 2;
        const x = MARGIN + col * (colW + 20);
        const row = Math.floor(i / 2);
        const top = y + rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
        const chosen = snap.selections[garment][g.id];
        if (draw && !g.noSketch) {
          ctx.fillStyle = THUMB_BG;
          roundRect(ctx, x, top, THUMB_W, THUMB_H, 6);
          ctx.fill();
          const img = chosen ? sketches.get(chosen) : undefined;
          if (img) {
            ctx.save();
            roundRect(ctx, x, top, THUMB_W, THUMB_H, 6);
            ctx.clip();
            ctx.drawImage(img, x, top, THUMB_W, THUMB_H);
            ctx.restore();
          }
        }
        const tx = g.noSketch ? x : x + THUMB_W + 12;
        const tw = g.noSketch ? colW - 8 : colW - THUMB_W - 16;
        ctx.font = `400 10.5px ${SANS}`;
        fill(MUTED);
        text(upper(t.groups[g.id].name, lang), tx, top + 16);
        ctx.font = `600 14px ${SANS}`;
        fill(INK);
        const valueLines = wrap(ctx, chosen ? t.options[chosen].label : t.review.notChosen, tw, 2);
        valueLines.forEach((l, k) => text(l, tx, top + 35 + k * 18));
        if (chosen && t.options[chosen].term) {
          ctx.font = `400 11px ${SANS}`;
          fill(MUTED);
          wrap(ctx, t.options[chosen].term!, tw, 1).forEach((l) => text(l, tx, top + 35 + valueLines.length * 18 + 2));
        }
      });
      y += rowHeights.reduce((a, b) => a + b, 0) + 26;
    });

    // ── footer note
    ctx.font = `400 10.5px ${SANS}`;
    const note = wrap(ctx, t.pdf.footer, boxW, 3);
    y += 4;
    if (draw) {
      ctx.fillStyle = LINE;
      ctx.fillRect(MARGIN, y, boxW, 1);
      fill(MUTED);
    }
    note.forEach((l, i) => text(l, MARGIN, y + 20 + i * 15));
    return y + 20 + note.length * 15 + 36;
  };

  let pageW = SHEET_WIDTH;
  const needed = Math.ceil(build(probe, false, pageW));
  if (needed > A4_HEIGHT) pageW = Math.ceil((SHEET_WIDTH * needed) / A4_HEIGHT);
  const pageH = Math.round((pageW * A4_HEIGHT) / SHEET_WIDTH);
  const k = (scale * SHEET_WIDTH) / pageW; // canvas pixels per layout pixel
  canvas.width = Math.round(SHEET_WIDTH * scale);
  canvas.height = Math.round(A4_HEIGHT * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height); // whole canvas, so rounding never leaves a transparent (black in JPEG) edge
  ctx.scale(k, k);
  ctx.fillRect(0, 0, pageW, pageH);
  build(ctx, true, pageW);
  return canvas;
}

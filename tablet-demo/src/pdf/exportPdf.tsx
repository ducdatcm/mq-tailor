import { createRoot } from 'react-dom/client';
import { groupsFor, type OptionId } from '../catalog/catalog';
import type { Copy } from '../content/copy';
import { LOGO } from '../brand/logo';
import { safeFileName } from '../order/format';
import { Sketch } from '../sketches/Sketch';
import type { OrderRecord, Snapshot } from '../state/types';
import { SHEET_FONTS, drawSheet } from './drawSheet';
import { buildImagePdf } from './pdfWriter';

const SCALE = 2; // 794 px wide page -> 1588 px: about 190 dpi on A4, sharp when printed
const THUMB = { w: 108, h: 81 };

const SVG_STYLE_PROPS = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'opacity',
  'display',
] as const;

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * The sketches are styled by the page's stylesheet, so each is rendered in the page and then written
 * out as a self-contained SVG image (final colours and line widths on every shape).
 */
async function rasteriseSketches(options: OptionId[]): Promise<Map<OptionId, CanvasImageSource>> {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${THUMB.w}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(
      <>
        {options.map((o) => (
          <div key={o} data-option-id={o} style={{ width: THUMB.w }}>
            <Sketch option={o} />
          </div>
        ))}
      </>,
    );
    await nextFrame();
    const out = new Map<OptionId, CanvasImageSource>();
    await Promise.all(
      options.map(async (o) => {
        const svg = host.querySelector<SVGSVGElement>(`[data-option-id="${o}"] svg`);
        if (!svg) return;
        const clone = svg.cloneNode(true) as SVGSVGElement;
        const from = [svg, ...Array.from(svg.querySelectorAll('*'))];
        const to = [clone, ...Array.from(clone.querySelectorAll('*'))];
        from.forEach((el, i) => {
          const cs = getComputedStyle(el);
          SVG_STYLE_PROPS.forEach((p) => (to[i] as SVGElement).style.setProperty(p, cs.getPropertyValue(p)));
        });
        const box = svg.getBoundingClientRect();
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        // draw at twice the thumbnail size so it stays crisp on the canvas
        clone.setAttribute('width', String(Math.round(THUMB.w * SCALE)));
        clone.setAttribute('height', String(Math.round((box.height || THUMB.h) * SCALE)));
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
        await img.decode();
        out.set(o, img);
      }),
    );
    return out;
  } finally {
    root.unmount();
    host.remove();
  }
}

/** The logo as an image the canvas can draw (a small SVG built from the traced outline). */
async function loadLogo(): Promise<{ image: CanvasImageSource; ratio: number }> {
  const w = 600;
  const h = Math.round((w * LOGO.h) / LOGO.w);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${LOGO.w} ${LOGO.h}"><path d="${LOGO.d}" fill="${LOGO.color}" fill-rule="evenodd"/></svg>`;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  return { image, ratio: LOGO.w / LOGO.h };
}

const canvasToJpeg = (canvas: HTMLCanvasElement): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? blob.arrayBuffer().then((b) => resolve(new Uint8Array(b)), reject) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.92,
    );
  });

/** Draws the design sheet and returns it as a one-page PDF. */
export async function createDesignPdf(t: Copy, snap: Snapshot, order: OrderRecord, lang = 'vi'): Promise<Blob> {
  const chosen: OptionId[] = [];
  snap.units.forEach((unit) =>
    groupsFor(unit.garment, snap.selections[unit.id]).forEach((g) => {
      const o = snap.selections[unit.id]?.[g.id];
      if (o && !chosen.includes(o)) chosen.push(o);
    }),
  );

  await Promise.all([
    ...SHEET_FONTS.map((f) => document.fonts?.load(f, 'Aàáảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ')),
  ]).catch(() => undefined);
  const [sketches, logo] = await Promise.all([rasteriseSketches(chosen), loadLogo()]);
  const canvas = drawSheet({ t, lang, snap, order, sketches, logo, scale: SCALE });
  const jpeg = await canvasToJpeg(canvas);
  const pdf = buildImagePdf({
    jpeg,
    width: canvas.width,
    height: canvas.height,
    title: `${t.pdf.title} ${order.orderId}`,
  });
  return new Blob([pdf as BlobPart], { type: 'application/pdf' });
}

export function pdfFileName(order: OrderRecord): string {
  const d = new Date(order.confirmedAt);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `phieu-thiet-ke_${safeFileName(order.orderId)}_${ymd}.pdf`;
}

/** Hands the file to the browser as a download. */
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

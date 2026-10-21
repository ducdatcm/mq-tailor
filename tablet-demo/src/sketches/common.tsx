import type { ReactNode } from 'react';

/**
 * Shared drawing helpers. Every sketch is drawn in a 400×300 viewBox, with
 * the same line weights (see .sk rules in styles/app.css):
 *   .ink    – the detail being compared (heavy line)
 *   .ctx    – constant context drawn identically in every option (light line)
 *   .cloth / .cloth2 / .paper / .lining – flat fills
 */
export const VIEW_W = 400;
export const VIEW_H = 300;

/** Draw children as drawn, plus a copy mirrored about the vertical centre line x = 200. */
export function Mirror({ children }: { children: ReactNode }) {
  return (
    <>
      <g>{children}</g>
      <g transform="translate(400 0) scale(-1 1)">{children}</g>
    </>
  );
}

/** A coat button: rim plus two thread holes. */
export function Button({ cx, cy, r = 6 }: { cx: number; cy: number; r?: number }) {
  const h = r * 0.32;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="btn" />
      <circle cx={cx - h} cy={cy} r={r * 0.12} className="dot" />
      <circle cx={cx + h} cy={cy} r={r * 0.12} className="dot" />
    </g>
  );
}

/** Flat horizontal buttonhole mark. */
export function Buttonhole({ x, y, w = 14 }: { x: number; y: number; w?: number }) {
  return <path d={`M${x} ${y} h${w}`} className="ctx hole" />;
}

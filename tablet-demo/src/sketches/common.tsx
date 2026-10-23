import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react';

/**
 * Drawing toolkit for the line-art sketches. Every sketch is drawn in a 400×300
 * viewBox with one even charcoal line on white garments (see styles/sketch.css):
 *   .ink   silhouette / the detail being compared
 *   .line  interior seams
 *   .fine  small details
 *   .dots  pick-stitching
 * Garments are shown on a mannequin, with round close-up "callouts" for details.
 */
export const VIEW_W = 400;
export const VIEW_H = 300;

/** Multiplier that undoes an enclosing scale so line weights stay constant. */
const WeightContext = createContext(1);

/** Draw children inside `transform`, keeping line weights as if unscaled. */
export function Scale({ k, transform, children }: { k: number; transform: string; children: ReactNode }) {
  const outer = useContext(WeightContext);
  const weight = outer * k;
  return (
    <WeightContext.Provider value={weight}>
      <g transform={transform} style={{ ['--lw' as string]: weight } as CSSProperties}>
        {children}
      </g>
    </WeightContext.Provider>
  );
}

/** Draw children as drawn, plus a copy mirrored about the vertical centre line x = 200. */
export function Mirror({ children }: { children: ReactNode }) {
  return (
    <>
      <g>{children}</g>
      <g transform="translate(400 0) scale(-1 1)">{children}</g>
    </>
  );
}

/** A coat button: white disc, outline, two thread holes. */
export function Button({ cx, cy, r = 5 }: { cx: number; cy: number; r?: number }) {
  const h = r * 0.34;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="btn" />
      <circle cx={cx - h} cy={cy} r={r * 0.15} className="btn-hole" />
      <circle cx={cx + h} cy={cy} r={r * 0.15} className="btn-hole" />
    </g>
  );
}

/**
 * A round close-up. Children are drawn at their own scale, enlarged by `zoom`
 * around the point `focus` and clipped to the circle (line weights stay constant).
 */
export function Callout({
  cx,
  cy,
  r,
  zoom = 1,
  focus,
  children,
}: {
  cx: number;
  cy: number;
  r: number;
  zoom?: number;
  focus: [number, number];
  children: ReactNode;
}) {
  const id = `clip${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <g>
      <clipPath id={id}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <circle cx={cx} cy={cy} r={r} className="ground" />
      <g clipPath={`url(#${id})`}>
        <Scale k={1 / zoom} transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-focus[0]} ${-focus[1]})`}>
          {children}
        </Scale>
      </g>
      <circle cx={cx} cy={cy} r={r} className="ring" />
    </g>
  );
}

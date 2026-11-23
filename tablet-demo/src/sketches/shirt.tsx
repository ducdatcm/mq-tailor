import { useId, type ReactNode } from 'react';
import type { GarmentSelections } from '../catalog/catalog';
import { SHIRT_ART } from './assets/shirtArt';
import { Button, Scale } from './common';

/* ────────────────────────────────────────────────────────────────────────────
 * Shirt drawings.
 *  - Sleeve, collar, cuffs and hem: the house's stock line art (src/sketches/assets/shirt), turned into the
 *    app's sketch style by scripts/shirt-art.mjs: warm beige ground, white cloth, charcoal line, the
 *    sleeve in the shade colours (styles/sketch.css, .art-*).
 *  - Chest pockets: drawn here in the jacket and trouser line (one even charcoal line on white cloth,
 *    fine dashed top-stitching).
 * Cuffs and pockets follow the choice made beside them (double cuff; pocket flap): `chosen` is what is
 * chosen on the shirt so far. Placket is a text card.
 * ──────────────────────────────────────────────────────────────────────────── */

interface Props {
  chosen?: GarmentSelections;
}

/**
 * Fit one drawing, as drawn, into the 400×300 sketch frame (centred, 10 px clear of the edges).
 * `fade`: the drawing is a close-up cut out of a whole shirt, so where it is cut it fades into the ground
 * instead of ending in a hard edge: the sides and bottom of a collar, the top of a hem.
 * `children` are drawn over it, in the drawing's own coordinates.
 */
function Art({ name, fade, children }: { name: string; fade?: 'sidesAndBottom' | 'top'; children?: ReactNode }) {
  const id = `fade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { vb, layers } = SHIRT_ART[name];
  const [x, y, w, h] = vb;
  const s = Math.min(380 / w, 280 / h);
  const shapes = (
    <>
      {layers.map(([cls, d, transform], i) => (
        <path key={i} className={cls} d={d} transform={transform} />
      ))}
      {children}
    </>
  );
  const vertical = fade === 'top' ? [['0', '#000'], ['0.22', '#fff']] : [['0.78', '#fff'], ['1', '#000']];
  const horizontal = fade === 'top' ? [['0', '#fff']] : [['0', '#000'], ['0.1', '#fff'], ['0.9', '#fff'], ['1', '#000']];
  return (
    <svg x={(400 - w * s) / 2} y={(300 - h * s) / 2} width={w * s} height={h * s} viewBox={`${x} ${y} ${w} ${h}`}>
      {fade ? (
        <>
          <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
            {vertical.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
          <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
            {horizontal.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
          <mask id={`${id}mv`} maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill={`url(#${id}v)`} />
          </mask>
          <mask id={`${id}mh`} maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill={`url(#${id}h)`} />
          </mask>
          <g mask={`url(#${id}mv)`}>
            <g mask={`url(#${id}mh)`}>
              <rect x={x} y={y} width={w} height={h} fill="none" />
              {shapes}
            </g>
          </g>
        </>
      ) : (
        shapes
      )}
    </svg>
  );
}

/* ── Sleeve length ───────────────────────────────────────────────────────── */
export const SleeveLong = () => <Art name="sleeve-long" />;
export const SleeveShort = () => <Art name="sleeve-short" />;

/* ── Collar ──────────────────────────────────────────────────────────────── */
export const CollarPoint = () => <Art name="collar-point" fade="sidesAndBottom" />;
export const CollarSpread = () => <Art name="collar-spread" fade="sidesAndBottom" />;
export const CollarCutaway = () => <Art name="collar-cutaway" fade="sidesAndBottom" />;
export const CollarCutawayTwoButton = () => <Art name="collar-cutawayTwoButton" fade="sidesAndBottom" />;
export const CollarButtonDown = () => <Art name="collar-buttonDown" fade="sidesAndBottom" />;
export const CollarClub = () => <Art name="collar-club" fade="sidesAndBottom" />;
export const CollarBand = () => <Art name="collar-band" fade="sidesAndBottom" />;
export const CollarCuban = () => <Art name="collar-cuban" fade="sidesAndBottom" />;

/* ── Cuffs ───────────────────────────────────────────────────────────────── */

/**
 * A shirt button in the stock drawings' line, in the cuff drawing's coordinates: the double cuff's
 * cufflink is painted out with the cloth and a button sewn in its place.
 */
function CuffButton({ cx, cy, angle }: { cx: number; cy: number; angle: number }) {
  return (
    <g>
      <rect x={cx - 21} y={cy - 8} width={42} height={16} rx={6} className="art-paper" transform={`rotate(${angle} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={8.5} className="art-paper" stroke="var(--sk-ink)" strokeWidth={1.5} />
      {[
        [-2.1, -2.1],
        [2.1, -2.1],
        [-2.1, 2.1],
        [2.1, 2.1],
      ].map(([dx, dy]) => (
        <circle key={`${dx}${dy}`} cx={cx + dx} cy={cy + dy} r={1.05} className="art-ink" />
      ))}
    </g>
  );
}

const isDouble = (chosen?: GarmentSelections) => chosen?.doubleCuff === 'doubleCuff.yes';

/** Rounded corner: a single cuff with a button, or (double cuff) the folded cuff with its cufflink. */
export const CuffRounded = ({ chosen }: Props) => (
  <Art name="cuff-roundedStandard">{isDouble(chosen) ? null : <CuffButton cx={633} cy={246.5} angle={0} />}</Art>
);
export const CuffAngled = ({ chosen }: Props) => (
  <Art name="cuff-angledStandard">{isDouble(chosen) ? null : <CuffButton cx={679.6} cy={615.6} angle={45} />}</Art>
);

/* ── Chest pocket ────────────────────────────────────────────────────────── */

type PocketShape = 'rounded' | 'pointed' | 'square';

const PX0 = 124;
const PX1 = 276;
const PTOP = 56;
const PBOT = 246;
const HEM_Y = 90;

/** The pocket outline and its stitching, by the shape of its bottom. */
const POCKET: Record<PocketShape, { body: string; inset: string }> = {
  rounded: {
    body: `M${PX0} ${PTOP} H${PX1} V196 A50 50 0 0 1 226 ${PBOT} H174 A50 50 0 0 1 ${PX0} 196 Z`,
    inset: `M${PX0 + 8} ${PTOP + 10} V196 A42 42 0 0 0 174 ${PBOT - 8} H226 A42 42 0 0 0 ${PX1 - 8} 196 V${PTOP + 10}`,
  },
  pointed: {
    body: `M${PX0} ${PTOP} H${PX1} V196 L200 ${PBOT} L${PX0} 196 Z`,
    inset: `M${PX0 + 8} ${PTOP + 10} V194 L200 ${PBOT - 8} L${PX1 - 8} 194 V${PTOP + 10}`,
  },
  square: {
    body: `M${PX0} ${PTOP} H${PX1} V${PBOT} H${PX0} Z`,
    inset: `M${PX0 + 8} ${PTOP + 10} V${PBOT - 8} H${PX1 - 8} V${PTOP + 10}`,
  },
};

/** The flap over the pocket mouth, cut to the same shape as the pocket's bottom. */
const F0 = PX0 - 4;
const F1 = PX1 + 4;
const FLAP: Record<PocketShape, { body: string; inset: string; tip: number }> = {
  rounded: {
    body: `M${F0} ${PTOP - 4} H${F1} V106 A28 28 0 0 1 ${F1 - 28} 134 H${F0 + 28} A28 28 0 0 1 ${F0} 106 Z`,
    inset: `M${F0 + 9} ${PTOP + 5} V106 A19 19 0 0 0 ${F0 + 28} 125 H${F1 - 28} A19 19 0 0 0 ${F1 - 9} 106 V${PTOP + 5}`,
    tip: 134,
  },
  pointed: {
    body: `M${F0} ${PTOP - 4} H${F1} V108 L200 140 L${F0} 108 Z`,
    inset: `M${F0 + 9} ${PTOP + 5} V104 L200 131 L${F1 - 9} 104 V${PTOP + 5}`,
    tip: 140,
  },
  square: {
    body: `M${F0} ${PTOP - 4} H${F1} V132 H${F0} Z`,
    inset: `M${F0 + 9} ${PTOP + 5} V123 H${F1 - 9} V${PTOP + 5}`,
    tip: 132,
  },
};

/** A patch pocket, close up: plain (a stitched hem band at the top), with a flap, or a flap and a button. */
function Pocket({ shape, chosen }: { shape: PocketShape } & Props) {
  const flap = chosen?.pocketFlap ?? 'pocketFlap.plain';
  const k = 1.12;
  const { body, inset } = POCKET[shape];
  const f = FLAP[shape];
  return (
    <Scale k={1 / k} transform={`translate(200 150) scale(${k}) translate(-200 -150)`}>
      <path className="paper ink" d={body} />
      <path className="stitch" d={flap === 'pocketFlap.plain' ? `M${PX0 + 8} ${HEM_Y} H${PX1 - 8} ${inset}` : inset} />
      {flap === 'pocketFlap.plain' ? null : (
        <>
          <path className="paper ink" d={f.body} />
          <path className="stitch" d={f.inset} />
          {flap === 'pocketFlap.flapButton' ? <Button cx={200} cy={f.tip - 30} r={8} /> : null}
        </>
      )}
    </Scale>
  );
}

export const PocketRounded = ({ chosen }: Props) => <Pocket shape="rounded" chosen={chosen} />;
export const PocketPointed = ({ chosen }: Props) => <Pocket shape="pointed" chosen={chosen} />;
export const PocketSquare = ({ chosen }: Props) => <Pocket shape="square" chosen={chosen} />;

/* ── Hem ─────────────────────────────────────────────────────────────────── */
export const HemStraight = () => <Art name="hem-straight" fade="top" />;
export const HemRounded = () => <Art name="hem-rounded" fade="top" />;

/** The shirt on the start screen: the long-sleeved shirt. */
export const ProductShirt = SleeveLong;

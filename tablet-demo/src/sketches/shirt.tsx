import type { ReactNode } from 'react';
import { Scale } from './common';

/* ────────────────────────────────────────────────────────────────────────────
 * Shirt drawings: only the chest pockets have drawings, in the same line-art as the jacket and
 * trouser sketches (one even charcoal line on white cloth, fine dashed top-stitching, warm beige
 * ground; styles/sketch.css). Every other shirt step is a text card.
 * ──────────────────────────────────────────────────────────────────────────── */

/* ── Chest pockets ───────────────────────────────────────────────────────── */

const PX0 = 124;
const PX1 = 276;
const PTOP = 56;

/** A patch pocket: hem band at the top, then the body below. `body` is the outline, `inset` the stitching. */
function Pocket({ body, inset, children }: { body: string; inset: string; children?: ReactNode }) {
  const k = 1.12;
  return (
    <Scale k={1 / k} transform={`translate(200 150) scale(${k}) translate(-200 -150)`}>
      <path className="paper ink" d={body} />
      <path className="stitch" d={inset} />
      {children}
    </Scale>
  );
}

const HEM_Y = 90;

export const PocketAngled = () => (
  <Pocket
    body={`M${PX0} ${PTOP} H${PX1} V196 L200 246 L${PX0} 196 Z`}
    inset={`M${PX0 + 8} ${HEM_Y} H${PX1 - 8} M${PX0 + 8} ${PTOP + 10} V194 L200 238 L${PX1 - 8} 194 V${PTOP + 10}`}
  />
);

export const PocketRounded = () => (
  <Pocket
    body={`M${PX0} ${PTOP} H${PX1} V196 A50 50 0 0 1 226 246 H174 A50 50 0 0 1 ${PX0} 196 Z`}
    inset={`M${PX0 + 8} ${HEM_Y} H${PX1 - 8} M${PX0 + 8} ${PTOP + 10} V196 A42 42 0 0 0 174 238 H226 A42 42 0 0 0 ${PX1 - 8} 196 V${PTOP + 10}`}
  />
);

export const PocketSquare = () => (
  <Pocket
    body={`M${PX0} ${PTOP} H${PX1} V246 H${PX0} Z`}
    inset={`M${PX0 + 8} ${HEM_Y} H${PX1 - 8} M${PX0 + 8} ${PTOP + 10} V238 H${PX1 - 8} V${PTOP + 10}`}
  />
);

/** The flap lies over the top of the pocket: a rounded-cornered shape with its own stitching. */
export const PocketFlap = () => (
  <Pocket
    body={`M${PX0} ${PTOP} H${PX1} V200 A46 46 0 0 1 230 246 H170 A46 46 0 0 1 ${PX0} 200 Z`}
    inset={`M${PX0 + 8} ${PTOP + 10} V200 A38 38 0 0 0 170 238 H230 A38 38 0 0 0 ${PX1 - 8} 200 V${PTOP + 10}`}
  >
    <path className="paper ink" d={`M${PX0 - 4} ${PTOP} H${PX1 + 4} V104 A28 28 0 0 1 ${PX1 - 24} 132 H${PX0 + 24} A28 28 0 0 1 ${PX0 - 4} 104 Z`} />
    <path className="stitch" d={`M${PX0 + 6} ${PTOP + 8} V104 A20 20 0 0 0 ${PX0 + 26} 124 H${PX1 - 26} A20 20 0 0 0 ${PX1 - 6} 104 V${PTOP + 8}`} />
  </Pocket>
);

/** The shirt on the start screen: the chest pocket, the one shirt drawing the house approved. */
export const ProductShirt = PocketSquare;

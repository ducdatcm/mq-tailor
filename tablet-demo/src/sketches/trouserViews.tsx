import type { ReactNode } from 'react';
import { Scale } from './common';

/* ────────────────────────────────────────────────────────────────────────────
 * Trousers seen whole, front and back, redrawn as clean vectors from the house's reference
 * drawings (flat front, single pleat, double pleat; one and two back pockets). Coordinates are
 * those of the reference pictures; <View> fits them into the 400×300 frame and keeps line
 * weights constant. Outline in .ink, seams and pleats in .line, the fly stitching in .fly.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Fit a drawing whose bounds are x0..x1, y0..y1 (reference pixels) into the frame, centred. */
function View({ box, children }: { box: [number, number, number, number]; children: ReactNode }) {
  const [x0, y0, x1, y1] = box;
  const s = Math.min(372 / (x1 - x0), 276 / (y1 - y0));
  const tx = (400 - (x1 - x0) * s) / 2 - x0 * s;
  const ty = (300 - (y1 - y0) * s) / 2 - y0 * s;
  return (
    <Scale k={1 / s} transform={`translate(${tx} ${ty}) scale(${s})`}>
      {children}
    </Scale>
  );
}

/* ── Front ───────────────────────────────────────────────────────────────── */

// outer edge from the left waistband corner round to the right one, legs open at the bottom
const FRONT_LEFT = 'M59 42 C52 95 32 175 32 308';
const FRONT_RIGHT = 'M307 42 C315 95 337 175 337 308';
const FRONT_CROTCH = 'M174 308 L175.5 252 C176.5 236 179.5 226 184 222 C188.5 226 191.5 236 192.5 252 L194 308';
const FRONT_FILL =
  'M64 17 L304 17 L307 42 C315 95 337 175 337 308 L194 308 L192.5 252 C191.5 236 188.5 226 184 222 C179.5 226 176.5 236 175.5 252 L174 308 L32 308 C32 175 52 95 59 42 Z';

/** A belt loop standing on the waistband. */
const Loop = ({ x }: { x: number }) => <rect x={x - 3.5} y={14} width={7} height={31} rx={1.5} className="paper line" />;

function Front({ pleats }: { pleats: 0 | 1 | 2 }) {
  return (
    <View box={[32, 14, 337, 308]}>
      <path d={FRONT_FILL} className="paper" />
      {/* waistband */}
      <path d="M64 17 L304 17 L307 42 L59 42 Z" className="paper ink" />
      <Loop x={119} />
      <Loop x={249} />
      <circle cx={192} cy={29.5} r={5.5} className="btn" />
      <path d="M197.5 29.5 H202" className="fine" />
      {/* fly: the front edge, and its stitching */}
      <path d="M184 17 V222" className="line" />
      <path d="M206 43 V146 C206 158 197 165 184 166" className="fly" />
      {/* side pockets */}
      <path d="M81 43 Q68 84 47 119" className="line" />
      <path d="M288 43 Q301 84 322 119" className="line" />
      {/* pleats, folded towards the side seams from under the belt loops */}
      {pleats >= 1 ? (
        <>
          <path d="M119 43 L109 130" className="line" />
          <path d="M249 43 L259 130" className="line" />
        </>
      ) : null}
      {pleats === 2 ? (
        <>
          <path d="M95 43 L86 100" className="line" />
          <path d="M273 43 L282 100" className="line" />
        </>
      ) : null}
      <path d={`${FRONT_LEFT} M${FRONT_RIGHT.slice(1)} ${FRONT_CROTCH}`} className="ink" />
    </View>
  );
}

export const PleatsFlat = () => <Front pleats={0} />;
export const PleatsOne = () => <Front pleats={1} />;
export const PleatsTwo = () => <Front pleats={2} />;

/* ── Back ────────────────────────────────────────────────────────────────── */

const BACK_FILL =
  'M50 22 C60 18 100 15 143 15 C186 15 226 18 236 22 L245 42 C258 90 268 150 270 225 L150 225 L148.5 198 C148 192 146 189 143 188 C140 189 138 192 137.5 198 L136 225 L17 225 C19 150 28 90 41 42 Z';
const BACK_EDGES =
  'M41 42 C28 90 19 150 17 225 M245 42 C258 90 268 150 270 225 M136 225 L137.5 198 C138 192 140 189 143 188 C146 189 148 192 148.5 198 L150 225';

/** A jetted back pocket: a narrow double welt, its button below, the dart above. */
function BackPocket({ x }: { x: number }) {
  const cx = x + 34;
  return (
    <g>
      <path d={`M${cx} 43 V72`} className="line" />
      <rect x={x} y={72} width={68} height={12} rx={2} className="paper ink" />
      <path d={`M${x + 3} 78 H${x + 65}`} className="fine" />
      <circle cx={cx} cy={93} r={3.4} className="btn" />
    </g>
  );
}

function Back({ pockets }: { pockets: 'right' | 'two' }) {
  return (
    <View box={[17, 13, 270, 225]}>
      <path d={BACK_FILL} className="paper" />
      {/* waistband, with a gently curved top and the centre-back belt loop */}
      <path d="M50 22 C60 18 100 15 143 15 C186 15 226 18 236 22 L245 42 L41 42 Z" className="paper ink" />
      <rect x={70} y={17} width={7} height={27} rx={1.5} className="paper line" />
      <rect x={139.5} y={13} width={7} height={31} rx={1.5} className="paper line" />
      <rect x={210} y={17} width={7} height={27} rx={1.5} className="paper line" />
      {/* centre-back seam */}
      <path d="M143 43 V188" className="line" />
      {/* the pocket on the wearer's right sits on the right of the picture (seen from behind) */}
      {pockets === 'two' ? <BackPocket x={45} /> : null}
      <BackPocket x={174} />
      <path d={BACK_EDGES} className="ink" />
    </View>
  );
}

export const BackPocketsTwo = () => <Back pockets="two" />;
export const BackPocketOneRight = () => <Back pockets="right" />;

import { useId, type ReactNode } from 'react';
import { DRAWINGS, TRACE_SCALE } from './assets/vectors';

/* ────────────────────────────────────────────────────────────────────────────
 * Jacket sketches taken from the house's reference drawings (src/sketches/assets).
 * Each is a crop of the supplied line art, shown as it is. Where an option has
 * no supplied drawing (3-button, 4-button double-breasted, shawl lapel,
 * structured shoulder) the nearest supplied drawing is edited in the same line:
 * buttons are painted out and redrawn, a lapel notch is closed, and so on.
 * Edits are drawn in the crop's own pixel coordinates.
 * ──────────────────────────────────────────────────────────────────────────── */

interface PhotoProps {
  /** Which supplied drawing (a key of DRAWINGS). */
  name: keyof typeof DRAWINGS;
  /** Show only the top part of the drawing (e.g. a jacket without its stand). */
  showH?: number;
  children?: ReactNode;
}

/** Fit a cropped drawing into the 400×300 sketch frame, centred. */
function Photo({ name, showH, children }: PhotoProps) {
  const { w, h, ink, paper } = DRAWINGS[name];
  showH ??= h;
  const clip = `clip${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const s = Math.min(280 / showH, 380 / w);
  return (
    <g transform={`translate(${(400 - w * s) / 2} ${(300 - showH * s) / 2}) scale(${s})`}>
      <clipPath id={clip}>
        <rect width={w} height={showH} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <g transform={`scale(${1 / TRACE_SCALE})`}>
          <path d={paper} className="photo-paper" />
          <path d={ink} className="photo-ink" />
        </g>
        {children}
      </g>
    </g>
  );
}

/** The supplied jacket without its mannequin stand, for the suit illustration. */
export const JacketOnly = () => <Photo name="sb2" showH={408} />;

/** Paint out part of the drawing with the page's white. */
function Erase({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} className="erase" />;
}

function EraseBox({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <rect x={x} y={y} width={w} height={h} className="erase" />;
}

/** A button as the reference draws it: a plain ring, optionally with its buttonhole. */
function Ring({ cx, cy, hole, r = 4.7 }: { cx: number; cy: number; hole?: 'attached' | 'apart'; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="ring-btn" />
      {hole === 'attached' ? <path d={`M${cx + r - 0.1} ${cy - 0.4} L${cx + r + 4.9} ${cy - 1.6}`} className="pen" /> : null}
      {hole === 'apart' ? <path d={`M${cx + 9} ${cy - 1.8} L${cx + 20} ${cy - 2.4}`} className="pen" /> : null}
    </g>
  );
}

/* ── Front closure ───────────────────────────────────────────────────────── */

export const ClosureSB2 = () => <Photo name="sb2" />;

/** One button: the lower one is painted out. */
export const ClosureSB1 = () => (
  <Photo name="sb2">
    <Erase cx={139.5} cy={300} r={8} />
    <EraseBox x={155} y={294} w={20} h={9} />
  </Photo>
);

/** Three buttons: both are painted out and redrawn, evenly, with one more. */
export const ClosureSB3 = () => (
  <Photo name="sb2">
    <Erase cx={150} cy={252} r={8} />
    <EraseBox x={153} y={246} w={9} h={9} />
    <Erase cx={139.5} cy={300} r={8} />
    <EraseBox x={155} y={294} w={20} h={9} />
    <Ring cx={150} cy={246} hole="attached" />
    <Ring cx={146.5} cy={274} hole="attached" />
    <Ring cx={141} cy={302} hole="apart" />
  </Photo>
);

export const ClosureDB62 = () => <Photo name="db6x2" />;
export const ClosureDB61 = () => <Photo name="db6x1" />;

/** Four buttons: the top row of the six-button drawing is painted out. */
export const ClosureDB42 = () => (
  <Photo name="db6x2">
    <Erase cx={98} cy={209} r={7.5} />
    <Erase cx={196} cy={207} r={7.5} />
  </Photo>
);
export const ClosureDB41 = () => (
  <Photo name="db6x1">
    <Erase cx={100} cy={206} r={7.5} />
    <Erase cx={198} cy={204} r={7.5} />
  </Photo>
);

/* ── Lapel ───────────────────────────────────────────────────────────────── */

export const LapelNotch = () => <Photo name="sb2" />;
export const LapelPeak = () => <Photo name="peak" />;

/**
 * Shawl: one smooth, rounded edge runs from the collar down to the button, with
 * no notch and no peak. The ear, the notch and the straight lapel edge are painted
 * out and one curve is drawn in their place; the roll line is kept.
 */
function ShawlSide() {
  return (
    <g>
      <polygon points="87.5,104.5 90,100.5 105.5,106.5 117.8,88.5 119.2,92.2 106,112" className="erase" />
      <polygon points="84.5,113 89.5,115.8 106,112.5 103.8,106.5" className="erase" />
      <polygon points="84.7,116.2 89.3,113.8 144.3,215.8 139.7,218.2" className="erase" />
      <path d="M88 102 C82 126 91 153 108 174 C121 192 135 209 146 225.5" className="pen" />
    </g>
  );
}
export const LapelShawl = () => (
  <Photo name="sb2">
    <ShawlSide />
    <g transform="translate(293.3 0) scale(-1 1)">
      <ShawlSide />
    </g>
  </Photo>
);

/* ── Shoulder ────────────────────────────────────────────────────────────── */

/** Roped: the sleeve head rises in one clean, round ridge. */
export const ShoulderRoped = () => <Photo name="shoulder-soft" />;
/** Spalla camicia: the sleeve head is gathered softly into the armhole, like a shirt. */
export const ShoulderCamicia = () => <Photo name="shoulder-roped" />;
/** Natural, lightly padded: the shirt shoulder with a squarer, slightly built-up tip. */
export const ShoulderNatural = () => (
  <Photo name="shoulder-soft">
    <polygon points="173,72 212,72 212,98 197,98 173,92" className="erase" />
    <path d="M172 82.5 L195 88 L203.2 101.6" className="pen heavy-pen" />
  </Photo>
);

/* ── Lining (the jacket turned inside out) ───────────────────────────────── */

/** White = lined, page colour = bare cloth with bound seams. */
export const LiningFull = () => <Photo name="lining-full" />;
export const LiningHalf = () => <Photo name="lining-half" />;
export const LiningQuarter = () => <Photo name="lining-quarter" />;
export const LiningNone = () => <Photo name="lining-none" />;

/* ── Trousers (waist close-ups) ──────────────────────────────────────────── */

export const PleatsFlat = () => <Photo name="flat" />;
/**
 * One pleat: the centre line is carried up from the leg to the waistband
 * (a pleat on each side of the fly, as drawn in the supplied reference).
 */
export const PleatsOne = () => (
  <Photo name="pleat1">
    <path d="M185.7 116.4 L182 202.3" className="pen" />
  </Photo>
);
export const PleatsTwo = () => <Photo name="pleat2" />;
export const WaistbandBeltLoops = () => <Photo name="loops" />;
export const WaistbandAdjusters = () => <Photo name="adjusters" />;
export const BackPocketsTwo = () => <Photo name="back2" />;

/** One pocket, on the wearer's right (the right of the picture from behind): the left pocket is painted out. */
export const BackPocketOneRight = () => (
  <Photo name="back2">
    <rect x={57} y={193} width={87} height={30} className="erase" />
  </Photo>
);

/** The blazer on the start screen: the supplied jacket with patch pockets. */
export const ProductBlazerDrawing = () => <Photo name="patch" />;

/* ── Breast pocket ───────────────────────────────────────────────────────── */

/** The dark button of the supplied drawing is painted out and drawn as a ring, as on the other jackets. */
const FrontButton = ({ cx, cy }: { cx: number; cy: number }) => (
  <>
    <Erase cx={cx} cy={cy} r={11} />
    <Ring cx={cx} cy={cy} r={7.5} />
  </>
);

/** Jet: the opening is only a slit; its two fine edges are redrawn as thin lines. */
export const BreastPocketJet = () => (
  <Photo name="bp-jet">
    <polygon points="118,240 219,219 219,239 118,259" className="erase" />
    <path d="M112 247 L217.5 226 L217.5 232 L112 253" className="line-pen" />
    <FrontButton cx={30.6} cy={433.9} />
  </Photo>
);

export const BreastPocketPatch = () => (
  <Photo name="bp-patch">
    <FrontButton cx={32.8} cy={395.5} />
  </Photo>
);

export const BreastPocketWelt = () => (
  <Photo name="bp-welt">
    <FrontButton cx={31.7} cy={393.4} />
  </Photo>
);

/* ── Back vents ──────────────────────────────────────────────────────────── */

/** One vent, in the centre of the back. */
export const VentSingle = () => <Photo name="vent-centre" />;
/** Two vents, one at each side. */
export const VentsDouble = () => (
  <Photo name="vent-side">
    <path d="M240 38.5 Q253 30 266 38.5" className="pen heavy-pen" />
  </Photo>
);

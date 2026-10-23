import type { ReactNode } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
 * Hip pockets, after the supplied "Pockets" reference: the lower front of a
 * jacket with its two buttons, front edge and cutaway hem, drawn once, and only
 * the pocket changes. Same line as the other drawings: even charcoal line on a
 * white garment, on the beige ground. Canvas 400×300.
 * ──────────────────────────────────────────────────────────────────────────── */

/** The lower front panel every pocket sits on. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <g transform="translate(-9 0)">
      <path d="M100 26 L292 26 C298 92 306 176 318 262 L296 268 L100 268 Z" className="paper ink" />
      {/* front edge and the rounded hem of the top panel */}
      <path d="M118 26 L118 212 C122 248 150 268 200 268" className="ink" />
      <path d="M100 242 C109 237 115 226 118 212" className="line" />
      <circle cx="136" cy="52" r="5.4" className="btn" />
      <circle cx="136" cy="104" r="5.4" className="btn" />
      {children}
    </g>
  );
}

/** A flap: the pocket line above, the flap over it. */
function Flap({ d, line }: { d: string; line: string }) {
  return (
    <g>
      <path d={line} className="fine" />
      <path d={d} className="paper ink" />
    </g>
  );
}

/** A jetted pocket: a narrow double welt with a bar tack at each end. */
function Jet({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <path d={`M${x1} ${y1} L${x2} ${y2} M${x1} ${y1 + 3.6} L${x2} ${y2 + 3.6}`} className="ink" />
      <path d={`M${x1} ${y1 - 2} L${x1} ${y1 + 5.6} M${x2} ${y2 - 2} L${x2} ${y2 + 5.6}`} className="fine" />
    </g>
  );
}

export const PocketSlantedFlap = () => (
  <Panel>
    <Flap
      line="M213 98 L301 110"
      d="M213 100 L301 112 L305 148 L222 138 Q213 137 213 129 Z"
    />
  </Panel>
);

export const PocketSlantedJet = () => (
  <Panel>
    <Jet x1={232} y1={112} x2={300} y2={121} />
  </Panel>
);

export const PocketPatch = () => (
  <Panel>
    <path d="M205 108 L300 114 L303 204 Q303 220 288 220 L222 215 Q205 213 205 197 Z" className="paper ink" />
  </Panel>
);

export const PocketStraightFlap = () => (
  <Panel>
    <Flap
      line="M236 106 L303 103"
      d="M236 108 L303 105 L305 147 L245 150 Q236 149 236 141 Z"
    />
  </Panel>
);

export const PocketStraightJet = () => (
  <Panel>
    <Jet x1={238} y1={128} x2={302} y2={121} />
  </Panel>
);


/* ── Trouser front pockets: the same panel language, at the hip ─────────── */

/** The top of the trousers at the hip: waistband, fly and side seam, open below. */
function HipPanel({ children }: { children: ReactNode }) {
  return (
    <g transform="translate(-9 0)">
      <path d="M100 26 L292 26 C298 120 306 204 316 276 L100 276 Z" className="paper ink" />
      <path d="M100 62 L295 62" className="ink" />
      <circle cx="128" cy="44" r="5.4" className="btn" />
      <path d="M150 62 L150 176 Q150 196 170 196" className="line" />
      {children}
    </g>
  );
}

export const FrontPocketSlanted = () => (
  <HipPanel>
    {/* the opening runs from the waistband to the side seam, with the pocket facing alongside */}
    <path d="M214 62 Q270 92 304 152" className="ink" />
    <path d="M230 62 Q280 94 308 150" className="line" />
    <path d="M210 60 L218 66 M300 148 L308 156" className="fine" />
  </HipPanel>
);

export const FrontPocketSideSeam = () => (
  <HipPanel>
    {/* the opening lies along the side seam */}
    <path d="M286 66 C290 110 296 150 300 188" className="ink" />
    <path d="M272 66 C276 110 282 150 286 186" className="line" />
    <path d="M280 64 L292 64 M294 188 L306 190" className="fine" />
  </HipPanel>
);

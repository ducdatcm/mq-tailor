import type { ReactNode } from 'react';
import { Callout } from './common';

/* ────────────────────────────────────────────────────────────────────────────
 * Trouser hem close-ups, in the same round frame as the supplied waist drawings:
 * a leg seen slightly from above, so the hem is a shallow curve. Canvas 400×300.
 * ──────────────────────────────────────────────────────────────────────────── */

const C = { x: 200, y: 150, r: 134 };

function Round({ children }: { children: ReactNode }) {
  return (
    <Callout cx={C.x} cy={C.y} r={C.r} focus={[C.x, C.y]}>
      {children}
    </Callout>
  );
}

/** The pressed crease: a single fine line down the middle of the leg. */
const Crease = ({ to }: { to: number }) => <path d={`M201 10 L201 ${to}`} className="line" />;

export const HemPlain = () => (
  <Round>
    <path d="M122 0 L126 214 Q200 238 274 214 L278 0 Z" className="paper" />
    <path d="M122 0 L126 214 Q200 238 274 214 L278 0" className="ink" />
    <path d="M125 199 Q200 222 275 199" className="dots" />
    <Crease to={224} />
  </Round>
);

export const HemTurnUp = () => (
  <Round>
    <path d="M122 0 L125 170 L275 170 L278 0 Z" className="paper" />
    <path d="M122 0 L125 170 M278 0 L275 170" className="ink" />
    <Crease to={178} />
    {/* the cuff, folded up on the outside */}
    <path d="M116 168 Q200 190 284 168 L288 230 Q200 254 112 230 Z" className="paper ink" />
    <path d="M117 180 Q200 202 283 180" className="line" />
  </Round>
);

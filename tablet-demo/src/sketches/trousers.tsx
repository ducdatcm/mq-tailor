import type { ReactNode } from 'react';
import { Button, Mirror } from './common';

/* ────────────────────────────────────────────────────────────────────────────
 * Trouser sketches, 400×300 canvas. Each group draws one constant background
 * and only varies the detail being compared.
 * ──────────────────────────────────────────────────────────────────────────── */

/* ── Front pleats (front waist + hip, both legs) ─────────────────────────── */

function FrontWaist({ children }: { children: ReactNode }) {
  return (
    <g>
      <path d="M44 22 L356 22 L360 300 L40 300 Z" className="ink cloth" />
      {/* waistband */}
      <path d="M44 22 L356 22 L356 58 L44 58 Z" className="ink cloth2" />
      {/* fly and centre button */}
      <path d="M200 58 L200 150 Q200 168 214 168" className="ctx" />
      <Button cx={214} cy={40} r={6} />
      <path d="M200 40 L226 40" className="ctx hole" />
      {children}
    </g>
  );
}

/** Pleat as a soft fold opening from the waistband. */
function Pleat({ x }: { x: number }) {
  return (
    <path
      d={`M${x - 11} 58 Q${x - 13} 104 ${x - 4} 152 L${x + 4} 152 Q${x + 13} 104 ${x + 11} 58 Z`}
      className="ink cloth2"
    />
  );
}

/** Pressed centre crease: dashed, long, so it is not mistaken for a pleat. */
function Crease({ x, from }: { x: number; from: number }) {
  return <path d={`M${x} ${from} L${x} 296`} className="ctx crease" />;
}

export function PleatsFlat() {
  return (
    <FrontWaist>
      <Crease x={134} from={60} />
      <Crease x={266} from={60} />
    </FrontWaist>
  );
}

export function PleatsOne() {
  return (
    <FrontWaist>
      <Crease x={134} from={152} />
      <Crease x={266} from={152} />
      <Pleat x={134} />
      <Pleat x={266} />
    </FrontWaist>
  );
}

export function PleatsTwo() {
  return (
    <FrontWaist>
      <Crease x={134} from={152} />
      <Crease x={266} from={152} />
      <Pleat x={134} />
      <Pleat x={266} />
      <Pleat x={98} />
      <Pleat x={302} />
    </FrontWaist>
  );
}

/* ── Waistband fastening (waistband close-up) ────────────────────────────── */

function WaistbandBase({ children }: { children: ReactNode }) {
  return (
    <g>
      <path d="M50 118 L350 118 L354 300 L46 300 Z" className="ink cloth" />
      <path d="M200 126 L200 230 Q200 252 216 252" className="ctx" />
      {/* waistband band with closure */}
      <path d="M50 70 L350 70 L350 126 L50 126 Z" className="ink cloth2" />
      <path d="M200 70 L200 126" className="ctx" />
      <Button cx={220} cy={98} r={7} />
      <path d="M200 98 L236 98" className="ctx hole" />
      <path d="M58 78 L342 78 M58 118 L342 118" className="ctx stitch" />
      {children}
    </g>
  );
}

function BeltLoop({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 9} 60 L${x + 9} 60 L${x + 9} 138 L${x - 9} 138 Z`} className="ink cloth" />
      <path d={`M${x - 9} 68 L${x + 9} 68 M${x - 9} 130 L${x + 9} 130`} className="ctx" />
    </g>
  );
}

export function WaistbandBeltLoops() {
  return (
    <WaistbandBase>
      {[92, 142, 258, 308].map((x) => (
        <BeltLoop key={x} x={x} />
      ))}
    </WaistbandBase>
  );
}

function Adjuster() {
  // drawn for the right side; mirrored for the left
  return (
    <g>
      <path d="M350 76 L388 88 L388 112 L350 122 Z" className="ink cloth2" />
      <path d="M358 84 L380 91 M358 114 L380 109" className="ctx stitch" />
      {/* slide buckle */}
      <path d="M362 90 L374 90 L374 110 L362 110 Z" className="ink" />
      <path d="M368 90 L368 110" className="ink" />
    </g>
  );
}

export function WaistbandAdjusters() {
  return (
    <WaistbandBase>
      <Mirror>
        <Adjuster />
      </Mirror>
    </WaistbandBase>
  );
}

/* ── Front pockets (hip detail, wearer's left hip) ───────────────────────── */

function HipBase({ children }: { children: ReactNode }) {
  return (
    <g>
      <path d="M40 22 L346 22 L350 300 L40 300 Z" className="ink cloth" />
      <path d="M40 22 L346 22 L346 60 L40 60 Z" className="ink cloth2" />
      <path d="M40 60 L40 300" className="ctx" />
      <path d="M108 60 L108 150 Q108 168 122 168" className="ctx" />
      <Button cx={96} cy={41} r={6} />
      <path d="M346 60 L350 300" className="ink" />
      {children}
    </g>
  );
}

export function FrontPocketSlanted() {
  return (
    <HipBase>
      <path d="M212 60 L346 168 L346 190 L212 82 Z" className="ink cloth2" />
      <path d="M220 74 L342 174" className="ctx stitch" />
    </HipBase>
  );
}

export function FrontPocketSideSeam() {
  return (
    <HipBase>
      <path d="M316 60 L332 60 L336 186 L320 186 Z" className="ink cloth2" />
      <path d="M326 66 L329 180" className="ctx stitch" />
    </HipBase>
  );
}

/* ── Back pockets (rear view) ────────────────────────────────────────────── */

function BackBase({ children }: { children: ReactNode }) {
  return (
    <g>
      <path d="M44 22 L356 22 L362 300 L38 300 Z" className="ink cloth" />
      <path d="M44 22 L356 22 L356 58 L44 58 Z" className="ink cloth2" />
      {/* centre-back seam and waist darts, constant */}
      <path d="M200 58 Q196 160 200 300" className="ctx" />
      <path d="M126 58 L130 104 M134 58 L130 104 M270 58 L274 104 M278 58 L274 104" className="ctx" />
      {children}
    </g>
  );
}

function BackPocket({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 44} 126 L${x + 44} 126 L${x + 44} 152 L${x - 44} 152 Z`} className="ink cloth2" />
      <path d={`M${x - 36} 139 L${x + 36} 139`} className="ink slot" />
      <path d={`M${x - 44} 120 L${x - 44} 158 M${x + 44} 120 L${x + 44} 158`} className="ctx" />
      <Button cx={x} cy={118} r={6} />
    </g>
  );
}

export function BackPocketOneRight() {
  return (
    <BackBase>
      <BackPocket x={270} />
    </BackBase>
  );
}

export function BackPocketsTwo() {
  return (
    <BackBase>
      <BackPocket x={130} />
      <BackPocket x={270} />
    </BackBase>
  );
}

/* ── Hem (one leg, front, near the floor) ────────────────────────────────── */

export function HemPlain() {
  return (
    <g>
      <path d="M110 0 L106 252 L294 252 L290 0 Z" className="ink cloth" />
      <path d="M200 0 L200 252" className="ctx crease" />
      <path d="M108 238 L292 238" className="ctx stitch" />
      <path d="M70 262 L330 262" className="ctx" />
    </g>
  );
}

export function HemTurnUp() {
  return (
    <g>
      <path d="M110 0 L108 196 L292 196 L290 0 Z" className="ink cloth" />
      <path d="M200 0 L200 196" className="ctx crease" />
      {/* the folded-up cuff, slightly wider than the leg */}
      <path d="M104 196 L296 196 L298 252 L102 252 Z" className="ink cloth2" />
      <path d="M104 196 Q200 206 296 196" className="ink" />
      <path d="M108 218 L292 218" className="ctx stitch" />
      <path d="M102 252 L102 238 M298 252 L298 238" className="ctx" />
      <path d="M70 262 L330 262" className="ctx" />
    </g>
  );
}

import type { ReactNode } from 'react';
import { Button, Mirror } from './common';

/* ────────────────────────────────────────────────────────────────────────────
 * Jacket sketches. Drawn on a 400×300 canvas, symmetric about x = 200 unless
 * the option is inherently asymmetric.
 * ──────────────────────────────────────────────────────────────────────────── */

type LapelType = 'notch' | 'peak';

/** One (right-hand) lapel + collar in "lapel space": neck at y≈8, break at y≈254. */
function LapelHalf({ type }: { type: LapelType }) {
  if (type === 'notch') {
    return (
      <g>
        {/* lapel face */}
        <path d="M222 20 L266 64 L304 80 Q268 172 206 254 Z" className="ink cloth2" />
        {/* collar */}
        <path d="M222 20 L240 8 L292 36 L266 64 Z" className="ink cloth" />
        {/* edge stitching along the lapel */}
        <path d="M296 88 Q262 170 212 238" className="ctx stitch" />
      </g>
    );
  }
  return (
    <g>
      <path d="M222 20 L258 66 L306 24 Q276 150 206 254 Z" className="ink cloth2" />
      <path d="M222 20 L240 8 L284 34 L258 66 Z" className="ink cloth" />
      <path d="M298 38 Q268 152 212 238" className="ctx stitch" />
    </g>
  );
}

/** Shirt opening plus a symmetric pair of lapels, in lapel space. */
function LapelPair({ type }: { type: LapelType }) {
  return (
    <g>
      <path d="M176 8 L224 8 L206 254 L194 254 Z" className="paper" />
      <Mirror>
        <LapelHalf type={type} />
      </Mirror>
    </g>
  );
}

/** Lapel space → jacket-front coordinates (so the lapel keeps one shape everywhere). */
const LAPEL_FRONT = 'translate(200 24) scale(0.68) translate(-200 -8)';

/* ── Front silhouette (jacket seen from the front, sleeves hanging) ──────── */

const SILHOUETTE_HALF =
  'M200 24 L232 26 L304 46 C322 54 340 120 346 258 L310 266 C304 200 296 160 292 122 C280 170 274 225 284 284 L200 284';

function FrontBody() {
  return (
    <g>
      <Mirror>
        <path d={SILHOUETTE_HALF} className="ink cloth" />
        <path d="M304 46 C296 70 290 100 292 122" className="ctx" />
        <path d="M312 262 L344 256" className="ctx" />
      </Mirror>
    </g>
  );
}

/** Rounded front corner of the top panel, then the shared hem. */
const SB_FRONT_EDGE = 'M200 191 L200 252 Q200 278 230 284';

export function ClosureSB1() {
  return (
    <g>
      <FrontBody />
      <g transform={LAPEL_FRONT}>
        <LapelPair type="notch" />
      </g>
      <path d={SB_FRONT_EDGE} className="ink" />
      <path d="M200 191 L200 196" className="ink" />
      <Button cx={207} cy={197} r={6.5} />
    </g>
  );
}

export function ClosureSB2() {
  return (
    <g>
      <FrontBody />
      <g transform={LAPEL_FRONT}>
        <LapelPair type="notch" />
      </g>
      <path d={SB_FRONT_EDGE} className="ink" />
      <Button cx={207} cy={197} r={6.5} />
      <Button cx={207} cy={238} r={6.5} />
    </g>
  );
}

const LAPEL_FRONT_DB = 'translate(200 24) scale(0.62) translate(-200 -8)';
/** Same scale, sheared so the top panel's lapel sweeps to its front edge at x≈170. */
const LAPEL_FRONT_DB_TOP = 'translate(200 24) scale(0.62) translate(-200 0) skewX(-12.5) translate(0 -8)';

export function ClosureDB() {
  return (
    <g>
      <FrontBody />
      {/* shirt opening + the under-panel lapel */}
      <g transform={LAPEL_FRONT_DB}>
        <path d="M176 8 L224 8 L186 139 Z" className="paper" />
        <g transform="translate(400 0) scale(-1 1)">
          <LapelHalf type="peak" />
        </g>
      </g>
      {/* top panel overlaps: its lapel sweeps down to its front edge */}
      <g transform={LAPEL_FRONT_DB_TOP}>
        <LapelHalf type="peak" />
      </g>
      <path d="M170 182 L170 258 Q170 280 200 284" className="ink" />
      {/* six buttons: three rows, two columns */}
      {[176, 210, 244].map((y) => (
        <g key={y}>
          <Button cx={188} cy={y} r={6} />
          <Button cx={228} cy={y} r={6} />
        </g>
      ))}
    </g>
  );
}

/* ── Lapel close-up ──────────────────────────────────────────────────────── */

function LapelContext() {
  return (
    <g>
      <Mirror>
        <path d="M240 8 L360 58 L370 300 L200 300 L200 8 Z" className="cloth" />
        <path d="M240 8 L360 58 L370 300" className="ctx" />
      </Mirror>
    </g>
  );
}

function LapelSketch({ type }: { type: LapelType }) {
  return (
    <g>
      <LapelContext />
      <LapelPair type={type} />
      <path d="M200 254 L200 300" className="ink" />
      <Button cx={211} cy={266} r={9} />
    </g>
  );
}

export const LapelNotch = () => <LapelSketch type="notch" />;
export const LapelPeak = () => <LapelSketch type="peak" />;

/* ── Hip pockets (lower right front of the jacket, constant background) ──── */

function PocketBackground({ children }: { children: ReactNode }) {
  return (
    <g>
      <path d="M56 0 L56 228 Q56 266 96 272 L352 272 L352 0 Z" className="cloth" />
      <path d="M56 0 L56 228 Q56 266 96 272 L352 272 L352 0" className="ink" />
      {/* waist button on the top panel */}
      <Button cx={84} cy={40} r={9} />
      <path d="M352 0 L352 272" className="ctx" />
      {children}
    </g>
  );
}

export function PocketFlap() {
  return (
    <PocketBackground>
      <path d="M134 108 L322 116" className="ctx" />
      <path d="M134 112 L322 120 L322 160 Q322 170 312 170 L144 162 Q134 162 134 152 Z" className="ink cloth2" />
      <path d="M143 122 L313 129 L313 157 Q313 160 309 160 L147 153 Q143 153 143 149 Z" className="ctx stitch" />
    </PocketBackground>
  );
}

export function PocketJetted() {
  return (
    <PocketBackground>
      <path d="M134 124 L322 132 L322 150 L134 142 Z" className="ink cloth2" />
      <path d="M142 133 L314 141" className="ink slot" />
      <path d="M134 118 L134 148 M322 126 L322 156" className="ctx" />
    </PocketBackground>
  );
}

export function PocketPatch() {
  return (
    <PocketBackground>
      <path d="M138 100 L318 108 L318 196 Q318 206 308 206 L148 199 Q138 199 138 189 Z" className="ink cloth2" />
      <path d="M138 114 L318 122" className="ctx" />
      <path d="M148 130 L308 137 L308 192 Q308 195 304 195 L152 190 Q148 190 148 186 Z" className="ctx stitch" />
    </PocketBackground>
  );
}

/* ── Shoulder close-up (upper chest, both shoulders; only the shoulder differs) ── */

function ShoulderFrame({ children }: { children: ReactNode }) {
  return (
    <g>
      {children}
      {/* constant context: shirt opening and roll lines */}
      <path d="M176 22 L224 22 L206 300 L194 300 Z" className="paper" />
      <Mirror>
        <path d="M224 22 L206 300" className="ctx" />
        <path d="M224 26 L262 62 L296 76 Q272 160 208 272" className="ctx" />
      </Mirror>
    </g>
  );
}

export function ShoulderNatural() {
  return (
    <ShoulderFrame>
      <Mirror>
        <path d="M200 20 L232 36 Q300 48 340 92 Q356 110 358 152 L362 300 L200 300 Z" className="cloth" />
        <path d="M232 36 Q300 48 340 92 Q356 110 358 152 L362 300" className="ink" />
        {/* sleeve seam: soft and rounded */}
        <path d="M336 90 C306 112 296 160 298 214" className="ink" />
        {/* thin, light padding */}
        <path d="M242 44 Q298 52 334 94 L326 104 Q292 66 240 56 Z" className="ctx pad" />
        <path d="M242 44 Q298 52 334 94" className="ink" />
        {/* a little ease in the sleeve head */}
        <path d="M326 104 Q318 122 320 146" className="ctx" />
        <path d="M314 112 Q308 130 310 152" className="ctx" />
      </Mirror>
    </ShoulderFrame>
  );
}

export function ShoulderStructured() {
  return (
    <ShoulderFrame>
      <Mirror>
        <path d="M200 18 L232 30 Q306 32 352 66 Q364 80 364 112 L366 300 L200 300 Z" className="cloth" />
        {/* thick pad */}
        <path d="M240 36 Q304 38 346 68 L330 98 Q292 72 236 56 Z" className="ctx pad" />
        <path d="M232 30 Q306 32 352 66 Q364 80 364 112 L366 300" className="ink" />
        {/* crisp, squared sleeve seam */}
        <path d="M348 70 C322 94 304 150 300 214" className="ink" />
        <path d="M236 56 Q292 72 330 98" className="ctx" />
        <path d="M246 46 Q300 52 338 76" className="ctx stitch" />
      </Mirror>
    </ShoulderFrame>
  );
}

/* ── Back view and vents ─────────────────────────────────────────────────── */

function BackBody({ children }: { children?: ReactNode }) {
  return (
    <g>
      <Mirror>
        <path d={SILHOUETTE_HALF} className="ink cloth" />
        <path d="M304 46 C296 70 290 100 292 122" className="ctx" />
        <path d="M312 262 L344 256" className="ctx" />
        {/* side-back seams, constant */}
        <path d="M152 188 Q148 150 140 122" className="ctx" />
      </Mirror>
      {/* back collar */}
      <path d="M170 28 L230 28 L226 14 L174 14 Z" className="ink cloth2" />
      {/* centre-back seam */}
      <path d="M200 28 L200 284" className="ctx" />
      {children}
    </g>
  );
}

export function VentsDouble() {
  return (
    <BackBody>
      <Mirror>
        <path d="M146 284 L146 190 L162 190 L162 284" className="ink cloth2" />
        <path d="M146 190 L162 190" className="ink" />
      </Mirror>
    </BackBody>
  );
}

export function VentSingle() {
  return (
    <BackBody>
      <path d="M200 284 L200 188 L216 188 L216 284" className="ink cloth2" />
      <path d="M200 188 L216 188" className="ink" />
    </BackBody>
  );
}

/* ── Lining coverage (interior diagram) ──────────────────────────────────── */

function LiningFrame({ children, bound }: { children?: ReactNode; bound?: boolean }) {
  return (
    <g>
      <Mirror>
        <path d={SILHOUETTE_HALF} className="ink cloth" />
        {children}
        {/* front facing strip — always plain cloth */}
        <path d="M226 28 L226 284" className="ctx" />
        <path d="M304 46 C296 70 290 100 292 122" className="ctx" />
        {bound ? (
          <g>
            <path d="M232 40 L298 52 C294 74 288 104 288 124 C278 172 272 222 278 276 L228 276" className="ctx bound" />
            <path d="M306 54 C322 64 336 124 340 250 L314 256 C308 200 300 160 296 128" className="ctx bound" />
          </g>
        ) : null}
      </Mirror>
    </g>
  );
}

const BODY_FULL = 'M229 40 L299 52 C295 72 289 102 289 124 C278 172 272 222 279 276 L229 276 Z';
const BODY_PARTIAL = 'M229 40 L299 52 C295 72 289 102 289 124 L284 156 L229 156 Z';
const SLEEVE = 'M307 54 C322 64 336 124 340 250 L314 256 C308 200 300 160 296 128 C300 100 304 76 307 54 Z';

export function LiningFull() {
  return (
    <LiningFrame>
      <path d={BODY_FULL} className="lining ink-thin" />
      <path d={SLEEVE} className="lining ink-thin" />
    </LiningFrame>
  );
}

export function LiningPartial() {
  return (
    <LiningFrame>
      <path d={BODY_PARTIAL} className="lining ink-thin" />
      <path d={SLEEVE} className="lining ink-thin" />
      <path d="M229 156 L284 156 M229 276 L279 276" className="ctx bound" />
    </LiningFrame>
  );
}

export function LiningNone() {
  return <LiningFrame bound />;
}

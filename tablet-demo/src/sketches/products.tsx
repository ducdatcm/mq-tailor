import { Mirror } from './common';
import { ClosureSB2 } from './jacket';

/* Product-level illustrations for the start screen (not tied to any option). */

function Legs() {
  return (
    <g>
      <Mirror>
        <path d="M200 160 L150 160 L144 296 L196 296 Z" className="ink cloth" />
        <path d="M172 166 L170 296" className="ctx crease" />
      </Mirror>
    </g>
  );
}

export function ProductSuit() {
  return (
    <g>
      <Legs />
      <g transform="translate(76 2) scale(0.62)">
        <ClosureSB2 />
      </g>
    </g>
  );
}

export function ProductBlazer() {
  return (
    <g transform="translate(40 -4) scale(0.92)">
      <ClosureSB2 />
      {/* patch pockets set this apart from the suit jacket */}
      <Mirror>
        <path d="M228 198 L272 198 L272 240 Q272 244 268 244 L232 244 Q228 244 228 240 Z" className="ink cloth2" />
      </Mirror>
    </g>
  );
}

export function ProductTrousers() {
  return (
    <g>
      <path d="M146 10 L254 10 L262 290 L214 290 L200 112 L186 290 L138 290 Z" className="ink cloth" />
      <path d="M146 10 L254 10 L254 28 L146 28 Z" className="ink cloth2" />
      <path d="M200 28 L200 112" className="ctx" />
      <path d="M166 34 L160 290 M234 34 L240 290" className="ctx crease" />
      <path d="M224 28 Q244 46 258 74" className="ctx" />
      <path d="M176 28 Q156 46 142 74" className="ctx" />
    </g>
  );
}

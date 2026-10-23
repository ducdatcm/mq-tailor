import { Button, Mirror, Scale } from './common';
import { JacketOnly, ProductBlazerDrawing } from './photos';

/* Product-level illustrations for the start screen (not tied to any option). */

const LEGS = 'M144 60 C140 130 136 220 130 296 L190 296 L200 130 L210 296 L270 296 C264 220 260 130 256 60 Z';

function Trousers() {
  return (
    <g>
      <path d={LEGS} className="paper ink" />
      <path d="M144 60 L256 60 L256 78 L144 78 Z" className="paper ink" />
      <path d="M200 78 L200 130" className="line" />
      <Button cx={210} cy={69} r={4} />
      <path d="M164 82 L158 296 M236 82 L242 296" className="crease" />
      <Mirror>
        <path d="M168 82 Q148 104 138 138" className="line" />
        {[152, 176].map((x) => (
          <path key={x} d={`M${x - 3} 52 L${x + 3} 52 L${x + 3} 86 L${x - 3} 86 Z`} className="paper line" />
        ))}
      </Mirror>
    </g>
  );
}

/** The suit: the supplied jacket drawing over a pair of trouser legs. */
export function ProductSuit() {
  return (
    <g>
      <Scale k={1 / 0.62} transform="translate(76 113) scale(0.62)">
        <Trousers />
      </Scale>
      <Scale k={1} transform="translate(64 -2) scale(0.68)">
        <JacketOnly />
      </Scale>
    </g>
  );
}

export const ProductBlazer = ProductBlazerDrawing;

export function ProductTrousers() {
  return (
    <Scale k={1 / 1.08} transform="translate(-16 -44) scale(1.08)">
      <Trousers />
    </Scale>
  );
}

import type { GarmentSelections, OptionId, ProductId } from '../catalog/catalog';
import { OPTION_SKETCHES, PRODUCT_SKETCHES } from './registry';

interface Props {
  option?: OptionId;
  product?: ProductId;
  className?: string;
  /** Accessible name. Omit when a visible label already names the drawing. */
  title?: string;
  /** The choices made so far on the same piece: a few drawings follow another choice (registry SKETCH_FOLLOWS). */
  chosen?: GarmentSelections;
}

/** Renders the drawing for an option or product in the shared 400×300 frame. */
export function Sketch({ option, product, className, title, chosen }: Props) {
  const Drawing = option ? OPTION_SKETCHES[option] : product ? PRODUCT_SKETCHES[product] : null;
  if (!Drawing) return null;
  return (
    <svg
      className={`sk ${className ?? ''}`}
      viewBox="0 0 400 300"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <Drawing chosen={chosen} />
    </svg>
  );
}

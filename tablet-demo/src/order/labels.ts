import { ALL_PRODUCT_IDS, type Quantities, type Unit } from '../catalog/catalog';
import type { Copy } from '../content/copy';

/** "Quần 2" when the order holds several of the kind, plain "Quần" when there is only one. */
export function unitName(t: Copy, unit: Unit, units: readonly Unit[]): string {
  const kind = t.garments[unit.garment];
  return unit.garment !== 'trims' && units.filter((u) => u.garment === unit.garment).length > 1 ? `${kind} ${unit.n}` : kind;
}

/** What the order holds, product by product: "Suit hai mảnh × 1 · Quần tây × 2". */
export function productList(t: Copy, q: Quantities): string {
  return ALL_PRODUCT_IDS.filter((p) => (q[p] ?? 0) > 0)
    .map((p) => `${t.products[p].name} × ${q[p]}`)
    .join(' · ');
}

/** For labels that must tell units apart ("Quần 2 · Gấu quần"); empty when the order holds only one of the kind. */
export function unitPrefix(t: Copy, unit: Unit, units: readonly Unit[]): string {
  return unit.garment !== 'trims' && units.filter((u) => u.garment === unit.garment).length > 1 ? `${unitName(t, unit, units)} · ` : '';
}

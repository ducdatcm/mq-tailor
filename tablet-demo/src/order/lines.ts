import { groupsFor, type PieceKind, type Quantities, type Unit } from '../catalog/catalog';
import { ALL_PRODUCT_IDS } from '../catalog/catalog';
import type { Selections } from '../catalog/rules';

/** One line of the order: a kind of piece with one design, and how many of it are made. */
export interface OrderLine {
  item: PieceKind;
  quantity: number;
  /** The units that share this design; the first one is where the design is read from. */
  units: string[];
}

/** The pieces an order is made of, summed over its products (1 suit + 2 trousers = 1 jacket and 3 trousers). */
export function piecesOf(units: readonly Unit[]): { item: PieceKind; quantity: number }[] {
  const counts = new Map<PieceKind, number>();
  for (const u of units) if (u.garment !== 'trims') counts.set(u.garment, (counts.get(u.garment) ?? 0) + 1);
  return [...counts].map(([item, quantity]) => ({ item, quantity }));
}

/** How the choices of a unit read as one string, to tell whether two units were designed the same. */
function designKey(unit: Unit, s: Selections): string {
  const chosen = s[unit.id] ?? {};
  return unit.garment + '|' + groupsFor(unit.garment, chosen).map((g) => `${g.id}=${chosen[g.id] ?? ''}`).join(',');
}

/**
 * The lines to write for an order: one per kind of piece and design. Units of the same kind that were
 * designed exactly the same are one line with their count (two identical pairs of trousers: "Quần, 2");
 * units designed differently are separate lines, each with its own count. The trims are not a piece:
 * they apply to every line.
 */
export function orderLines(units: readonly Unit[], selections: Selections): OrderLine[] {
  const lines: OrderLine[] = [];
  const byKey = new Map<string, OrderLine>();
  for (const unit of units) {
    if (unit.garment === 'trims') continue;
    const key = designKey(unit, selections);
    const found = byKey.get(key);
    if (found) {
      found.quantity += 1;
      found.units.push(unit.id);
    } else {
      const line: OrderLine = { item: unit.garment, quantity: 1, units: [unit.id] };
      byKey.set(key, line);
      lines.push(line);
    }
  }
  return lines;
}

/** The products of an order in display order, each with its count: "Suit hai mảnh × 1". */
export function productCounts(q: Quantities): { product: (typeof ALL_PRODUCT_IDS)[number]; quantity: number }[] {
  return ALL_PRODUCT_IDS.filter((p) => (q[p] ?? 0) > 0).map((product) => ({ product, quantity: q[product]! }));
}

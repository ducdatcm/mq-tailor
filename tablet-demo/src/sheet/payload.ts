import { groupsFor } from '../catalog/catalog';
import { vi } from '../content/vi';
import { formatDateTime } from '../order/format';
import { productList } from '../order/labels';
import { orderLines } from '../order/lines';
import type { OrderRecord, Snapshot } from '../state/types';

/** One line of an order: one kind of piece with one design, and how many of it. */
export interface SheetRow {
  /** The kind of piece: Áo, Quần, Gile or Sơ mi (the "Sản phẩm" column). */
  item: string;
  /** The "Số lượng" column. */
  quantity: number;
  /** One column per design group: group name -> chosen option. */
  design: Record<string, string>;
}

/** One order, as sent to the spreadsheet. Column names and values are always in Vietnamese. */
export interface SheetPayload {
  submissionId: string;
  token?: string;
  /** Fixed columns, the same on every line of the order. */
  date: string;
  orderId: string;
  customerName: string;
  phone: string;
  revision: number;
  /** What the order holds, product by product (for reading; the lines below are what is written). */
  products: string;
  /** The lines to add: pieces designed the same are one line with their count. */
  rows: SheetRow[];
}

export function buildPayload(order: OrderRecord, snap: Snapshot, token = ''): SheetPayload {
  const trims = snap.units.find((u) => u.garment === 'trims');
  const rows = orderLines(snap.units, snap.selections).map<SheetRow>((line) => {
    const design: Record<string, string> = {};
    const unit = snap.units.find((u) => u.id === line.units[0])!;
    const chosenOn = (id: string, garment: typeof unit.garment) => {
      const chosen = snap.selections[id] ?? {};
      for (const g of groupsFor(garment, chosen)) {
        const option = chosen[g.id];
        design[vi.groups[g.id].name] = option ? vi.options[option].label : '';
      }
    };
    chosenOn(unit.id, unit.garment);
    // The buttons and buttonholes are chosen once and apply to every piece of the order.
    if (trims) chosenOn(trims.id, 'trims');
    return { item: vi.garments[line.item], quantity: line.quantity, design };
  });
  return {
    submissionId: order.submissionId,
    ...(token ? { token } : {}),
    date: formatDateTime(order.confirmedAt),
    orderId: order.orderId,
    customerName: order.customerName,
    phone: order.phone,
    revision: order.revision,
    products: productList(vi, snap.quantities),
    rows,
  };
}

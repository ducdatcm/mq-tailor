import { groupsFor, type BaseGarmentId } from '../catalog/catalog';
import { vi } from '../content/vi';
import { formatDateTime } from '../order/format';
import { productList } from '../order/labels';
import { orderLines } from '../order/lines';
import type { OrderRecord, Snapshot } from '../state/types';

/**
 * The spreadsheet groups its design columns under one band per kind of piece, in this order:
 * ÁO › GILE › QUẦN › SƠ MI › NGUYÊN PHỤ LIỆU (buttons and buttonholes of the tailored pieces).
 * A column is named by its band and its own name, so the jacket's "Túi ngực" and the shirt's "Túi ngực"
 * are two columns.
 */
export const SHEET_SECTION_ORDER: readonly BaseGarmentId[] = ['jacket', 'waistcoat', 'trousers', 'shirt', 'trims'];

/** The band a kind of piece is written under ("ÁO", "SƠ MI", "NGUYÊN PHỤ LIỆU"...). */
export const sectionName = (garment: BaseGarmentId) => vi.garments[garment].toUpperCase();

/** The key of one design column: its band and its name. */
export const cellKey = (section: string, column: string) => `${section}|${column}`;

/** One band of design columns. */
export interface SheetSection {
  name: string;
  columns: string[];
}

/** Every design column the app can fill, band by band (each group once, even when it is hidden). */
export function sheetLayout(): SheetSection[] {
  return SHEET_SECTION_ORDER.map((garment) => ({
    name: sectionName(garment),
    columns: groupsFor(garment).map((g) => vi.groups[g.id].name),
  }));
}

/** One line of an order: one kind of piece with one design, and how many of it. */
export interface SheetRow {
  /** The kind of piece: Áo, Quần, Gile or Sơ mi (the "Sản phẩm" column). */
  item: string;
  /** The band its design is written under. */
  section: string;
  /** The "Số lượng" column. */
  quantity: number;
  /** The design, by column key (band|name): what Code.gs v4 writes. */
  cells: Record<string, string>;
  /** The design by group name only, as Code.gs v3 read it (kept so an older script still takes the order). */
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
  /** The sale's note: special requests (the "Ghi chú" column, on every line of the order). */
  note: string;
  revision: number;
  /** What the order holds, product by product (for reading; the lines below are what is written). */
  products: string;
  /** The design columns, band by band, so the sheet can lay out every column in order on its first order. */
  layout: SheetSection[];
  /** The lines to add: pieces designed the same are one line with their count. */
  rows: SheetRow[];
}

export function buildPayload(order: OrderRecord, snap: Snapshot, token = ''): SheetPayload {
  const trims = snap.units.find((u) => u.garment === 'trims');
  const rows = orderLines(snap.units, snap.selections).map<SheetRow>((line) => {
    const design: Record<string, string> = {};
    const cells: Record<string, string> = {};
    const unit = snap.units.find((u) => u.id === line.units[0])!;
    const chosenOn = (id: string, garment: BaseGarmentId) => {
      const chosen = snap.selections[id] ?? {};
      for (const g of groupsFor(garment, chosen)) {
        const option = chosen[g.id];
        const value = option ? vi.options[option].label : '';
        design[vi.groups[g.id].name] = value;
        cells[cellKey(sectionName(garment), vi.groups[g.id].name)] = value;
      }
    };
    chosenOn(unit.id, unit.garment);
    // The buttons and buttonholes are chosen once and apply to every tailored piece of the order (a shirt
    // has none of them).
    if (trims && unit.garment !== 'shirt') chosenOn(trims.id, 'trims');
    return { item: vi.garments[line.item], section: sectionName(unit.garment), quantity: line.quantity, cells, design };
  });
  return {
    submissionId: order.submissionId,
    ...(token ? { token } : {}),
    date: formatDateTime(order.confirmedAt),
    orderId: order.orderId,
    customerName: order.customerName,
    phone: order.phone,
    note: order.note ?? '',
    revision: order.revision,
    products: productList(vi, snap.quantities),
    layout: sheetLayout(),
    rows,
  };
}

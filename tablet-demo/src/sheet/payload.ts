import { PRODUCTS, groupsFor } from '../catalog/catalog';
import { vi } from '../content/vi';
import { formatDateTime } from '../order/format';
import type { OrderRecord, Snapshot } from '../state/types';

/** One order, as sent to the spreadsheet. Column names and values are always in Vietnamese. */
export interface SheetPayload {
  submissionId: string;
  token?: string;
  /** Fixed columns. */
  date: string;
  orderId: string;
  customerName: string;
  phone: string;
  product: string;
  revision: number;
  /** One column per design group: group name -> chosen option. */
  design: Record<string, string>;
}

export function buildPayload(order: OrderRecord, snap: Snapshot, token = ''): SheetPayload {
  const design: Record<string, string> = {};
  PRODUCTS[snap.product].garments.forEach((garment) => {
    groupsFor(garment).forEach((g) => {
      const chosen = snap.selections[garment][g.id];
      // The second pair of trousers repeats the trousers groups, so its columns carry the garment name.
      const column = garment === 'trousers2' ? `${vi.garments[snap.product].trousers2} · ${vi.groups[g.id].name}` : vi.groups[g.id].name;
      design[column] = chosen ? vi.options[chosen].label : '';
    });
  });
  return {
    submissionId: order.submissionId,
    ...(token ? { token } : {}),
    date: formatDateTime(order.confirmedAt),
    orderId: order.orderId,
    customerName: order.customerName,
    phone: order.phone,
    product: vi.products[snap.product].name,
    revision: order.revision,
    design,
  };
}

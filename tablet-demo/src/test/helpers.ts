import { unitsFor, type ProductId, type Quantities } from '../catalog/catalog';
import { presetSelections, relevantSelections } from '../catalog/rules';
import { initialState, reducer } from '../state/reducer';
import type { Action, OrderRecord, Snapshot, State } from '../state/types';

export const run = (state: State, ...actions: Action[]) => actions.reduce(reducer, state);

/** An order: a product on its own (one of it), or how many of each. */
export type OrderSpec = ProductId | Quantities;
export const quantitiesOf = (order: OrderSpec): Quantities => (typeof order === 'string' ? { [order]: 1 } : order);

/** A session started from the start screen, for the given order. */
export const started = (order: OrderSpec, mode: 'manual' | 'preset' = 'manual'): State => {
  const q = quantitiesOf(order);
  const setQuantities = (Object.keys(q) as ProductId[]).map((product): Action => ({ type: 'setQuantity', product, value: q[product]! }));
  return run(initialState(), ...setQuantities, { type: 'chooseMode', mode }, { type: 'start' });
};

/** A confirmed design snapshot for an order, filled with the house suggestion. */
export const snapshotOf = (order: OrderSpec, revision = 1): Snapshot => {
  const quantities = quantitiesOf(order);
  const units = unitsFor(quantities);
  return {
    revision,
    confirmedAt: new Date(2026, 9, 30, 10, 0).getTime(),
    quantities,
    units,
    selections: relevantSelections(units, presetSelections(units)),
    previousSelections: null,
  };
};

export const orderRecord = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  orderId: 'MQ-9',
  customerName: 'Trần Thị B',
  phone: '0987654321',
  revision: 1,
  confirmedAt: new Date(2026, 9, 30, 10, 0).getTime(),
  submissionId: 'sub-9',
  ...overrides,
});

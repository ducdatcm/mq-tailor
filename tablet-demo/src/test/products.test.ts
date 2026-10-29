import { describe, expect, it } from 'vitest';
import { GROUP_BY_ID, PRODUCT_IDS, PRODUCTS, groupsFor, stepsFor, type ProductId } from '../catalog/catalog';
import { missingSteps, presetSelections, relevantSelections } from '../catalog/rules';
import { en } from '../content/en';
import { vi } from '../content/vi';
import { buildPayload } from '../sheet/payload';
import { initialState, reducer } from '../state/reducer';
import type { Action, OrderRecord, Snapshot, State } from '../state/types';

const run = (state: State, ...actions: Action[]) => actions.reduce(reducer, state);

const started = (product: ProductId, mode: 'manual' | 'preset' = 'manual') =>
  run(initialState(), { type: 'chooseProduct', product }, { type: 'chooseMode', mode }, { type: 'start' });

describe('three-piece suits and the waistcoat', () => {
  it('offers six products, each with its own garments', () => {
    expect(PRODUCT_IDS).toEqual(['suit', 'suit3Trousers', 'suit3Waistcoat', 'blazer', 'trousers', 'waistcoat']);
    expect(PRODUCTS.suit3Trousers.garments).toEqual(['jacket', 'trousers', 'trousers2', 'trims']);
    expect(PRODUCTS.suit3Waistcoat.garments).toEqual(['jacket', 'waistcoat', 'trousers', 'trims']);
    expect(PRODUCTS.waistcoat.garments).toEqual(['waistcoat', 'trims']);
  });

  it('every product has a name and a name for each garment in both languages', () => {
    for (const p of PRODUCT_IDS) {
      expect(vi.products[p].name).toBeTruthy();
      expect(en.products[p].name).toBeTruthy();
      for (const g of PRODUCTS[p].garments) {
        expect(vi.garments[p][g]).toBeTruthy();
        expect(en.garments[p][g]).toBeTruthy();
      }
    }
  });

  it('the second trousers have the same groups as the first', () => {
    expect(groupsFor('trousers2')).toEqual(groupsFor('trousers'));
    expect(stepsFor('suit3Trousers')).toHaveLength(8 + 5 + 5 + 2);
    expect(stepsFor('suit3Waistcoat')).toHaveLength(8 + 1 + 5 + 2);
    expect(stepsFor('waistcoat')).toHaveLength(1 + 2);
  });

  it('the waistcoat is one group of four options: single or double-breasted, two or four pockets', () => {
    expect(GROUP_BY_ID.waistcoatStyle.options).toEqual(['waistcoat.sb2', 'waistcoat.sb4', 'waistcoat.db2', 'waistcoat.db4']);
    for (const o of GROUP_BY_ID.waistcoatStyle.options) {
      expect(vi.options[o].label).toBeTruthy();
      expect(en.options[o].label).toBeTruthy();
    }
  });

  it('the house starting suggestion completes every group of the new products', () => {
    for (const p of ['suit3Trousers', 'suit3Waistcoat', 'waistcoat'] as const) {
      expect(missingSteps(p, presetSelections(p))).toHaveLength(0);
      expect(missingSteps(p, started(p, 'preset').selections)).toHaveLength(0);
      expect(missingSteps(p, started(p).selections).length).toBeGreaterThanOrEqual(stepsFor(p).length);
    }
  });

  it('starts a waistcoat session on the waistcoat group', () => {
    expect(started('waistcoat').cursor).toEqual({ garment: 'waistcoat', group: 'waistcoatStyle' });
  });

  it('selects the waistcoat style and refuses an option or group that does not belong to the garment', () => {
    let s = started('suit3Waistcoat');
    s = run(s, { type: 'select', garment: 'waistcoat', group: 'waistcoatStyle', option: 'waistcoat.db4' });
    expect(s.selections.waistcoat.waistcoatStyle).toBe('waistcoat.db4');
    const before = s.selections;
    s = run(s, { type: 'select', garment: 'waistcoat', group: 'pleats', option: 'pleats.two' });
    s = run(s, { type: 'select', garment: 'jacket', group: 'waistcoatStyle', option: 'waistcoat.sb2' });
    s = run(s, { type: 'select', garment: 'waistcoat', group: 'waistcoatStyle', option: 'pleats.two' });
    expect(s.selections).toEqual(before);
  });

  it('keeps a product\'s own garments only when snapshotting', () => {
    const s = started('suit3Waistcoat', 'preset');
    const kept = relevantSelections('suit3Waistcoat', s.selections);
    expect(Object.keys(kept.waistcoat)).toHaveLength(1);
    expect(Object.keys(kept.trims)).toHaveLength(2);
    expect(Object.keys(kept.trousers2)).toHaveLength(0);
  });
});

describe('second trousers: "same as the trousers already chosen"', () => {
  const pick = (s: State, garment: 'trousers' | 'trousers2', group: 'pleats' | 'hem', option: 'pleats.two' | 'pleats.one' | 'pleats.flat' | 'hem.turnUp') =>
    run(s, { type: 'select', garment, group, option });

  it('is off by default and the two pairs are independent', () => {
    let s = started('suit3Trousers');
    expect(s.sameTrousers).toBe(false);
    s = pick(s, 'trousers', 'pleats', 'pleats.two');
    expect(s.selections.trousers.pleats).toBe('pleats.two');
    expect(s.selections.trousers2.pleats).toBeUndefined();
  });

  it('turning it on copies every choice of the first trousers', () => {
    let s = started('suit3Trousers', 'manual');
    s = pick(s, 'trousers', 'pleats', 'pleats.two');
    s = pick(s, 'trousers', 'hem', 'hem.turnUp');
    s = run(s, { type: 'setSameTrousers', value: true });
    expect(s.sameTrousers).toBe(true);
    expect(s.selections.trousers2).toEqual(s.selections.trousers);
    expect(s.selections.trousers2).toEqual({ pleats: 'pleats.two', hem: 'hem.turnUp' });
  });

  it('while on, later changes to the first trousers carry over', () => {
    let s = started('suit3Trousers', 'preset');
    s = run(s, { type: 'setSameTrousers', value: true });
    s = pick(s, 'trousers', 'pleats', 'pleats.one');
    expect(s.selections.trousers2.pleats).toBe('pleats.one');
    expect(s.sameTrousers).toBe(true);
  });

  it('choosing something for the second trousers on their own ends the copying and keeps the rest', () => {
    let s = started('suit3Trousers', 'preset');
    s = pick(run(s, { type: 'setSameTrousers', value: true }), 'trousers', 'pleats', 'pleats.two');
    s = pick(s, 'trousers2', 'pleats', 'pleats.flat');
    expect(s.sameTrousers).toBe(false);
    expect(s.selections.trousers.pleats).toBe('pleats.two');
    expect(s.selections.trousers2.pleats).toBe('pleats.flat');
    expect(s.selections.trousers2.hem).toBe(s.selections.trousers.hem);
    // now independent again
    s = pick(s, 'trousers', 'pleats', 'pleats.one');
    expect(s.selections.trousers2.pleats).toBe('pleats.flat');
  });

  it('turning it off keeps the values already copied', () => {
    let s = started('suit3Trousers', 'preset');
    s = pick(run(s, { type: 'setSameTrousers', value: true }), 'trousers', 'hem', 'hem.turnUp');
    s = run(s, { type: 'setSameTrousers', value: false });
    expect(s.sameTrousers).toBe(false);
    expect(s.selections.trousers2.hem).toBe('hem.turnUp');
  });

  it('does nothing in products without a second trousers, and a new session starts with it off', () => {
    const s = started('suit', 'preset');
    expect(run(s, { type: 'setSameTrousers', value: true })).toBe(s);
    const three = run(started('suit3Trousers'), { type: 'setSameTrousers', value: true }, { type: 'reset' });
    expect(three.sameTrousers).toBe(false);
  });

  it('switching to the second trousers returns to where you left off on them', () => {
    let s = started('suit3Trousers');
    s = run(s, { type: 'switchGarment', garment: 'trousers2' }, { type: 'next' });
    expect(s.cursor).toEqual({ garment: 'trousers2', group: 'waistband' });
    s = run(s, { type: 'switchGarment', garment: 'trousers' });
    expect(s.cursor).toEqual({ garment: 'trousers', group: 'pleats' });
    s = run(s, { type: 'switchGarment', garment: 'trousers2' });
    expect(s.cursor).toEqual({ garment: 'trousers2', group: 'waistband' });
  });
});

describe('spreadsheet row for the new products', () => {
  const order: OrderRecord = {
    orderId: 'MQ-9',
    customerName: 'Trần Thị B',
    phone: '0987654321',
    revision: 1,
    confirmedAt: new Date(2026, 9, 27, 10, 0).getTime(),
    submissionId: 'sub-9',
  };
  const snap = (product: ProductId): Snapshot => ({
    revision: 1,
    confirmedAt: order.confirmedAt,
    product,
    selections: relevantSelections(product, presetSelections(product)),
    previousSelections: null,
  });

  it('gives the second trousers their own columns, named after the garment', () => {
    const p = buildPayload(order, snap('suit3Trousers'));
    expect(p.product).toBe('Suit ba mảnh (1 áo + 2 quần)');
    expect(Object.keys(p.design)).toHaveLength(21);
    expect(p.design['Xếp ly trước']).toBe('Không ly');
    expect(p.design['Quần 2 · Xếp ly trước']).toBe('Không ly');
    expect(p.design['Quần 2 · Gấu quần']).toBe('Gấu thường');
  });

  it('adds one column for the waistcoat', () => {
    const p = buildPayload(order, snap('suit3Waistcoat'));
    expect(Object.keys(p.design)).toHaveLength(17);
    expect(p.design['Kiểu gile']).toBe('Một hàng, 2 túi');
    expect(Object.keys(buildPayload(order, snap('waistcoat')).design)).toEqual(['Kiểu gile', 'Loại khuy', 'Khuyết Milan']);
  });
});

import { describe, expect, it } from 'vitest';
import { GROUP_BY_ID, PRODUCT_IDS, PRODUCTS, groupsFor, stepsFor, unitsFor } from '../catalog/catalog';
import { missingSteps, presetSelections, relevantSelections } from '../catalog/rules';
import { en } from '../content/en';
import { vi } from '../content/vi';
import { buildPayload } from '../sheet/payload';
import { orderRecord, run, snapshotOf, started } from './helpers';

describe('products and their pieces', () => {
  it('offers seven products, each with its own pieces', () => {
    expect(PRODUCT_IDS).toEqual(['suit', 'suit3Trousers', 'suit3Waistcoat', 'blazer', 'trousers', 'waistcoat']);
    expect(PRODUCTS.suit3Trousers.pieces).toEqual(['jacket', 'trousers', 'trousers']);
    expect(PRODUCTS.suit3Waistcoat.pieces).toEqual(['jacket', 'waistcoat', 'trousers']);
    expect(PRODUCTS.waistcoat.pieces).toEqual(['waistcoat']);
  });

  it('every product has a name, and every kind of piece a name, in both languages', () => {
    for (const p of PRODUCT_IDS) {
      expect(vi.products[p].name).toBeTruthy();
      expect(en.products[p].name).toBeTruthy();
    }
    for (const kind of ['jacket', 'trousers', 'waistcoat', 'shirt', 'trims'] as const) {
      expect(vi.garments[kind]).toBeTruthy();
      expect(en.garments[kind]).toBeTruthy();
    }
  });

  it('a three-piece suit with two trousers has two units of trousers with the same groups', () => {
    const units = unitsFor({ suit3Trousers: 1 });
    expect(units.map((u) => u.id)).toEqual(['jacket1', 'trousers1', 'trousers2', 'trims']);
    expect(stepsFor(units)).toHaveLength(8 + 5 + 5 + 2);
    expect(stepsFor(unitsFor({ suit3Waistcoat: 1 }))).toHaveLength(8 + 1 + 5 + 2);
    expect(stepsFor(unitsFor({ waistcoat: 1 }))).toHaveLength(1 + 2);
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
      const units = unitsFor({ [p]: 1 });
      expect(missingSteps(units, presetSelections(units))).toHaveLength(0);
      const preset = started(p, 'preset');
      expect(missingSteps(preset.units, preset.selections)).toHaveLength(0);
      const manual = started(p);
      expect(missingSteps(manual.units, manual.selections).length).toBeGreaterThanOrEqual(stepsFor(manual.units).length);
    }
  });

  it('starts a waistcoat session on the waistcoat group', () => {
    expect(started('waistcoat').cursor).toEqual({ unit: 'waistcoat1', group: 'waistcoatStyle' });
  });

  it('selects the waistcoat style and refuses an option or group that does not belong to the piece', () => {
    let s = started('suit3Waistcoat');
    s = run(s, { type: 'select', unit: 'waistcoat1', group: 'waistcoatStyle', option: 'waistcoat.db4' });
    expect(s.selections.waistcoat1.waistcoatStyle).toBe('waistcoat.db4');
    const before = s.selections;
    s = run(s, { type: 'select', unit: 'waistcoat1', group: 'pleats', option: 'pleats.two' });
    s = run(s, { type: 'select', unit: 'jacket1', group: 'waistcoatStyle', option: 'waistcoat.sb2' });
    s = run(s, { type: 'select', unit: 'waistcoat1', group: 'waistcoatStyle', option: 'pleats.two' });
    expect(s.selections).toEqual(before);
  });

  it("keeps only the order's own units when snapshotting", () => {
    const s = started('suit3Waistcoat', 'preset');
    const kept = relevantSelections(s.units, s.selections);
    expect(Object.keys(kept).sort()).toEqual(['jacket1', 'trims', 'trousers1', 'waistcoat1']);
    expect(Object.keys(kept.waistcoat1)).toHaveLength(1);
    expect(Object.keys(kept.trims)).toHaveLength(2);
  });
});

describe('spreadsheet lines for the new products', () => {
  const order = orderRecord();

  it('writes two pairs of trousers made the same as one line of two', () => {
    const p = buildPayload(order, snapshotOf('suit3Trousers'));
    expect(p.products).toBe('Suit ba mảnh (1 áo + 2 quần) × 1');
    expect(p.rows.map((r) => [r.item, r.quantity])).toEqual([
      ['Áo', 1],
      ['Quần', 2],
    ]);
    expect(p.rows[1].design['Xếp ly trước']).toBe('Không ly');
    expect(p.rows[1].design['Gấu quần']).toBe('Gấu thường');
  });

  it('writes two pairs of trousers made differently as two lines, one per design', () => {
    const s = snapshotOf('suit3Trousers');
    s.selections.trousers2.hem = 'hem.turnUp';
    const p = buildPayload(order, s);
    expect(p.rows.map((r) => [r.item, r.quantity])).toEqual([
      ['Áo', 1],
      ['Quần', 1],
      ['Quần', 1],
    ]);
    expect(p.rows[1].design['Gấu quần']).toBe('Gấu thường');
    expect(p.rows[2].design['Gấu quần']).toBe('Gấu lơ vê');
  });

  it('adds a line for the waistcoat', () => {
    const p = buildPayload(order, snapshotOf('suit3Waistcoat'));
    expect(p.rows.map((r) => r.item)).toEqual(['Áo', 'Gile', 'Quần']);
    expect(p.rows[1].design['Kiểu gile']).toBe('Một hàng, 2 túi');
    expect(Object.keys(p.rows[1].design)).toEqual(['Kiểu gile', 'Loại khuy', 'Khuyết Milan']);
    expect(buildPayload(order, snapshotOf('waistcoat')).rows).toHaveLength(1);
  });

  it('groups come out in the same order for every piece', () => {
    expect(groupsFor('trousers').map((g) => g.id)).toEqual(['pleats', 'waistband', 'frontPockets', 'backPockets', 'hem']);
  });
});

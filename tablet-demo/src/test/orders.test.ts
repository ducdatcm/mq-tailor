import { describe, expect, it } from 'vitest';
import { ALL_PRODUCT_IDS, GROUP_BY_ID, MAX_QUANTITY, PRODUCT_IDS, PRODUCTS, groupsFor, stepsFor, totalQuantity, unitsFor } from '../catalog/catalog';
import { copyableUnits, countSelected, missingSteps, presetSelections, relevantSelections, selectionsEqual } from '../catalog/rules';
import { en } from '../content/en';
import { vi } from '../content/vi';
import { productList } from '../order/labels';
import { orderLines, piecesOf } from '../order/lines';
import { buildPayload } from '../sheet/payload';
import { OPTION_SKETCHES } from '../sketches/registry';
import { initialState, reducer } from '../state/reducer';
import { orderRecord, run, snapshotOf, started } from './helpers';

describe('an order of several products', () => {
  it('starts empty, with nothing to design', () => {
    expect(initialState().quantities).toEqual({});
    expect(unitsFor({})).toEqual([]);
    expect(run(initialState(), { type: 'start' }).screen).toBe('start');
  });

  it('sets the quantity of each product on the start screen, between 0 and the maximum', () => {
    const at = (value: number) => reducer(initialState(), { type: 'setQuantity', product: 'suit', value }).quantities;
    expect(at(2)).toEqual({ suit: 2 });
    expect(at(2.6)).toEqual({ suit: 3 });
    expect(at(0)).toEqual({});
    expect(at(-4)).toEqual({});
    expect(at(Number.NaN)).toEqual({});
    expect(at(1000)).toEqual({ suit: MAX_QUANTITY });
    const two = run(initialState(), { type: 'setQuantity', product: 'suit', value: 1 }, { type: 'setQuantity', product: 'trousers', value: 2 });
    expect(two.quantities).toEqual({ suit: 1, trousers: 2 });
    expect(totalQuantity(two.quantities)).toBe(3);
    expect(run(two, { type: 'setQuantity', product: 'suit', value: 0 }).quantities).toEqual({ trousers: 2 });
  });

  it('cannot be changed once the design has started', () => {
    const s = started({ suit: 1, trousers: 2 }, 'preset');
    expect(reducer(s, { type: 'setQuantity', product: 'suit', value: 5 })).toBe(s);
  });

  it('numbers the pieces of a kind through the whole order: 1 suit and 2 trousers make trousers 1, 2 and 3', () => {
    const units = unitsFor({ suit: 1, trousers: 2 });
    expect(units.map((u) => u.id)).toEqual(['jacket1', 'trousers1', 'trousers2', 'trousers3', 'trims']);
    expect(units.filter((u) => u.garment === 'trousers').map((u) => [u.n, u.product, u.copy])).toEqual([
      [1, 'suit', 1],
      [2, 'trousers', 1],
      [3, 'trousers', 2],
    ]);
  });

  it('2 suits, 2 blazers and 2 trousers: every piece is designed', () => {
    const units = unitsFor({ suit: 2, blazer: 2, trousers: 2 });
    expect(units.map((u) => u.id)).toEqual(['jacket1', 'trousers1', 'jacket2', 'trousers2', 'jacket3', 'jacket4', 'trousers3', 'trousers4', 'trims']);
    expect(piecesOf(units)).toEqual([
      { item: 'jacket', quantity: 4 },
      { item: 'trousers', quantity: 4 },
    ]);
  });

  it('the trims are chosen once for the whole order', () => {
    expect(unitsFor({ suit: 3 }).filter((u) => u.garment === 'trims')).toHaveLength(1);
    expect(stepsFor(unitsFor({ suit: 2 }))).toHaveLength(2 * (8 + 5) + 2);
  });

  it('says what the order holds, product by product', () => {
    expect(productList(vi, { trousers: 2, suit: 1 })).toBe('Suit hai mảnh × 1 · Quần tây × 2');
    expect(productList(en, { shirt: 3 })).toBe('Shirt × 3');
  });
});

describe('"same as the one already chosen"', () => {
  const order = { suit: 1, trousers: 2 };
  const pick = (s: ReturnType<typeof started>, unit: string, group: 'pleats' | 'hem', option: 'pleats.two' | 'pleats.one' | 'pleats.flat' | 'hem.turnUp') =>
    run(s, { type: 'select', unit, group, option });

  it('only a piece after the first of its kind can copy, and only an earlier one', () => {
    const units = unitsFor(order);
    const trousers = units.filter((u) => u.garment === 'trousers');
    expect(copyableUnits(units, trousers[0])).toEqual([]);
    expect(copyableUnits(units, trousers[1]).map((u) => u.id)).toEqual(['trousers1']);
    expect(copyableUnits(units, trousers[2]).map((u) => u.id)).toEqual(['trousers1', 'trousers2']);
    expect(copyableUnits(units, units[0])).toEqual([]); // the one jacket
  });

  it('is off by default and the pieces are independent', () => {
    let s = started(order);
    expect(s.sameAs).toEqual({});
    s = pick(s, 'trousers1', 'pleats', 'pleats.two');
    expect(s.selections.trousers1.pleats).toBe('pleats.two');
    expect(s.selections.trousers2.pleats).toBeUndefined();
  });

  it('choosing "same as trousers 1" for trousers 2 and 3 copies every choice', () => {
    let s = started(order);
    s = pick(s, 'trousers1', 'pleats', 'pleats.two');
    s = pick(s, 'trousers1', 'hem', 'hem.turnUp');
    s = run(s, { type: 'setSameAs', unit: 'trousers2', source: 'trousers1' }, { type: 'setSameAs', unit: 'trousers3', source: 'trousers1' });
    expect(s.selections.trousers2).toEqual({ pleats: 'pleats.two', hem: 'hem.turnUp' });
    expect(s.selections.trousers3).toEqual(s.selections.trousers1);
  });

  it('while on, later changes to the copied piece carry over', () => {
    let s = started(order, 'preset');
    s = run(s, { type: 'setSameAs', unit: 'trousers2', source: 'trousers1' }, { type: 'setSameAs', unit: 'trousers3', source: 'trousers2' });
    s = pick(s, 'trousers1', 'pleats', 'pleats.one');
    expect(s.selections.trousers2.pleats).toBe('pleats.one');
    expect(s.selections.trousers3.pleats).toBe('pleats.one'); // a chain of copies stays in step
    expect(s.sameAs).toEqual({ trousers2: 'trousers1', trousers3: 'trousers2' });
  });

  it('choosing something on a copying piece ends its copying and keeps the rest', () => {
    let s = started(order, 'preset');
    s = run(s, { type: 'setSameAs', unit: 'trousers2', source: 'trousers1' });
    s = pick(s, 'trousers1', 'pleats', 'pleats.two');
    s = pick(s, 'trousers2', 'pleats', 'pleats.flat');
    expect(s.sameAs.trousers2).toBeNull();
    expect(s.selections.trousers1.pleats).toBe('pleats.two');
    expect(s.selections.trousers2.pleats).toBe('pleats.flat');
    expect(s.selections.trousers2.hem).toBe(s.selections.trousers1.hem);
    // independent again
    s = pick(s, 'trousers1', 'pleats', 'pleats.one');
    expect(s.selections.trousers2.pleats).toBe('pleats.flat');
  });

  it('a piece can copy a different earlier piece, and "choose separately" keeps what was copied', () => {
    let s = started(order, 'preset');
    s = pick(pick(s, 'trousers1', 'hem', 'hem.turnUp'), 'trousers2', 'pleats', 'pleats.two');
    s = run(s, { type: 'setSameAs', unit: 'trousers3', source: 'trousers2' });
    expect(s.selections.trousers3.pleats).toBe('pleats.two');
    expect(s.selections.trousers3.hem).toBe('hem.plain');
    s = run(s, { type: 'setSameAs', unit: 'trousers3', source: 'trousers1' });
    expect(s.selections.trousers3.hem).toBe('hem.turnUp');
    s = run(s, { type: 'setSameAs', unit: 'trousers3', source: null });
    expect(s.sameAs.trousers3).toBeNull();
    expect(s.selections.trousers3.hem).toBe('hem.turnUp');
  });

  it('works the same for jackets: 2 blazers can copy each other, and a suit jacket is a jacket too', () => {
    let s = started({ suit: 1, blazer: 2 }, 'preset');
    s = run(s, { type: 'select', unit: 'jacket1', group: 'vents', option: 'vents.none' });
    s = run(s, { type: 'setSameAs', unit: 'jacket3', source: 'jacket1' });
    expect(s.selections.jacket3.vents).toBe('vents.none');
    expect(copyableUnits(s.units, s.units.find((u) => u.id === 'jacket3')!).map((u) => u.id)).toEqual(['jacket1', 'jacket2']);
  });

  it('rejects a source that is not an earlier piece of the same kind', () => {
    const s = started(order, 'preset');
    expect(run(s, { type: 'setSameAs', unit: 'trousers1', source: 'trousers2' })).toBe(s);
    expect(run(s, { type: 'setSameAs', unit: 'trousers2', source: 'jacket1' })).toBe(s);
    expect(run(s, { type: 'setSameAs', unit: 'trousers2', source: 'trousers3' })).toBe(s);
    expect(run(s, { type: 'setSameAs', unit: 'nothing', source: 'trousers1' })).toBe(s);
  });

  it('accepting the lapel change on a copied jacket moves the copies along', () => {
    let s = started({ blazer: 2 });
    s = run(
      s,
      { type: 'select', unit: 'jacket1', group: 'closure', option: 'closure.sb2' },
      { type: 'select', unit: 'jacket1', group: 'lapel', option: 'lapel.notch' },
      { type: 'setSameAs', unit: 'jacket2', source: 'jacket1' },
      { type: 'select', unit: 'jacket1', group: 'closure', option: 'closure.db6x2' },
    );
    s = run(s, { type: 'acceptPending' });
    expect(s.selections.jacket2.closure).toBe('closure.db6x2');
    expect(s.selections.jacket2.lapel).toBe('lapel.peak');
  });

  it('a new session starts without any copying', () => {
    const s = run(started(order, 'preset'), { type: 'setSameAs', unit: 'trousers2', source: 'trousers1' }, { type: 'reset' });
    expect(s.sameAs).toEqual({});
  });

  it('switching to a piece returns to where you left off on it', () => {
    let s = started(order);
    s = run(s, { type: 'switchUnit', unit: 'trousers2' }, { type: 'next' });
    expect(s.cursor).toEqual({ unit: 'trousers2', group: 'waistband' });
    s = run(s, { type: 'switchUnit', unit: 'trousers1' });
    expect(s.cursor).toEqual({ unit: 'trousers1', group: 'pleats' });
    s = run(s, { type: 'switchUnit', unit: 'trousers2' });
    expect(s.cursor).toEqual({ unit: 'trousers2', group: 'waistband' });
  });

  it('is part of what a confirmed design remembers about pieces, not a difference of its own', () => {
    const s = run(started(order, 'preset'), { type: 'setSameAs', unit: 'trousers2', source: 'trousers1' }, { type: 'openReview' }, { type: 'confirm', at: 1 });
    expect(s.confirmed?.units).toHaveLength(5);
    expect(selectionsEqual(s.units, s.confirmed!.selections, s.selections)).toBe(true);
  });
});

describe('the lines written to the spreadsheet', () => {
  const rec = orderRecord();

  it('counts what an order holds before any design is chosen', () => {
    expect(piecesOf(unitsFor({ suit3Trousers: 2 }))).toEqual([
      { item: 'jacket', quantity: 2 },
      { item: 'trousers', quantity: 4 },
    ]);
  });

  it('1 suit and 2 trousers all made the same: the jacket, and the trousers as one line of 3', () => {
    const p = buildPayload(rec, snapshotOf({ suit: 1, trousers: 2 }));
    expect(p.products).toBe('Suit hai mảnh × 1 · Quần tây × 2');
    expect(p.rows.map((r) => [r.item, r.quantity])).toEqual([
      ['Áo', 1],
      ['Quần', 3],
    ]);
  });

  it('the same pieces made differently are separate lines, each with its own count', () => {
    const s = snapshotOf({ suit: 1, trousers: 2 });
    s.selections.trousers3.pleats = 'pleats.two';
    const p = buildPayload(rec, s);
    expect(p.rows.map((r) => [r.item, r.quantity, r.design['Xếp ly trước']])).toEqual([
      ['Áo', 1, undefined],
      ['Quần', 2, 'Không ly'],
      ['Quần', 1, 'Hai ly'],
    ]);
  });

  it('2 suits, 2 blazers: the jackets are merged when identical across the products', () => {
    const lines = orderLines(snapshotOf({ suit: 2, blazer: 2 }).units, snapshotOf({ suit: 2, blazer: 2 }).selections);
    expect(lines.map((l) => [l.item, l.quantity])).toEqual([
      ['jacket', 4],
      ['trousers', 2],
    ]);
  });

  it('keeps a piece with its own design apart: a different blazer is a line of its own', () => {
    const s = snapshotOf({ suit: 2, blazer: 2 });
    s.selections.jacket3.vents = 'vents.none';
    const lines = orderLines(s.units, s.selections);
    expect(lines.map((l) => [l.item, l.quantity])).toEqual([
      ['jacket', 3],
      ['trousers', 2],
      ['jacket', 1],
    ]);
  });

  it('every line carries the trims once', () => {
    const rows = buildPayload(rec, snapshotOf({ suit: 1, shirt: 2 })).rows;
    for (const row of rows) {
      expect(Object.keys(row.design).filter((k) => k === 'Loại khuy')).toHaveLength(1);
    }
  });
});

describe('shirt', () => {
  const shirtUnits = unitsFor({ shirt: 1 });
  const shirtId = 'shirt1';

  it('is a product of one shirt, with the trims', () => {
    expect(ALL_PRODUCT_IDS).toContain('shirt');
    expect(PRODUCT_IDS).not.toContain('shirt'); // built but not offered for now
    expect(PRODUCTS.shirt.pieces).toEqual(['shirt']);
    expect(shirtUnits.map((u) => u.id)).toEqual(['shirt1', 'trims']);
    expect(groupsFor('shirt').map((g) => g.id)).toEqual(['sleeve', 'collar', 'chestPocket', 'placket', 'shirtCuffs', 'shirtHem']);
  });

  it('offers the requested options: eight collars (the Cuban collar included; no imperial or Peter Pan), five pockets, four plackets, seven cuffs, two hems', () => {
    expect(GROUP_BY_ID.sleeve.options).toEqual(['sleeve.long', 'sleeve.short']);
    expect(GROUP_BY_ID.collar.options).toHaveLength(8);
    expect(GROUP_BY_ID.collar.options).toContain('collar.cuban');
    expect(GROUP_BY_ID.collar.options.join(' ')).not.toMatch(/imperial|peterPan/i);
    expect(GROUP_BY_ID.chestPocket.options).toEqual(['chestPocket.none', 'chestPocket.angled', 'chestPocket.rounded', 'chestPocket.square', 'chestPocket.flap']);
    expect(GROUP_BY_ID.placket.options).toEqual(['placket.frenchFront', 'placket.coveredFly', 'placket.pleatedTuxedo', 'placket.frontPlacket']);
    expect(GROUP_BY_ID.shirtCuffs.options).toHaveLength(7);
    expect(GROUP_BY_ID.shirtHem.options).toEqual(['shirtHem.sideVents', 'shirtHem.gusset']);
  });

  it('every shirt option has text in both languages, and a picture unless it is a text card', () => {
    for (const g of groupsFor('shirt')) {
      expect(vi.groups[g.id].name).toBeTruthy();
      expect(en.groups[g.id].name).toBeTruthy();
      for (const o of g.options) {
        if (!g.noSketch && o !== 'chestPocket.none') expect(OPTION_SKETCHES[o], o).toBeDefined();
        expect(vi.options[o].label).toBeTruthy();
        expect(en.options[o].label).toBeTruthy();
      }
    }
    expect(vi.products.shirt.name).toBe('Sơ mi');
  });

  it('only the chest pockets have drawings; sleeve, collar, placket, cuffs and hem are text cards', () => {
    expect(GROUP_BY_ID.sleeve.noSketch).toBe(true);
    for (const id of ['collar', 'placket', 'shirtCuffs', 'shirtHem'] as const) expect(GROUP_BY_ID[id].noSketch, id).toBe(true);
    for (const o of GROUP_BY_ID.collar.options) expect(OPTION_SKETCHES[o], o).toBeUndefined();
    expect(OPTION_SKETCHES['shirtHem.gusset']).toBeUndefined();
    expect(OPTION_SKETCHES['shirtHem.sideVents']).toBeUndefined();
    expect(OPTION_SKETCHES['chestPocket.none']).toBeUndefined();
    for (const o of ['chestPocket.angled', 'chestPocket.rounded', 'chestPocket.square', 'chestPocket.flap'] as const) {
      expect(OPTION_SKETCHES[o]).toBeDefined();
    }
  });

  it('the house suggestion fills every step', () => {
    expect(missingSteps(shirtUnits, presetSelections(shirtUnits))).toHaveLength(0);
  });

  it('short sleeves take the cuff step away, long sleeves bring it back', () => {
    const longSel = presetSelections(shirtUnits);
    expect(stepsFor(shirtUnits, longSel).map((s) => s.group)).toContain('shirtCuffs');
    expect(stepsFor(shirtUnits, longSel)).toHaveLength(6 + 2);
    const shortSel = presetSelections(shirtUnits);
    shortSel[shirtId].sleeve = 'sleeve.short';
    expect(stepsFor(shirtUnits, shortSel).map((s) => s.group)).not.toContain('shirtCuffs');
    expect(stepsFor(shirtUnits, shortSel)).toHaveLength(5 + 2);
    expect(missingSteps(shirtUnits, shortSel)).toHaveLength(0);
    expect(countSelected(shirtUnits, shortSel)).toEqual({ done: 7, total: 7 });
    expect(relevantSelections(shirtUnits, shortSel)[shirtId].shirtCuffs).toBeUndefined();
  });

  it('before the sleeve is chosen the cuffs are still asked for', () => {
    const s = started('shirt');
    expect(missingSteps(s.units, s.selections).map((m) => m.group)).toContain('shirtCuffs');
  });

  it('a cuff chosen before switching to short sleeves does not count as a difference', () => {
    const a = presetSelections(shirtUnits);
    a[shirtId].sleeve = 'sleeve.short';
    const b = presetSelections(shirtUnits);
    b[shirtId].sleeve = 'sleeve.short';
    b[shirtId].shirtCuffs = 'shirtCuffs.doubleFrench';
    expect(selectionsEqual(shirtUnits, a, b)).toBe(true);
  });

  it('cannot go to a step that does not apply, and next skips it', () => {
    let s = started('shirt', 'preset');
    s = run(s, { type: 'select', unit: shirtId, group: 'sleeve', option: 'sleeve.short' });
    expect(reducer(s, { type: 'goTo', unit: shirtId, group: 'shirtCuffs' }).cursor.group).not.toBe('shirtCuffs');
    const visited: string[] = [s.cursor.group];
    for (let i = 0; i < 4; i += 1) {
      s = reducer(s, { type: 'next' });
      visited.push(s.cursor.group);
    }
    expect(visited).toEqual(['sleeve', 'collar', 'chestPocket', 'placket', 'shirtHem']);
  });

  it('writes one line: Sơ mi, with its count and only the groups that apply', () => {
    const snap = snapshotOf({ shirt: 2 });
    const p = buildPayload(rec(), snap);
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0]).toMatchObject({ item: 'Sơ mi', quantity: 2 });
    expect(Object.keys(p.rows[0].design)).toEqual(['Chiều dài tay', 'Kiểu cổ áo', 'Túi ngực', 'Nẹp áo', 'Cổ tay áo', 'Gấu áo', 'Loại khuy', 'Khuyết Milan']);
    const short = snapshotOf({ shirt: 1 });
    short.selections.shirt1.sleeve = 'sleeve.short';
    delete short.selections.shirt1.shirtCuffs;
    expect(Object.keys(buildPayload(rec(), short).rows[0].design)).not.toContain('Cổ tay áo');
  });
});

function rec() {
  return orderRecord();
}

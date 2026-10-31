import { describe, expect, it } from 'vitest';
import { GROUP_BY_ID, GROUP_LIST, PRODUCT_IDS, PRODUCTS, groupsFor, stepsFor, unitsFor } from '../catalog/catalog';
import { missingSteps, presetSelections } from '../catalog/rules';
import { en } from '../content/en';
import { vi } from '../content/vi';
import { buildPayload } from '../sheet/payload';
import { OPTION_SKETCHES } from '../sketches/registry';
import { orderRecord, run, snapshotOf, started } from './helpers';

describe('jacket cuffs', () => {
  it('has four button counts, drawn, and a functional / closed choice shared by all of them', () => {
    expect(GROUP_BY_ID.cuffs.options).toEqual(['cuffs.1', 'cuffs.2', 'cuffs.3', 'cuffs.4']);
    expect(GROUP_BY_ID.cuffMode.options).toEqual(['cuffMode.functional', 'cuffMode.closed']);
    expect(GROUP_BY_ID.cuffMode.companionOf).toBe('cuffs');
    for (const o of GROUP_BY_ID.cuffs.options) expect(OPTION_SKETCHES[o]).toBeDefined();
  });

  it('the functional-buttons card says it is recommended for a sport jacket / blazer only', () => {
    expect(vi.options['cuffMode.functional'].desc).toMatch(/sport jacket/i);
    expect(en.options['cuffMode.functional'].desc).toMatch(/sport jacket/i);
  });

  it('the shared choice adds no step of its own, but is still a group to fill in', () => {
    const jacketSteps = stepsFor(unitsFor({ blazer: 1 })).filter((s) => s.unit === 'jacket1');
    expect(jacketSteps.map((s) => s.group)).toContain('cuffs');
    expect(jacketSteps.map((s) => s.group)).not.toContain('cuffMode');
    expect(groupsFor('jacket').map((g) => g.id)).toContain('cuffMode');
    expect(missingSteps(started('blazer').units, started('blazer').selections).map((s) => s.group)).toContain('cuffMode');
  });

  it('opening the shared choice (from the summary or the review) lands on the cuffs screen', () => {
    let s = started('blazer');
    s = run(s, { type: 'goTo', unit: 'jacket1', group: 'cuffMode' });
    expect(s.cursor).toEqual({ unit: 'jacket1', group: 'cuffs' });
    s = run(started('blazer'), { type: 'openReview' }, { type: 'editFromReview', unit: 'jacket1', group: 'cuffMode' });
    expect(s.cursor).toEqual({ unit: 'jacket1', group: 'cuffs' });
    expect(s.lastGroup.jacket1).toBe('cuffs');
  });

  it('choosing a button count and functional / closed are independent', () => {
    let s = started('blazer');
    s = run(s, { type: 'select', unit: 'jacket1', group: 'cuffs', option: 'cuffs.3' });
    s = run(s, { type: 'select', unit: 'jacket1', group: 'cuffMode', option: 'cuffMode.functional' });
    s = run(s, { type: 'select', unit: 'jacket1', group: 'cuffs', option: 'cuffs.2' });
    expect(s.selections.jacket1.cuffs).toBe('cuffs.2');
    expect(s.selections.jacket1.cuffMode).toBe('cuffMode.functional');
  });

  it('stepping forward from the cuffs screen goes to the next group, not to the shared choice', () => {
    let s = started('blazer');
    s = run(s, { type: 'goTo', unit: 'jacket1', group: 'cuffs' }, { type: 'next' });
    expect(s.cursor.group).toBe('lining');
    s = run(s, { type: 'back' });
    expect(s.cursor.group).toBe('cuffs');
  });
});

describe('trims: buttons and buttonholes', () => {
  it('every order ends with the trims, with two groups and no drawings', () => {
    for (const p of PRODUCT_IDS) {
      const units = unitsFor({ [p]: 1 });
      expect(units[units.length - 1].id).toBe('trims');
      expect(PRODUCTS[p].pieces).not.toContain('trims');
    }
    expect(groupsFor('trims').map((g) => g.id)).toEqual(['buttonType', 'milanese']);
    expect(GROUP_BY_ID.buttonType.options).toEqual(['buttonType.plastic', 'buttonType.horn', 'buttonType.motherOfPearl']);
    expect(GROUP_BY_ID.milanese.options).toEqual(['milanese.yes', 'milanese.no']);
  });

  it('only the groups marked noSketch lack drawings, and every other option has one', () => {
    for (const g of GROUP_LIST) {
      for (const o of g.options) {
        if (g.noSketch || o === 'chestPocket.none') expect(OPTION_SKETCHES[o]).toBeUndefined();
        else expect(OPTION_SKETCHES[o], o).toBeDefined();
      }
    }
    expect(GROUP_LIST.filter((g) => g.noSketch).map((g) => g.id)).toEqual(['cuffMode', 'sleeve', 'collar', 'placket', 'shirtCuffs', 'shirtHem', 'buttonType', 'milanese']);
  });

  it('warns about extra charges for horn and mother of pearl in both languages', () => {
    expect(vi.groups.buttonType.note).toMatch(/phụ phí/);
    expect(en.groups.buttonType.note).toMatch(/additional charges/i);
    expect(vi.options['buttonType.horn'].desc).toMatch(/phụ phí/);
    expect(vi.options['buttonType.motherOfPearl'].desc).toMatch(/phụ phí/);
  });

  it('is its own tab, shared by the whole order', () => {
    let s = started({ suit3Trousers: 1, blazer: 2 }, 'preset');
    s = run(s, { type: 'switchUnit', unit: 'trims' });
    expect(s.cursor).toEqual({ unit: 'trims', group: 'buttonType' });
    s = run(s, { type: 'select', unit: 'trims', group: 'buttonType', option: 'buttonType.horn' });
    s = run(s, { type: 'select', unit: 'trims', group: 'milanese', option: 'milanese.yes' });
    expect(s.selections.trims).toEqual({ buttonType: 'buttonType.horn', milanese: 'milanese.yes' });
    // a trims option cannot be put on a piece, nor a piece's option in the trims
    const before = s.selections;
    s = run(s, { type: 'select', unit: 'jacket1', group: 'buttonType', option: 'buttonType.horn' });
    s = run(s, { type: 'select', unit: 'trims', group: 'closure', option: 'closure.sb2' });
    expect(s.selections).toEqual(before);
  });

  it('the house starting suggestion picks standard buttons, no Milanese, closed cuffs with four buttons', () => {
    const units = unitsFor({ blazer: 1 });
    const p = presetSelections(units);
    expect(p.trims).toEqual({ buttonType: 'buttonType.plastic', milanese: 'milanese.no' });
    expect(p.jacket1.cuffs).toBe('cuffs.4');
    expect(p.jacket1.cuffMode).toBe('cuffMode.closed');
    expect(missingSteps(units, p)).toHaveLength(0);
  });
});

describe('spreadsheet columns for cuffs and trims', () => {
  const order = orderRecord({ orderId: 'MQ-5', submissionId: 'sub-5' });
  const snap = (spec: Parameters<typeof snapshotOf>[0]) => {
    const snapshot = snapshotOf(spec);
    for (const unit of snapshot.units) if (unit.garment === 'jacket') snapshot.selections[unit.id].cuffMode = 'cuffMode.functional';
    snapshot.selections.trims.buttonType = 'buttonType.motherOfPearl';
    snapshot.selections.trims.milanese = 'milanese.yes';
    return snapshot;
  };

  it('adds Tay áo, Kiểu khuy tay, Loại khuy and Khuyết Milan', () => {
    const d = buildPayload(order, snap('suit')).rows[0].design;
    expect(d['Tay áo']).toBe('4 khuy');
    expect(d['Kiểu khuy tay']).toBe('Khuy mở');
    expect(d['Loại khuy']).toBe('Khuy xà cừ');
    expect(d['Khuyết Milan']).toBe('Có');
  });

  it('the buttons and buttonholes are on every line of the order, once per line', () => {
    const rows = buildPayload(order, snap('suit3Trousers')).rows;
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) {
      const keys = Object.keys(row.design);
      expect(keys.filter((k) => k === 'Loại khuy')).toHaveLength(1);
      expect(row.design['Loại khuy']).toBe('Khuy xà cừ');
      expect(row.design['Khuyết Milan']).toBe('Có');
    }
  });
});

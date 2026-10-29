import { describe, expect, it } from 'vitest';
import { GROUP_BY_ID, GROUP_LIST, PRODUCT_IDS, PRODUCTS, groupsFor, stepsFor, type ProductId } from '../catalog/catalog';
import { missingSteps, presetSelections, relevantSelections } from '../catalog/rules';
import { en } from '../content/en';
import { vi } from '../content/vi';
import { buildPayload } from '../sheet/payload';
import { OPTION_SKETCHES } from '../sketches/registry';
import { initialState, reducer } from '../state/reducer';
import type { Action, OrderRecord, Snapshot, State } from '../state/types';

const run = (state: State, ...actions: Action[]) => actions.reduce(reducer, state);
const started = (product: ProductId, mode: 'manual' | 'preset' = 'manual') =>
  run(initialState(), { type: 'chooseProduct', product }, { type: 'chooseMode', mode }, { type: 'start' });

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
    const jacketSteps = stepsFor('blazer').filter((s) => s.garment === 'jacket');
    expect(jacketSteps.map((s) => s.group)).toContain('cuffs');
    expect(jacketSteps.map((s) => s.group)).not.toContain('cuffMode');
    expect(groupsFor('jacket').map((g) => g.id)).toContain('cuffMode');
    expect(missingSteps('blazer', started('blazer').selections).map((s) => s.group)).toContain('cuffMode');
  });

  it('opening the shared choice (from the summary or the review) lands on the cuffs screen', () => {
    let s = started('blazer');
    s = run(s, { type: 'goTo', garment: 'jacket', group: 'cuffMode' });
    expect(s.cursor).toEqual({ garment: 'jacket', group: 'cuffs' });
    s = run(started('blazer'), { type: 'openReview' }, { type: 'editFromReview', garment: 'jacket', group: 'cuffMode' });
    expect(s.cursor).toEqual({ garment: 'jacket', group: 'cuffs' });
    expect(s.lastGroup.jacket).toBe('cuffs');
  });

  it('choosing a button count and functional / closed are independent', () => {
    let s = started('blazer');
    s = run(s, { type: 'select', garment: 'jacket', group: 'cuffs', option: 'cuffs.3' });
    s = run(s, { type: 'select', garment: 'jacket', group: 'cuffMode', option: 'cuffMode.functional' });
    s = run(s, { type: 'select', garment: 'jacket', group: 'cuffs', option: 'cuffs.2' });
    expect(s.selections.jacket.cuffs).toBe('cuffs.2');
    expect(s.selections.jacket.cuffMode).toBe('cuffMode.functional');
  });

  it('stepping forward from the cuffs screen goes to the next group, not to the shared choice', () => {
    let s = started('blazer');
    s = run(s, { type: 'goTo', garment: 'jacket', group: 'cuffs' }, { type: 'next' });
    expect(s.cursor.group).toBe('lining');
    s = run(s, { type: 'back' });
    expect(s.cursor.group).toBe('cuffs');
  });
});

describe('trims: buttons and buttonholes', () => {
  it('every product ends with the trims, with two groups and no drawings', () => {
    for (const p of PRODUCT_IDS) {
      const garments = PRODUCTS[p].garments;
      expect(garments[garments.length - 1]).toBe('trims');
    }
    expect(groupsFor('trims').map((g) => g.id)).toEqual(['buttonType', 'milanese']);
    expect(GROUP_BY_ID.buttonType.options).toEqual(['buttonType.plastic', 'buttonType.horn', 'buttonType.motherOfPearl']);
    expect(GROUP_BY_ID.milanese.options).toEqual(['milanese.yes', 'milanese.no']);
  });

  it('only the groups marked noSketch lack drawings, and every other option has one', () => {
    for (const g of GROUP_LIST) {
      for (const o of g.options) {
        if (g.noSketch) expect(OPTION_SKETCHES[o]).toBeUndefined();
        else expect(OPTION_SKETCHES[o], o).toBeDefined();
      }
    }
    expect(GROUP_LIST.filter((g) => g.noSketch).map((g) => g.id)).toEqual(['cuffMode', 'buttonType', 'milanese']);
  });

  it('warns about extra charges for horn and mother of pearl in both languages', () => {
    expect(vi.groups.buttonType.note).toMatch(/phụ phí/);
    expect(en.groups.buttonType.note).toMatch(/additional charges/i);
    expect(vi.options['buttonType.horn'].desc).toMatch(/phụ phí/);
    expect(vi.options['buttonType.motherOfPearl'].desc).toMatch(/phụ phí/);
  });

  it('is its own tab, shared by the whole order', () => {
    let s = started('suit3Trousers', 'preset');
    s = run(s, { type: 'switchGarment', garment: 'trims' });
    expect(s.cursor).toEqual({ garment: 'trims', group: 'buttonType' });
    s = run(s, { type: 'select', garment: 'trims', group: 'buttonType', option: 'buttonType.horn' });
    s = run(s, { type: 'select', garment: 'trims', group: 'milanese', option: 'milanese.yes' });
    expect(s.selections.trims).toEqual({ buttonType: 'buttonType.horn', milanese: 'milanese.yes' });
    // a trims option cannot be put on a garment, nor a garment option in the trims
    const before = s.selections;
    s = run(s, { type: 'select', garment: 'jacket', group: 'buttonType', option: 'buttonType.horn' });
    s = run(s, { type: 'select', garment: 'trims', group: 'closure', option: 'closure.sb2' });
    expect(s.selections).toEqual(before);
  });

  it('the house starting suggestion picks standard buttons, no Milanese, closed cuffs with four buttons', () => {
    const p = presetSelections('blazer');
    expect(p.trims).toEqual({ buttonType: 'buttonType.plastic', milanese: 'milanese.no' });
    expect(p.jacket.cuffs).toBe('cuffs.4');
    expect(p.jacket.cuffMode).toBe('cuffMode.closed');
    expect(missingSteps('blazer', p)).toHaveLength(0);
  });
});

describe('spreadsheet columns for cuffs and trims', () => {
  const order: OrderRecord = {
    orderId: 'MQ-5',
    customerName: 'Lê Văn C',
    phone: '0901234567',
    revision: 1,
    confirmedAt: new Date(2026, 9, 28, 9, 0).getTime(),
    submissionId: 'sub-5',
  };
  const snap = (product: ProductId): Snapshot => {
    const selections = relevantSelections(product, presetSelections(product));
    selections.jacket.cuffMode = 'cuffMode.functional';
    selections.trims.buttonType = 'buttonType.motherOfPearl';
    selections.trims.milanese = 'milanese.yes';
    return { revision: 1, confirmedAt: order.confirmedAt, product, selections, previousSelections: null };
  };

  it('adds Tay áo, Kiểu khuy tay, Loại khuy and Khuyết Milan', () => {
    const d = buildPayload(order, snap('suit')).design;
    expect(d['Tay áo']).toBe('4 khuy');
    expect(d['Kiểu khuy tay']).toBe('Khuy mở');
    expect(d['Loại khuy']).toBe('Khuy xà cừ');
    expect(d['Khuyết Milan']).toBe('Có');
  });

  it('the trims appear once, even in a suit with two pairs of trousers', () => {
    const keys = Object.keys(buildPayload(order, snap('suit3Trousers')).design);
    expect(keys.filter((k) => k === 'Loại khuy')).toHaveLength(1);
    expect(keys.filter((k) => k === 'Khuyết Milan')).toHaveLength(1);
  });
});

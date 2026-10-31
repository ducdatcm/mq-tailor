import { describe, expect, it } from 'vitest';
import { GROUP_LIST, PRODUCTS, groupsFor, stepsFor, unitsFor } from '../catalog/catalog';
import {
  disabledReason,
  emptySelections,
  missingSteps,
  presetSelections,
  resolveSelection,
  selectionsEqual,
} from '../catalog/rules';
import { en } from '../content/en';
import { vi } from '../content/vi';
import { initialState, reducer } from '../state/reducer';
import { run, started } from './helpers';

// a blazer: one jacket (unit 'jacket1') and the trims
const BLAZER = unitsFor({ blazer: 1 });
const J = BLAZER[0];
const sel = () => emptySelections(BLAZER);

describe('catalog', () => {
  it('every group and option has copy in both languages and a sketch ID', () => {
    for (const g of GROUP_LIST) {
      expect(vi.groups[g.id].name).toBeTruthy();
      expect(en.groups[g.id].name).toBeTruthy();
      for (const o of g.options) {
        expect(vi.options[o].label).toBeTruthy();
        expect(en.options[o].label).toBeTruthy();
      }
      expect(g.options).toContain(g.preset);
    }
  });

  it('suit = jacket + trousers, blazer = jacket only, trousers = trousers only (each with the trims)', () => {
    expect(PRODUCTS.suit.pieces).toEqual(['jacket', 'trousers']);
    expect(unitsFor({ suit: 1 }).map((u) => u.id)).toEqual(['jacket1', 'trousers1', 'trims']);
    // the cuff-buttons choice is made on the cuffs screen, so it adds no step
    expect(stepsFor(unitsFor({ blazer: 1 }))).toHaveLength(groupsFor('jacket').length - 1 + groupsFor('trims').length);
    expect(stepsFor(unitsFor({ trousers: 1 }))).toHaveLength(groupsFor('trousers').length + groupsFor('trims').length);
    expect(stepsFor(unitsFor({ suit: 1 }))).toHaveLength(8 + 5 + 2);
  });
});

describe('selection rules', () => {
  it('double-breasted 6×2 over a notch lapel asks first and does not mutate', () => {
    const s = sel();
    s.jacket1.closure = 'closure.sb2';
    s.jacket1.lapel = 'lapel.notch';
    const res = resolveSelection(s, J, 'closure', 'closure.db6x2');
    expect(res.kind).toBe('confirm');
    expect(s.jacket1.closure).toBe('closure.sb2');
    expect(s.jacket1.lapel).toBe('lapel.notch');
    if (res.kind === 'confirm') {
      expect(res.selections.jacket1.closure).toBe('closure.db6x2');
      expect(res.selections.jacket1.lapel).toBe('lapel.peak');
    }
  });

  it('does not touch an unchosen lapel when choosing 6×2, but notch becomes unavailable', () => {
    const res = resolveSelection(sel(), J, 'closure', 'closure.db6x2');
    expect(res.kind).toBe('apply');
    if (res.kind === 'apply') {
      expect(res.selections.jacket1.lapel).toBeUndefined();
      expect(disabledReason(res.selections, J, 'lapel', 'lapel.notch')).toBe('dbNeedsPeak');
      expect(resolveSelection(res.selections, J, 'lapel', 'lapel.notch').kind).toBe('blocked');
    }
  });

  it('going back to single-breasted keeps the peak lapel', () => {
    const s = sel();
    s.jacket1.closure = 'closure.db6x2';
    s.jacket1.lapel = 'lapel.peak';
    const res = resolveSelection(s, J, 'closure', 'closure.sb1');
    expect(res.kind).toBe('apply');
    if (res.kind === 'apply') expect(res.selections.jacket1.lapel).toBe('lapel.peak');
  });

  it('every double-breasted closure behaves like 6×2: peak lapel only, asks before changing', () => {
    for (const closure of ['closure.db6x2', 'closure.db6x1', 'closure.db4x2', 'closure.db4x1'] as const) {
      for (const lapel of ['lapel.notch', 'lapel.shawl'] as const) {
        const s = sel();
        s.jacket1.lapel = lapel;
        const res = resolveSelection(s, J, 'closure', closure);
        expect(res.kind).toBe('confirm');
        if (res.kind === 'confirm') expect(res.selections.jacket1.lapel).toBe('lapel.peak');
      }
      const dbSel = sel();
      dbSel.jacket1.closure = closure;
      expect(disabledReason(dbSel, J, 'lapel', 'lapel.shawl')).toBe('dbNeedsPeak');
      expect(disabledReason(dbSel, J, 'lapel', 'lapel.peak')).toBeNull();
    }
    const single = sel();
    single.jacket1.closure = 'closure.sb3';
    expect(disabledReason(single, J, 'lapel', 'lapel.shawl')).toBeNull();
    single.jacket1.lapel = 'lapel.shawl';
    expect(resolveSelection(single, J, 'closure', 'closure.sb1').kind).toBe('apply');
  });

  it('rejects an option that does not belong to the group', () => {
    expect(resolveSelection(sel(), J, 'lapel', 'closure.sb1').kind).toBe('blocked');
  });

  it('the rules apply to each jacket on its own', () => {
    const units = unitsFor({ blazer: 2 });
    const s = emptySelections(units);
    s.jacket1.closure = 'closure.db6x2';
    expect(disabledReason(s, units[0], 'lapel', 'lapel.notch')).toBe('dbNeedsPeak');
    expect(disabledReason(s, units[1], 'lapel', 'lapel.notch')).toBeNull();
  });

  it('presets complete every applicable group and never include 6×2', () => {
    for (const order of [{ suit: 1 }, { blazer: 1 }, { trousers: 1 }]) {
      const units = unitsFor(order);
      expect(missingSteps(units, presetSelections(units))).toHaveLength(0);
    }
    expect(presetSelections(unitsFor({ suit: 1 })).jacket1.closure).toBe('closure.sb2');
  });
});

describe('session reducer', () => {
  it('manual start preselects nothing; preset start fills everything', () => {
    expect(missingSteps(started('suit').units, started('suit').selections)).toHaveLength(16);
    const preset = started('suit', 'preset');
    expect(missingSteps(preset.units, preset.selections)).toHaveLength(0);
  });

  it('cannot start without choosing a product', () => {
    expect(run(initialState(), { type: 'start' }).screen).toBe('start');
  });

  it('confirming is idempotent for repeated actions (rapid clicks)', () => {
    let s = started('trousers', 'preset');
    s = run(s, { type: 'openReview' });
    s = run(s, { type: 'confirm', at: 1 }, { type: 'confirm', at: 2 }, { type: 'confirm', at: 3 });
    expect(s.confirmed?.revision).toBe(1);
    expect(s.confirmed?.confirmedAt).toBe(1);
    expect(s.screen).toBe('order'); // the design is confirmed; the order details come next
  });

  it('refuses to confirm while a group is missing', () => {
    let s = started('trousers', 'preset');
    s = { ...s, selections: { ...s.selections, trousers1: { ...s.selections.trousers1, hem: undefined } } };
    s = run(s, { type: 'openReview' }, { type: 'confirm', at: 1 });
    expect(s.confirmed).toBeNull();
    expect(s.screen).toBe('review');
  });

  it('keeps the confirmed snapshot untouched while the draft is edited, then replaces it on reconfirm', () => {
    let s = started('blazer', 'preset');
    s = run(s, { type: 'openReview' }, { type: 'confirm', at: 100 });
    const first = s.confirmed!;
    s = run(s, { type: 'editConfirmed' }, { type: 'editFromReview', unit: 'jacket1', group: 'vents' });
    s = run(s, { type: 'select', unit: 'jacket1', group: 'vents', option: 'vents.single' });

    expect(s.confirmed).toBe(first);
    expect(s.confirmed!.selections.jacket1.vents).toBe('vents.double');
    expect(s.selections.jacket1.vents).toBe('vents.single');

    s = run(s, { type: 'backToReview' }, { type: 'confirm', at: 200 });
    expect(s.confirmed!.revision).toBe(2);
    expect(s.confirmed!.selections.jacket1.vents).toBe('vents.single');
    expect(s.confirmed!.previousSelections?.jacket1.vents).toBe('vents.double');
    expect(selectionsEqual(s.units, s.confirmed!.previousSelections!, first.selections)).toBe(true);
  });

  it('does not allow reconfirming an unchanged design', () => {
    let s = started('blazer', 'preset');
    s = run(s, { type: 'openReview' }, { type: 'confirm', at: 1 }, { type: 'editConfirmed' }, { type: 'confirm', at: 2 });
    expect(s.confirmed?.revision).toBe(1);
    expect(s.screen).toBe('review');
  });

  describe('order details', () => {
    const designConfirmed = () => run(started('blazer', 'preset'), { type: 'openReview' }, { type: 'confirm', at: 1 });
    const fill = (s: ReturnType<typeof initialState>) =>
      run(
        s,
        { type: 'setOrderField', field: 'orderId', value: '  MQ-0001 ' },
        { type: 'setOrderField', field: 'customerName', value: ' Nguyễn   Văn A ' },
        { type: 'setOrderField', field: 'phone', value: '0912 345 678' },
      );

    it('confirming the order needs all three fields and is a no-op until they are valid', () => {
      let s = designConfirmed();
      expect(run(s, { type: 'confirmOrder', at: 2, submissionId: 'a' }).screen).toBe('order');
      s = run(s, { type: 'setOrderField', field: 'orderId', value: 'MQ-1' }, { type: 'setOrderField', field: 'phone', value: '12' });
      expect(run(s, { type: 'confirmOrder', at: 2, submissionId: 'a' }).orderRecord).toBeNull();
    });

    it('a valid order is recorded once, tidied, and queued for the spreadsheet', () => {
      let s = fill(designConfirmed());
      s = run(s, { type: 'confirmOrder', at: 2, submissionId: 'a' }, { type: 'confirmOrder', at: 3, submissionId: 'b' });
      expect(s.screen).toBe('confirmed');
      expect(s.orderRecord).toEqual({
        orderId: 'MQ-0001',
        customerName: 'Nguyễn Văn A',
        phone: '0912 345 678',
        revision: 1,
        confirmedAt: 2,
        submissionId: 'a',
      });
      expect(s.sheet).toBe('sending');
    });

    it('the spreadsheet result and a retry only move the status', () => {
      let s = fill(designConfirmed());
      s = run(s, { type: 'confirmOrder', at: 2, submissionId: 'a' }, { type: 'sheetResult', status: 'queued' });
      expect(s.sheet).toBe('queued');
      expect(run(s, { type: 'sheetRetry' }).sheet).toBe('sending');
      expect(run(s, { type: 'sheetResult', status: 'sent' }).sheet).toBe('sent');
    });

    it('a changed design needs the order confirmed again, with the details still filled in', () => {
      let s = fill(designConfirmed());
      s = run(s, { type: 'confirmOrder', at: 2, submissionId: 'a' }, { type: 'editConfirmed' }, { type: 'editFromReview', unit: 'jacket1', group: 'vents' });
      s = run(s, { type: 'select', unit: 'jacket1', group: 'vents', option: 'vents.single' }, { type: 'backToReview' }, { type: 'confirm', at: 5 });
      expect(s.screen).toBe('order');
      expect(s.orderRecord).toBeNull();
      expect(s.order.orderId).toBe('MQ-0001');
      s = run(s, { type: 'confirmOrder', at: 6, submissionId: 'c' });
      expect(s.orderRecord?.revision).toBe(2);
      expect(s.orderRecord?.submissionId).toBe('c');
    });

    it('going back to look at the confirmed design lands on the right screen', () => {
      let s = designConfirmed();
      s = run(s, { type: 'editConfirmed' }, { type: 'viewConfirmed' });
      expect(s.screen).toBe('order'); // no order for this version yet
      s = run(fill(s), { type: 'confirmOrder', at: 2, submissionId: 'a' }, { type: 'editConfirmed' }, { type: 'viewConfirmed' });
      expect(s.screen).toBe('confirmed');
    });

    it('reset wipes the customer details', () => {
      let s = fill(designConfirmed());
      s = run(s, { type: 'confirmOrder', at: 2, submissionId: 'a' }, { type: 'reset' });
      expect(s.order).toEqual({ orderId: '', customerName: '', phone: '' });
      expect(s.orderRecord).toBeNull();
    });
  });

  it('keeps all selections when switching piece and stepping back and forth', () => {
    let s = started('suit');
    s = run(s, { type: 'select', unit: 'jacket1', group: 'closure', option: 'closure.sb1' });
    s = run(s, { type: 'switchUnit', unit: 'trousers1' });
    s = run(s, { type: 'select', unit: 'trousers1', group: 'pleats', option: 'pleats.two' });
    s = run(s, { type: 'switchUnit', unit: 'jacket1' }, { type: 'next' }, { type: 'back' });
    expect(s.selections.jacket1.closure).toBe('closure.sb1');
    expect(s.selections.trousers1.pleats).toBe('pleats.two');
  });

  it('accepting the lapel change updates both, cancelling preserves both', () => {
    let s = started('blazer');
    s = run(
      s,
      { type: 'select', unit: 'jacket1', group: 'closure', option: 'closure.sb2' },
      { type: 'select', unit: 'jacket1', group: 'lapel', option: 'lapel.notch' },
      { type: 'select', unit: 'jacket1', group: 'closure', option: 'closure.db6x2' },
    );
    expect(s.pending).not.toBeNull();
    expect(s.selections.jacket1.closure).toBe('closure.sb2');

    const cancelled = run(s, { type: 'cancelPending' });
    expect(cancelled.selections.jacket1).toEqual({ closure: 'closure.sb2', lapel: 'lapel.notch' });

    const accepted = run(s, { type: 'acceptPending' });
    expect(accepted.selections.jacket1).toEqual({ closure: 'closure.db6x2', lapel: 'lapel.peak' });
    expect(accepted.pending).toBeNull();
  });

  it('reset clears everything but keeps the chosen language', () => {
    let s = started('suit', 'preset');
    s = run(s, { type: 'setLang', lang: 'en' }, { type: 'openReview' }, { type: 'confirm', at: 5 }, { type: 'reset' });
    expect(s.lang).toBe('en');
    expect(s.confirmed).toBeNull();
    expect(s.units).toEqual([]);
    expect(s.quantities).toEqual({});
    expect(s.screen).toBe('start');
    expect(missingSteps(s.units, s.selections)).toHaveLength(0);
  });

  it('changing language changes nothing else', () => {
    const s = started('suit', 'preset');
    const t = run(s, { type: 'setLang', lang: 'en' });
    expect({ ...t, lang: 'vi' }).toEqual(s);
  });
});

describe('selecting on a unit that does not exist', () => {
  it('does nothing', () => {
    const s = started('blazer');
    expect(reducer(s, { type: 'select', unit: 'trousers1', group: 'pleats', option: 'pleats.flat' })).toBe(s);
  });
});

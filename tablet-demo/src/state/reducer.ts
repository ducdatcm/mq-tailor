import {
  GROUP_BY_ID,
  MAX_QUANTITY,
  MIN_QUANTITY,
  groupsFor,
  stepsFor,
  unitsFor,
  type Step,
  type Unit,
} from '../catalog/catalog';
import {
  cloneSelections,
  copyableUnits,
  emptySelections,
  hasAnySelection,
  missingSteps,
  presetSelections,
  relevantSelections,
  resolveSelection,
  selectionsEqual,
  syncMirrors,
} from '../catalog/rules';
import { cleanOrder, isOrderValid } from '../order/validate';
import type { Action, Cursor, State } from './types';

export function initialState(lang: State['lang'] = 'vi'): State {
  return {
    lang,
    screen: 'start',
    quantities: {},
    startMode: 'manual',
    units: [],
    selections: {},
    cursor: { unit: '', group: 'closure' },
    lastGroup: {},
    returnToReview: false,
    sameAs: {},
    pending: null,
    confirmed: null,
    order: { orderId: '', customerName: '', phone: '' },
    orderRecord: null,
    sheet: 'idle',
  };
}

const unitOf = (state: State, id: string): Unit | undefined => state.units.find((u) => u.id === id);

function stepIndex(state: State, cursor: Cursor): number {
  return stepsFor(state.units, state.selections).findIndex((s) => s.unit === cursor.unit && s.group === cursor.group);
}

function toCursor(step: Step): Cursor {
  return { unit: step.unit, group: step.group };
}

/** The first group of a unit that has a screen of its own. */
function firstGroup(state: State, unit: Unit): Cursor['group'] {
  const groups = groupsFor(unit.garment, state.selections[unit.id]).filter((g) => !g.companionOf);
  return groups[0].id;
}

/** Move to a group and remember it as the place to return to for that unit. */
function moveTo(state: State, cursor: Cursor): State {
  // A group chosen on another group's screen has no screen of its own: go to that screen.
  const parent = GROUP_BY_ID[cursor.group].companionOf;
  if (parent) cursor = { unit: cursor.unit, group: parent };
  return { ...state, cursor, lastGroup: { ...state.lastGroup, [cursor.unit]: cursor.group } };
}

/** True when the session holds anything a reset would throw away. */
export function sessionHasData(state: State): boolean {
  const o = state.order;
  return state.confirmed !== null || hasAnySelection(state.selections) || Boolean(o.orderId || o.customerName || o.phone);
}

/** Changing a unit's own choices ends its copying; the units that copy it follow the change. */
function afterChange(state: State, unitId: string, selections: State['selections']): State {
  const sameAs = state.sameAs[unitId] ? { ...state.sameAs, [unitId]: null } : state.sameAs;
  return { ...state, sameAs, selections: syncMirrors(state.units, sameAs, selections) };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setLang':
      return state.lang === action.lang ? state : { ...state, lang: action.lang };

    case 'setQuantity': {
      if (state.screen !== 'start') return state;
      const value = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.round(action.value) || MIN_QUANTITY));
      if ((state.quantities[action.product] ?? 0) === value) return state;
      const quantities = { ...state.quantities };
      if (value === 0) delete quantities[action.product];
      else quantities[action.product] = value;
      return { ...state, quantities };
    }

    case 'chooseMode':
      return { ...state, startMode: action.mode };

    case 'start': {
      if (state.screen !== 'start') return state;
      const units = unitsFor(state.quantities);
      if (units.length === 0) return state;
      const selections = state.startMode === 'preset' ? presetSelections(units) : emptySelections(units);
      return {
        ...state,
        screen: 'configure',
        units,
        selections,
        cursor: toCursor(stepsFor(units)[0]),
        lastGroup: {},
        returnToReview: false,
        sameAs: {},
        pending: null,
        confirmed: null,
        order: initialState().order,
        orderRecord: null,
        sheet: 'idle',
      };
    }

    case 'select': {
      const unit = unitOf(state, action.unit);
      if (!unit || state.screen !== 'configure') return state;
      const res = resolveSelection(state.selections, unit, action.group, action.option);
      if (res.kind === 'blocked') return state;
      if (res.kind === 'confirm') {
        // Do not touch the draft yet: the user must accept or cancel.
        return {
          ...state,
          pending: { reason: res.reason, unit: unit.id, group: action.group, option: action.option, next: res.selections },
        };
      }
      return afterChange(state, unit.id, res.selections);
    }

    case 'setSameAs': {
      const unit = unitOf(state, action.unit);
      if (!unit || state.screen !== 'configure') return state;
      if (action.source === null) return state.sameAs[unit.id] ? { ...state, sameAs: { ...state.sameAs, [unit.id]: null } } : state;
      if (!copyableUnits(state.units, unit).some((u) => u.id === action.source)) return state;
      if (state.sameAs[unit.id] === action.source) return state;
      const sameAs = { ...state.sameAs, [unit.id]: action.source };
      return { ...state, sameAs, selections: syncMirrors(state.units, sameAs, state.selections) };
    }

    case 'acceptPending':
      if (!state.pending) return state;
      return { ...afterChange(state, state.pending.unit, cloneSelections(state.pending.next)), pending: null };

    case 'cancelPending':
      return state.pending ? { ...state, pending: null } : state;

    case 'goTo': {
      const unit = unitOf(state, action.unit);
      if (!unit) return state;
      if (GROUP_BY_ID[action.group].garment !== unit.garment) return state;
      if (!groupsFor(unit.garment, state.selections[unit.id]).some((g) => g.id === action.group)) return state;
      return moveTo({ ...state, screen: 'configure' }, { unit: unit.id, group: action.group });
    }

    case 'switchUnit': {
      const unit = unitOf(state, action.unit);
      if (!unit || state.cursor.unit === unit.id) return state;
      const shown = groupsFor(unit.garment, state.selections[unit.id]).map((g) => g.id);
      const last = state.lastGroup[unit.id];
      return moveTo(state, { unit: unit.id, group: last && shown.includes(last) ? last : firstGroup(state, unit) });
    }

    case 'next': {
      if (state.units.length === 0 || state.screen !== 'configure') return state;
      const steps = stepsFor(state.units, state.selections);
      const i = stepIndex(state, state.cursor);
      if (i >= steps.length - 1) return { ...state, screen: 'review', returnToReview: false };
      return moveTo(state, toCursor(steps[i + 1]));
    }

    case 'back': {
      if (state.units.length === 0 || state.screen !== 'configure') return state;
      const steps = stepsFor(state.units, state.selections);
      const i = stepIndex(state, state.cursor);
      if (i <= 0) return state;
      return moveTo(state, toCursor(steps[i - 1]));
    }

    case 'openReview':
      if (state.units.length === 0) return state;
      return { ...state, screen: 'review', returnToReview: false };

    case 'editFromReview':
      if (state.units.length === 0) return state;
      return moveTo({ ...state, screen: 'configure', returnToReview: true }, { unit: action.unit, group: action.group });

    case 'backToReview':
      if (state.units.length === 0) return state;
      return { ...state, screen: 'review', returnToReview: false, pending: null };

    case 'confirm': {
      // One action, one result: only a complete draft on the review screen can
      // be confirmed, and the screen change makes any queued repeat a no-op.
      if (state.screen !== 'review' || state.units.length === 0) return state;
      if (missingSteps(state.units, state.selections).length > 0) return state;
      if (state.confirmed && selectionsEqual(state.units, state.confirmed.selections, state.selections)) {
        return state;
      }
      return {
        ...state,
        screen: 'order',
        orderRecord: null,
        sheet: 'idle',
        confirmed: {
          revision: (state.confirmed?.revision ?? 0) + 1,
          confirmedAt: action.at,
          quantities: state.quantities,
          units: state.units,
          selections: relevantSelections(state.units, state.selections),
          previousSelections: state.confirmed ? state.confirmed.selections : null,
        },
      };
    }

    case 'editConfirmed':
      if (!state.confirmed) return state;
      return { ...state, screen: 'review', returnToReview: false };

    case 'viewConfirmed':
      if (!state.confirmed) return state;
      return { ...state, screen: state.orderRecord?.revision === state.confirmed.revision ? 'confirmed' : 'order' };

    case 'setOrderField':
      if (state.screen !== 'order') return state;
      return { ...state, order: { ...state.order, [action.field]: action.value } };

    case 'confirmOrder': {
      // Same rule as the design confirmation: one click, one order, repeats are no-ops.
      if (state.screen !== 'order' || !state.confirmed) return state;
      if (!isOrderValid(state.order)) return state;
      const cleaned = cleanOrder(state.order);
      return {
        ...state,
        screen: 'confirmed',
        order: cleaned,
        orderRecord: { ...cleaned, revision: state.confirmed.revision, confirmedAt: action.at, submissionId: action.submissionId },
        sheet: 'sending',
      };
    }

    case 'sheetResult':
      return state.orderRecord ? { ...state, sheet: action.status } : state;

    case 'sheetRetry':
      return state.orderRecord && state.sheet !== 'sending' ? { ...state, sheet: 'sending' } : state;

    case 'reset':
      return initialState(state.lang);

    default:
      return state;
  }
}

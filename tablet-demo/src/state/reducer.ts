import { GROUP_BY_ID, PRODUCTS, baseGarment, stepsFor, type GarmentId, type ProductId, type Step } from '../catalog/catalog';
import {
  cloneSelections,
  emptySelections,
  hasAnySelection,
  missingSteps,
  presetSelections,
  relevantSelections,
  resolveSelection,
  selectionsEqual,
} from '../catalog/rules';
import { cleanOrder, isOrderValid } from '../order/validate';
import type { Action, Cursor, State } from './types';

export function initialState(lang: State['lang'] = 'vi'): State {
  return {
    lang,
    screen: 'start',
    startProduct: null,
    startMode: 'manual',
    product: null,
    selections: emptySelections(),
    cursor: { garment: 'jacket', group: 'closure' },
    lastGroup: { jacket: 'closure', waistcoat: 'waistcoatStyle', trousers: 'pleats', trousers2: 'pleats', trims: 'buttonType' },
    returnToReview: false,
    sameTrousers: false,
    pending: null,
    confirmed: null,
    order: { orderId: '', customerName: '', phone: '' },
    orderRecord: null,
    sheet: 'idle',
  };
}

function stepIndex(product: ProductId, cursor: Cursor): number {
  return stepsFor(product).findIndex((s) => s.garment === cursor.garment && s.group === cursor.group);
}

function toCursor(step: Step): Cursor {
  return { garment: step.garment, group: step.group };
}

/** Move to a group and remember it as the place to return to for that garment. */
function moveTo(state: State, cursor: Cursor): State {
  // A group chosen on another group's screen has no screen of its own: go to that screen.
  const parent = GROUP_BY_ID[cursor.group].companionOf;
  if (parent) cursor = { garment: cursor.garment, group: parent };
  return { ...state, cursor, lastGroup: { ...state.lastGroup, [cursor.garment]: cursor.group } };
}

/** True when the session holds anything a reset would throw away. */
export function sessionHasData(state: State): boolean {
  const o = state.order;
  return state.confirmed !== null || hasAnySelection(state.selections) || Boolean(o.orderId || o.customerName || o.phone);
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setLang':
      return state.lang === action.lang ? state : { ...state, lang: action.lang };

    case 'chooseProduct':
      return { ...state, startProduct: action.product };

    case 'chooseMode':
      return { ...state, startMode: action.mode };

    case 'start': {
      if (state.screen !== 'start' || !state.startProduct) return state;
      const product = state.startProduct;
      return {
        ...state,
        screen: 'configure',
        product,
        selections: state.startMode === 'preset' ? presetSelections(product) : emptySelections(),
        cursor: toCursor(stepsFor(product)[0]),
        lastGroup: initialState().lastGroup,
        returnToReview: false,
        sameTrousers: false,
        pending: null,
        confirmed: null,
        order: initialState().order,
        orderRecord: null,
        sheet: 'idle',
      };
    }

    case 'select': {
      if (!state.product || state.screen !== 'configure') return state;
      if (!PRODUCTS[state.product].garments.includes(action.garment)) return state;
      const res = resolveSelection(state.selections, action.garment, action.group, action.option);
      if (res.kind === 'blocked') return state;
      if (res.kind === 'confirm') {
        // Do not touch the draft yet: the user must accept or cancel.
        return {
          ...state,
          pending: {
            reason: res.reason,
            garment: action.garment,
            group: action.group,
            option: action.option,
            next: res.selections,
          },
        };
      }
      // Second trousers set to "same": the first pair is mirrored; changing the second pair on its own ends the mirroring.
      if (state.sameTrousers && PRODUCTS[state.product].garments.includes('trousers2')) {
        if (action.garment === 'trousers') {
          return { ...state, selections: { ...res.selections, trousers2: { ...res.selections.trousers } } };
        }
        if (action.garment === 'trousers2') return { ...state, selections: res.selections, sameTrousers: false };
      }
      return { ...state, selections: res.selections };
    }

    case 'setSameTrousers': {
      if (!state.product || !PRODUCTS[state.product].garments.includes('trousers2')) return state;
      if (state.sameTrousers === action.value) return state;
      if (!action.value) return { ...state, sameTrousers: false };
      return { ...state, sameTrousers: true, selections: { ...state.selections, trousers2: { ...state.selections.trousers } } };
    }

    case 'acceptPending':
      if (!state.pending) return state;
      return { ...state, selections: cloneSelections(state.pending.next), pending: null };

    case 'cancelPending':
      return state.pending ? { ...state, pending: null } : state;

    case 'goTo':
      if (!state.product || !PRODUCTS[state.product].garments.includes(action.garment)) return state;
      if (GROUP_BY_ID[action.group].garment !== baseGarment(action.garment)) return state;
      return moveTo({ ...state, screen: 'configure' }, { garment: action.garment, group: action.group });

    case 'switchGarment': {
      if (!state.product || !PRODUCTS[state.product].garments.includes(action.garment)) return state;
      if (state.cursor.garment === action.garment) return state;
      return moveTo(state, { garment: action.garment, group: state.lastGroup[action.garment] });
    }

    case 'next': {
      if (!state.product || state.screen !== 'configure') return state;
      const steps = stepsFor(state.product);
      const i = stepIndex(state.product, state.cursor);
      if (i >= steps.length - 1) return { ...state, screen: 'review', returnToReview: false };
      return moveTo(state, toCursor(steps[i + 1]));
    }

    case 'back': {
      if (!state.product || state.screen !== 'configure') return state;
      const steps = stepsFor(state.product);
      const i = stepIndex(state.product, state.cursor);
      if (i <= 0) return state;
      return moveTo(state, toCursor(steps[i - 1]));
    }

    case 'openReview':
      if (!state.product) return state;
      return { ...state, screen: 'review', returnToReview: false };

    case 'editFromReview':
      if (!state.product) return state;
      return moveTo({ ...state, screen: 'configure', returnToReview: true }, { garment: action.garment, group: action.group });

    case 'backToReview':
      if (!state.product) return state;
      return { ...state, screen: 'review', returnToReview: false, pending: null };

    case 'confirm': {
      // One action, one result: only a complete draft on the review screen can
      // be confirmed, and the screen change makes any queued repeat a no-op.
      if (state.screen !== 'review' || !state.product) return state;
      if (missingSteps(state.product, state.selections).length > 0) return state;
      if (state.confirmed && selectionsEqual(state.product, state.confirmed.selections, state.selections)) {
        return state;
      }
      const product = state.product;
      return {
        ...state,
        screen: 'order',
        orderRecord: null,
        sheet: 'idle',
        confirmed: {
          revision: (state.confirmed?.revision ?? 0) + 1,
          confirmedAt: action.at,
          product,
          selections: relevantSelections(product, state.selections),
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

export function currentGarments(state: State): readonly GarmentId[] {
  return state.product ? PRODUCTS[state.product].garments : [];
}

import { GROUP_BY_ID, PRODUCTS, stepsFor, type GarmentId, type ProductId, type Step } from '../catalog/catalog';
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
import type { Action, Cursor, State } from './types';

export const DEMO_CODE = 'DEMO-001';

export function initialState(lang: State['lang'] = 'vi'): State {
  return {
    lang,
    screen: 'start',
    startProduct: null,
    startMode: 'manual',
    product: null,
    selections: emptySelections(),
    cursor: { garment: 'jacket', group: 'closure' },
    lastGroup: { jacket: 'closure', trousers: 'pleats' },
    returnToReview: false,
    pending: null,
    confirmed: null,
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
  return { ...state, cursor, lastGroup: { ...state.lastGroup, [cursor.garment]: cursor.group } };
}

/** True when the session holds anything a reset would throw away. */
export function sessionHasData(state: State): boolean {
  return state.confirmed !== null || hasAnySelection(state.selections);
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
        pending: null,
        confirmed: null,
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
      return { ...state, selections: res.selections };
    }

    case 'acceptPending':
      if (!state.pending) return state;
      return { ...state, selections: cloneSelections(state.pending.next), pending: null };

    case 'cancelPending':
      return state.pending ? { ...state, pending: null } : state;

    case 'goTo':
      if (!state.product || !PRODUCTS[state.product].garments.includes(action.garment)) return state;
      if (GROUP_BY_ID[action.group].garment !== action.garment) return state;
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
        screen: 'confirmed',
        confirmed: {
          code: DEMO_CODE,
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
      return { ...state, screen: 'confirmed' };

    case 'reset':
      return initialState(state.lang);

    default:
      return state;
  }
}

export function currentGarments(state: State): readonly GarmentId[] {
  return state.product ? PRODUCTS[state.product].garments : [];
}

import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { getCopy } from '../content';
import type { Copy } from '../content/copy';
import { initialState, reducer } from './reducer';
import type { Action, State } from './types';

const STORAGE_KEY = 'mq-tablet-demo/v1';

/**
 * Reload-survival is a convenience, not a requirement. Everything is wrapped
 * in try/catch because storage can be unavailable (private mode, kiosks).
 */
function loadState(): State {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as { v?: number; state?: State };
    if (parsed.v !== 1 || !parsed.state || !parsed.state.selections || !parsed.state.cursor) return initialState();
    return { ...initialState(), ...parsed.state, pending: null };
  } catch {
    return initialState();
  }
}

function saveState(state: State): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, state: { ...state, pending: null } }));
  } catch {
    /* ignore */
  }
}

interface Store {
  state: State;
  dispatch: Dispatch<Action>;
  t: Copy;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: State }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial ?? loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.lang = state.lang;
    document.title = state.lang === 'vi' ? 'Minh Quang — Tư vấn thiết kế' : 'Minh Quang — Design consultation';
  }, [state.lang]);

  const value = useMemo<Store>(() => ({ state, dispatch, t: getCopy(state.lang) }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

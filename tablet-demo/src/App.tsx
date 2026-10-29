import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Modal } from './components/Modal';
import { ConfigureScreen } from './screens/ConfigureScreen';
import { ConfirmedScreen } from './screens/ConfirmedScreen';
import { OrderScreen } from './screens/OrderScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { StartScreen } from './screens/StartScreen';
import { Gallery } from './sketches/Gallery';
import { flushQueue, sendOrder } from './sheet/client';
import { buildPayload } from './sheet/payload';
import { sessionHasData } from './state/reducer';
import { StoreProvider, useStore } from './state/store';

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

function Shell() {
  const { state, dispatch, t } = useStore();
  const [askReset, setAskReset] = useState(false);

  // An order confirmed on this tablet is written to the spreadsheet; one that could not be
  // sent stays queued on the device and goes out when the connection is back.
  const { sheet, orderRecord, confirmed } = state;
  useEffect(() => {
    if (sheet !== 'sending' || !orderRecord || !confirmed) return;
    let cancelled = false;
    void sendOrder(buildPayload(orderRecord, confirmed)).then((outcome) => {
      if (!cancelled) dispatch({ type: 'sheetResult', status: outcome });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, orderRecord?.submissionId]);

  useEffect(() => {
    void flushQueue();
    const retry = () => void flushQueue();
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  // A saved session from before orders existed has no order yet: send it to the order screen.
  const screen = state.screen === 'confirmed' && !state.orderRecord ? 'order' : state.screen;

  // The control that caused a screen change is gone afterwards, so hand focus to the
  // new screen's heading (keeps keyboard and screen-reader users oriented).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true });
  }, [state.screen]);

  // Ask before throwing work away; start straight over when there is nothing to lose.
  const requestNewSession = () => {
    if (sessionHasData(state)) setAskReset(true);
    else dispatch({ type: 'reset' });
  };

  return (
    <div className="app">
      <Header onNewSession={requestNewSession} />
      {screen === 'start' ? <StartScreen /> : null}
      {screen === 'configure' && state.product ? <ConfigureScreen /> : null}
      {screen === 'review' && state.product ? <ReviewScreen /> : null}
      {screen === 'order' ? <OrderScreen /> : null}
      {screen === 'confirmed' ? <ConfirmedScreen onNewSession={requestNewSession} /> : null}

      {askReset ? (
        <Modal role="alertdialog" title={t.reset.title} closeLabel={t.close} onClose={() => setAskReset(false)}>
          <p>{t.reset.body}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" data-autofocus onClick={() => setAskReset(false)}>
              {t.reset.cancel}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setAskReset(false);
                dispatch({ type: 'reset' });
              }}
            >
              {t.reset.confirm}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function App() {
  const hash = useHash();
  // The sketch sheet is a reference page for the house to review the drawings;
  // it is not linked from anywhere in the customer flow.
  if (hash === '#/sketches') return <Gallery />;
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

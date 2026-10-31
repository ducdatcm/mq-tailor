import { useState } from 'react';
import { groupsFor } from '../catalog/catalog';
import { DesignSheet } from '../components/DesignSheet';
import { CheckIcon } from '../components/icons';
import { fmt } from '../content/copy';
import { productList, unitName } from '../order/labels';
import { createDesignPdf, downloadBlob, pdfFileName } from '../pdf/exportPdf';
import { useStore } from '../state/store';

export function ConfirmedScreen({ onNewSession }: { onNewSession: () => void }) {
  const { state, dispatch, t } = useStore();
  const snap = state.confirmed;
  const order = state.orderRecord;
  const [pdf, setPdf] = useState<'idle' | 'busy' | 'failed'>('idle');
  if (!snap || !order) return null;

  const changes = snap.previousSelections
    ? snap.units.flatMap((unit) =>
        groupsFor(unit.garment, snap.selections[unit.id])
          .filter((g) => snap.previousSelections![unit.id]?.[g.id] !== snap.selections[unit.id]?.[g.id])
          .map((g) => ({
            key: `${unit.id}-${g.id}`,
            name: snap.units.filter((u) => u.garment === unit.garment).length > 1 ? `${unitName(t, unit, snap.units)} · ${t.groups[g.id].name}` : t.groups[g.id].name,
            before: snap.previousSelections![unit.id]?.[g.id],
            after: snap.selections[unit.id]?.[g.id],
          })),
      )
    : [];

  const time = new Intl.DateTimeFormat(state.lang === 'vi' ? 'vi-VN' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(order.confirmedAt));

  const exportPdf = async () => {
    if (pdf === 'busy') return;
    setPdf('busy');
    try {
      downloadBlob(await createDesignPdf(t, snap, order, state.lang), pdfFileName(order));
      setPdf('idle');
    } catch (err) {
      console.error('PDF export failed', err);
      setPdf('failed');
    }
  };

  const sheetMessage =
    state.sheet === 'sending'
      ? t.confirmed.sheetSending
      : state.sheet === 'sent'
        ? t.confirmed.sheetSent
        : state.sheet === 'queued'
          ? t.confirmed.sheetQueued
          : state.sheet === 'unconfigured'
            ? t.confirmed.sheetUnconfigured
            : null;

  return (
    <>
      <main className="content confirmed">
        <header className="confirmed-head">
          <span className="confirmed-seal" aria-hidden="true">
            <CheckIcon size={30} />
          </span>
          <div>
            <h1 tabIndex={-1} data-screen-heading>
              {t.confirmed.title}
            </h1>
            <p className="lead">{t.confirmed.subtitle}</p>
            <dl className="order-facts">
              <div>
                <dt>{t.confirmed.orderLabel}</dt>
                <dd>{order.orderId}</dd>
              </div>
              <div>
                <dt>{t.confirmed.customerLabel}</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt>{t.confirmed.phoneLabel}</dt>
                <dd>{order.phone}</dd>
              </div>
              <div>
                <dt>{t.confirmed.productsLabel}</dt>
                <dd>{productList(t, snap.quantities)}</dd>
              </div>
            </dl>
            <p className="confirmed-meta">
              <span className="tag tag-solid">{fmt(t.confirmed.revision, { n: snap.revision })}</span>
              <span>{fmt(t.confirmed.confirmedAt, { time })}</span>
            </p>
            {changes.length > 0 ? (
              <div className="changes">
                <strong>{fmt(t.confirmed.changesTitle, { n: snap.revision - 1 })}:</strong>
                <ul>
                  {changes.map((c) => (
                    <li key={c.key}>
                      {c.name}: {c.before ? t.options[c.before].label : t.review.notChosen} → <strong>{c.after ? t.options[c.after].label : t.review.notChosen}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {snap.revision === 1 ? <p className="fine-print">{t.confirmed.firstRevisionNote}</p> : null}
          </div>
        </header>

        <section className="export-panel" aria-label={t.confirmed.exportPdf}>
          <div className="export-row">
            <button type="button" className="btn btn-primary btn-large" onClick={exportPdf} disabled={pdf === 'busy'} data-export-pdf>
              {pdf === 'busy' ? t.confirmed.exporting : t.confirmed.exportPdf}
            </button>
            {pdf === 'failed' ? (
              <p className="field-error" role="alert">
                {t.confirmed.exportFailed}
              </p>
            ) : null}
          </div>
          <div className="export-row sheet-status" data-sheet-status={state.sheet}>
            <strong>{t.confirmed.sheetTitle}:</strong>
            <span role="status">{sheetMessage}</span>
            {state.sheet === 'queued' || state.sheet === 'unconfigured' ? (
              <button type="button" className="btn btn-secondary btn-small" onClick={() => dispatch({ type: 'sheetRetry' })}>
                {t.confirmed.sheetRetry}
              </button>
            ) : null}
          </div>
        </section>

        <DesignSheet units={snap.units} selections={snap.selections} mode="confirmed" previous={snap.previousSelections} />

        <section className="next-step">
          <h2>{t.confirmed.nextTitle}</h2>
          <p>{t.confirmed.nextBody}</p>
        </section>
      </main>

      <footer className="footer">
        <button type="button" className="btn btn-secondary btn-large" onClick={() => dispatch({ type: 'editConfirmed' })}>
          {t.confirmed.edit}
        </button>
        <span className="footer-spacer" />
        <button type="button" className="btn btn-secondary btn-large" onClick={onNewSession}>
          {t.confirmed.newSession}
        </button>
      </footer>
    </>
  );
}

import { useState, type FormEvent } from 'react';
import { ChevronIcon } from '../components/icons';
import { fmt } from '../content/copy';
import { formatDate } from '../order/format';
import { validateOrder, type OrderError, type OrderField } from '../order/validate';
import { useStore } from '../state/store';

/** A new id for one order confirmation (the spreadsheet uses it to ignore repeats). */
function newSubmissionId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** After the design is confirmed: the sale and the customer fill in the order details together. */
export function OrderScreen() {
  const { state, dispatch, t } = useStore();
  const snap = state.confirmed;
  const [touched, setTouched] = useState<Partial<Record<OrderField, boolean>>>({});
  const [today] = useState(() => Date.now());
  if (!snap) return null;

  const errors = validateOrder(state.order);
  const valid = Object.keys(errors).length === 0;
  const message = (e: OrderError) => (e === 'required' ? t.order.errorRequired : e === 'tooLong' ? t.order.errorTooLong : t.order.errorPhone);

  const fields: { key: OrderField; label: string; hint?: string; type?: string; inputMode?: 'text' | 'tel'; autoFocus?: boolean }[] = [
    { key: 'orderId', label: t.order.orderId, hint: t.order.orderIdHint, autoFocus: true },
    { key: 'customerName', label: t.order.customer },
    { key: 'phone', label: t.order.phone, hint: t.order.phoneHint, type: 'tel', inputMode: 'tel' },
  ];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setTouched({ orderId: true, customerName: true, phone: true });
      return;
    }
    dispatch({ type: 'confirmOrder', at: Date.now(), submissionId: newSubmissionId() });
  };

  return (
    <>
      <main className="content order">
        <form id="order-form" className="order-form" onSubmit={submit} noValidate>
          <h1 tabIndex={-1} data-screen-heading>
            {t.order.title}
          </h1>
          <p className="lead">{t.order.intro}</p>
          <p className="order-summary">{fmt(t.order.summary, { product: t.products[snap.product].name, n: snap.revision })}</p>

          <div className="order-date">
            <span className="field-label">{t.order.dateLabel}</span>
            <strong>{formatDate(today)}</strong>
            <span className="field-hint">{t.order.dateNote}</span>
          </div>

          {fields.map((f) => {
            const error = errors[f.key];
            const showError = Boolean(error && touched[f.key]);
            return (
              <div key={f.key} className={`field${showError ? ' has-error' : ''}`}>
                <label htmlFor={`order-${f.key}`} className="field-label">
                  {f.label}
                </label>
                <input
                  id={`order-${f.key}`}
                  className="field-input"
                  name={f.key}
                  type={f.type ?? 'text'}
                  inputMode={f.inputMode ?? 'text'}
                  autoComplete="off"
                  autoCapitalize={f.key === 'customerName' ? 'words' : 'off'}
                  enterKeyHint={f.key === 'phone' ? 'done' : 'next'}
                  value={state.order[f.key]}
                  aria-invalid={showError}
                  aria-describedby={showError ? `order-${f.key}-error` : f.hint ? `order-${f.key}-hint` : undefined}
                  onChange={(e) => dispatch({ type: 'setOrderField', field: f.key, value: e.target.value })}
                  onBlur={() => setTouched((p) => ({ ...p, [f.key]: true }))}
                />
                {showError && error ? (
                  <p id={`order-${f.key}-error`} className="field-error" role="alert">
                    {message(error)}
                  </p>
                ) : f.hint ? (
                  <p id={`order-${f.key}-hint`} className="field-hint">
                    {f.hint}
                  </p>
                ) : null}
              </div>
            );
          })}

          <p className="fine-print">{t.order.dataNote}</p>
        </form>
      </main>

      <footer className="footer">
        <button type="button" className="btn btn-secondary btn-large" onClick={() => dispatch({ type: 'editConfirmed' })}>
          <ChevronIcon dir="left" />
          {t.order.back}
        </button>
        <p className="footer-status" id="order-hint" role="status">
          {valid ? null : t.order.confirmBlocked}
        </p>
        <button type="submit" form="order-form" className="btn btn-primary btn-large" disabled={!valid} aria-describedby="order-hint">
          {t.order.confirm}
        </button>
      </footer>
    </>
  );
}

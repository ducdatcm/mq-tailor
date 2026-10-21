import { PRODUCTS, groupsFor } from '../catalog/catalog';
import { DesignSheet } from '../components/DesignSheet';
import { CheckIcon } from '../components/icons';
import { fmt } from '../content/copy';
import { useStore } from '../state/store';

export function ConfirmedScreen({ onNewSession }: { onNewSession: () => void }) {
  const { state, dispatch, t } = useStore();
  const snap = state.confirmed;
  if (!snap) return null;

  const changes = snap.previousSelections
    ? PRODUCTS[snap.product].garments.flatMap((garment) =>
        groupsFor(garment)
          .filter((g) => snap.previousSelections![garment][g.id] !== snap.selections[garment][g.id])
          .map((g) => ({ group: g.id, before: snap.previousSelections![garment][g.id], after: snap.selections[garment][g.id] })),
      )
    : [];

  const time = new Intl.DateTimeFormat(state.lang === 'vi' ? 'vi-VN' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(snap.confirmedAt));

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
            <p className="confirmed-meta">
              <span>
                {t.confirmed.codeLabel}: <strong>{snap.code}</strong>
              </span>
              <span className="tag tag-solid">{fmt(t.confirmed.revision, { n: snap.revision })}</span>
              <span>{fmt(t.confirmed.confirmedAt, { time })}</span>
            </p>
            {changes.length > 0 ? (
              <div className="changes">
                <strong>{fmt(t.confirmed.changesTitle, { n: snap.revision - 1 })}:</strong>
                <ul>
                  {changes.map((c) => (
                    <li key={c.group}>
                      {t.groups[c.group].name}: {c.before ? t.options[c.before].label : t.review.notChosen} → <strong>{c.after ? t.options[c.after].label : t.review.notChosen}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {snap.revision === 1 ? <p className="fine-print">{t.confirmed.firstRevisionNote}</p> : null}
          </div>
        </header>

        <DesignSheet
          product={snap.product}
          selections={snap.selections}
          mode="confirmed"
          previous={snap.previousSelections}
        />

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

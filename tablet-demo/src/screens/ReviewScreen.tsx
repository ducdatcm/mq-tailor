import { missingSteps, selectionsEqual } from '../catalog/rules';
import { DesignSheet } from '../components/DesignSheet';
import { ChevronIcon } from '../components/icons';
import { fmt } from '../content/copy';
import { useStore } from '../state/store';

export function ReviewScreen() {
  const { state, dispatch, t } = useStore();
  const product = state.product!;
  const missing = missingSteps(product, state.selections);
  const complete = missing.length === 0;
  const confirmed = state.confirmed;
  const unchanged = Boolean(confirmed) && selectionsEqual(product, confirmed!.selections, state.selections);
  const canConfirm = complete && !unchanged;

  const blockedMessage = !complete ? t.review.confirmBlocked : unchanged ? t.review.confirmUnchanged : null;

  return (
    <>
      <main className="content review">
        <h1 tabIndex={-1} data-screen-heading>
          {t.review.title}
        </h1>
        <p className="lead">{t.review.intro}</p>

        {confirmed ? (
          <div className="banner banner-info">
            <p>{fmt(t.review.editingBanner, { n: confirmed.revision })}</p>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => dispatch({ type: 'viewConfirmed' })}>
              {t.review.viewConfirmed}
            </button>
          </div>
        ) : null}

        {!complete ? (
          <div className="banner banner-warn" role="alert">
            <p className="banner-title">{fmt(t.review.missingTitle, { n: missing.length })}</p>
            <p>{t.review.missingIntro}</p>
            <ul className="missing-list">
              {missing.map((s) => (
                <li key={s.group}>
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => dispatch({ type: 'editFromReview', garment: s.garment, group: s.group })}
                  >
                    {t.groups[s.group].name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <DesignSheet
          product={product}
          selections={state.selections}
          mode="review"
          onEdit={(garment, group) => dispatch({ type: 'editFromReview', garment, group })}
        />
      </main>

      <footer className="footer">
        <button
          type="button"
          className="btn btn-secondary btn-large"
          onClick={() => {
            const target = missing[0] ?? { garment: state.cursor.garment, group: state.cursor.group };
            dispatch({ type: 'goTo', garment: target.garment, group: target.group });
          }}
        >
          <ChevronIcon dir="left" />
          {t.review.backToEdit}
        </button>
        <p className="footer-status" id="confirm-hint" role="status">
          {blockedMessage}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-large"
          disabled={!canConfirm}
          aria-describedby="confirm-hint"
          onClick={() => dispatch({ type: 'confirm', at: Date.now() })}
        >
          {t.review.confirm}
        </button>
      </footer>
    </>
  );
}

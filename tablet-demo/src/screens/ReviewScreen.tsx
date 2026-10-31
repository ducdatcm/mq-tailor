import { missingSteps, selectionsEqual } from '../catalog/rules';
import { DesignSheet } from '../components/DesignSheet';
import { ChevronIcon } from '../components/icons';
import { fmt } from '../content/copy';
import { productList, unitName } from '../order/labels';
import { useStore } from '../state/store';

export function ReviewScreen() {
  const { state, dispatch, t } = useStore();
  const missing = missingSteps(state.units, state.selections);
  const complete = missing.length === 0;
  const confirmed = state.confirmed;
  const unchanged = Boolean(confirmed) && selectionsEqual(state.units, confirmed!.selections, state.selections);
  const canConfirm = complete && !unchanged;

  const blockedMessage = !complete ? t.review.confirmBlocked : unchanged ? t.review.confirmUnchanged : null;

  return (
    <>
      <main className="content review">
        <h1 tabIndex={-1} data-screen-heading>
          {t.review.title}
        </h1>
        <p className="lead">{t.review.intro}</p>
        <p className="review-order" data-order-list>
          {fmt(t.start.quantityPieces, { list: productList(t, state.quantities) })}
        </p>

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
              {missing.map((s) => {
                const unit = state.units.find((u) => u.id === s.unit)!;
                const several = state.units.filter((u) => u.garment === unit.garment).length > 1;
                return (
                  <li key={`${s.unit}-${s.group}`}>
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => dispatch({ type: 'editFromReview', unit: s.unit, group: s.group })}
                    >
                      {several ? `${unitName(t, unit, state.units)} · ` : ''}
                      {t.groups[s.group].name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <DesignSheet
          units={state.units}
          selections={state.selections}
          mode="review"
          onEdit={(unit, group) => dispatch({ type: 'editFromReview', unit, group })}
        />
      </main>

      <footer className="footer">
        <button
          type="button"
          className="btn btn-secondary btn-large"
          onClick={() => {
            const target = missing[0] ?? { unit: state.cursor.unit, group: state.cursor.group };
            dispatch({ type: 'goTo', unit: target.unit, group: target.group });
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

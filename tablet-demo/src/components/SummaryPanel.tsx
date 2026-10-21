import { useId, useState } from 'react';
import { PRODUCTS, groupsFor } from '../catalog/catalog';
import { countSelected } from '../catalog/rules';
import { fmt } from '../content/copy';
import { useStore } from '../state/store';
import { CheckIcon, ChevronIcon } from './icons';

/**
 * Compact running summary. Always visible on wide tablets; on narrow widths it
 * collapses behind a toggle so it never takes the room the options need.
 */
export function SummaryPanel() {
  const { state, dispatch, t } = useStore();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const product = state.product!;
  const { done, total } = countSelected(product, state.selections);

  return (
    <aside className={`summary${open ? ' is-open' : ''}`} aria-label={t.configure.summaryTitle}>
      <button
        type="button"
        className="summary-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{fmt(t.configure.summaryToggle, { done, total })}</span>
        <ChevronIcon dir={open ? 'up' : 'down'} />
      </button>

      <div id={panelId} className="summary-panel">
        <p className="summary-progress" role="status">
          {done === total ? t.configure.allDone : fmt(t.configure.progress, { done, total })}
        </p>
        <div className="progress-bar" aria-hidden="true">
          <span style={{ width: `${(done / total) * 100}%` }} />
        </div>

        <button type="button" className="btn btn-secondary btn-block" onClick={() => dispatch({ type: 'openReview' })}>
          {t.configure.openReview}
        </button>

        {PRODUCTS[product].garments.map((garment) => (
          <section key={garment} className="summary-garment">
            <h3>{t.garments[product][garment]}</h3>
            <ul>
              {groupsFor(garment).map((g) => {
                const chosen = state.selections[garment][g.id];
                const isActive = state.screen === 'configure' && state.cursor.group === g.id;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      className={`summary-row${isActive ? ' is-active' : ''}${chosen ? '' : ' is-missing'}`}
                      aria-current={isActive ? 'step' : undefined}
                      aria-label={fmt(t.configure.jumpTo, { group: t.groups[g.id].name })}
                      onClick={() => dispatch({ type: 'goTo', garment, group: g.id })}
                    >
                      <span className="summary-mark" aria-hidden="true">
                        {chosen ? <CheckIcon size={16} /> : null}
                      </span>
                      <span className="summary-text">
                        <span className="summary-group">{t.groups[g.id].name}</span>
                        <span className="summary-value">{chosen ? t.options[chosen].label : t.configure.notSelected}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      </div>
    </aside>
  );
}

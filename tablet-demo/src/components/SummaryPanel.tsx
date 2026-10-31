import { useId, useState } from 'react';
import { groupsFor } from '../catalog/catalog';
import { countSelected, countUnit } from '../catalog/rules';
import { fmt } from '../content/copy';
import { unitName, unitPrefix } from '../order/labels';
import { useStore } from '../state/store';
import { CheckIcon, ChevronIcon } from './icons';

/**
 * Compact running summary. Always visible on wide tablets; on narrow widths it
 * collapses behind a toggle so it never takes the room the options need.
 * Only the piece being designed is opened out; the others show how far they are.
 */
export function SummaryPanel() {
  const { state, dispatch, t } = useStore();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { done, total } = countSelected(state.units, state.selections);

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

        {state.units.map((unit) => {
          const name = unitName(t, unit, state.units);
          const current = state.screen === 'configure' && state.cursor.unit === unit.id;
          const count = countUnit(unit, state.selections);
          const selections = state.selections[unit.id] ?? {};
          return (
            <section key={unit.id} className={`summary-garment${current ? ' is-current' : ''}`} data-summary-unit={unit.id}>
              <h3>
                <button
                  type="button"
                  className="summary-unit"
                  aria-expanded={current}
                  onClick={() => dispatch({ type: 'switchUnit', unit: unit.id })}
                >
                  <span>{name}</span>
                  <span className="summary-count">
                    {count.done}/{count.total}
                  </span>
                </button>
              </h3>
              {current ? (
                <ul>
                  {groupsFor(unit.garment, selections).map((g) => {
                    const chosen = selections[g.id];
                    const isActive = state.cursor.group === g.id || state.cursor.group === g.companionOf;
                    return (
                      <li key={g.id}>
                        <button
                          type="button"
                          className={`summary-row${isActive ? ' is-active' : ''}${chosen ? '' : ' is-missing'}`}
                          aria-current={isActive ? 'step' : undefined}
                          aria-label={fmt(t.configure.jumpTo, { group: `${unitPrefix(t, unit, state.units)}${t.groups[g.id].name}` })}
                          onClick={() => dispatch({ type: 'goTo', unit: unit.id, group: g.id })}
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
              ) : null}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

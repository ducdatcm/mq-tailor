import { groupsFor, type GroupId, type Unit } from '../catalog/catalog';
import type { Selections } from '../catalog/rules';
import { fmt } from '../content/copy';
import { unitName, unitPrefix } from '../order/labels';
import { OPTION_SKETCHES } from '../sketches/registry';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';
import { EditIcon } from './icons';

interface Props {
  units: readonly Unit[];
  selections: Selections;
  /** Review lets you edit/choose; the confirmed sheet is read-only. */
  mode: 'review' | 'confirmed';
  /** Previous confirmed revision, to mark what changed. */
  previous?: Selections | null;
  onEdit?: (unit: string, group: GroupId) => void;
}

/** Selections grouped by unit: one row per group with its own sketch thumbnail. */
export function DesignSheet({ units, selections, mode, previous, onEdit }: Props) {
  const { t } = useStore();

  return (
    <div className="sheet">
      {units.map((unit) => {
        const mine = selections[unit.id] ?? {};
        const name = unitName(t, unit, units);
        return (
          <section key={unit.id} className="sheet-garment" aria-labelledby={`sheet-${unit.id}`} data-sheet-unit={unit.id}>
            <h2 id={`sheet-${unit.id}`}>
              {name}
              {unit.product ? <span className="sheet-product">{t.products[unit.product].name}</span> : null}
            </h2>
            <ul className="sheet-rows">
              {groupsFor(unit.garment, mine).map((g) => {
                const chosen = mine[g.id];
                const before = previous?.[unit.id]?.[g.id];
                const changed = Boolean(previous) && before !== chosen;
                const groupName = t.groups[g.id].name;
                return (
                  <li key={g.id} className={`sheet-row${chosen ? '' : ' is-missing'}${changed ? ' is-changed' : ''}${g.noSketch ? ' is-plain' : ''}`} data-group={g.id}>
                    {g.noSketch ? null : chosen && !OPTION_SKETCHES[chosen] ? (
                      <span className="sheet-thumb sheet-thumb-blank" aria-hidden="true" />
                    ) : (
                      <span className="sheet-thumb">
                        {chosen ? <Sketch option={chosen} /> : <span className="sheet-thumb-empty">{t.review.notChosen}</span>}
                      </span>
                    )}
                    <span className="sheet-text">
                      <span className="sheet-group">
                        {groupName}
                        {t.groups[g.id].term ? <span className="option-term">{t.groups[g.id].term}</span> : null}
                      </span>
                      <span className="sheet-value">{chosen ? t.options[chosen].label : t.review.notChosen}</span>
                      {changed ? (
                        <span className="sheet-changed">
                          <span className="tag">{t.confirmed.changed}</span>
                          {before ? fmt(t.confirmed.wasValue, { value: t.options[before].label }) : null}
                        </span>
                      ) : null}
                    </span>
                    {mode === 'review' && onEdit ? (
                      <button
                        type="button"
                        className={`btn ${chosen ? 'btn-secondary' : 'btn-primary'} btn-small`}
                        aria-label={fmt(t.review.editLabel, { group: `${unitPrefix(t, unit, units)}${groupName}` })}
                        onClick={() => onEdit(unit.id, g.id)}
                      >
                        {chosen ? <EditIcon size={18} /> : null}
                        {chosen ? t.review.edit : t.review.chooseNow}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

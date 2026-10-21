import { PRODUCTS, groupsFor, type GarmentId, type GroupId, type ProductId } from '../catalog/catalog';
import type { Selections } from '../catalog/rules';
import { fmt } from '../content/copy';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';
import { EditIcon } from './icons';

interface Props {
  product: ProductId;
  selections: Selections;
  /** Review lets you edit/choose; the confirmed sheet is read-only. */
  mode: 'review' | 'confirmed';
  /** Previous confirmed revision, to mark what changed. */
  previous?: Selections | null;
  onEdit?: (garment: GarmentId, group: GroupId) => void;
}

/** Selections grouped by garment: one row per group with its own sketch thumbnail. */
export function DesignSheet({ product, selections, mode, previous, onEdit }: Props) {
  const { t } = useStore();

  return (
    <div className="sheet">
      {PRODUCTS[product].garments.map((garment) => (
        <section key={garment} className="sheet-garment" aria-labelledby={`sheet-${garment}`}>
          <h2 id={`sheet-${garment}`}>{t.garments[product][garment]}</h2>
          <ul className="sheet-rows">
            {groupsFor(garment).map((g) => {
              const chosen = selections[garment][g.id];
              const before = previous?.[garment][g.id];
              const changed = Boolean(previous) && before !== chosen;
              const name = t.groups[g.id].name;
              return (
                <li key={g.id} className={`sheet-row${chosen ? '' : ' is-missing'}${changed ? ' is-changed' : ''}`} data-group={g.id}>
                  <span className="sheet-thumb">
                    {chosen ? <Sketch option={chosen} /> : <span className="sheet-thumb-empty">{t.review.notChosen}</span>}
                  </span>
                  <span className="sheet-text">
                    <span className="sheet-group">
                      {name}
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
                      aria-label={fmt(t.review.editLabel, { group: name })}
                      onClick={() => onEdit(garment, g.id)}
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
      ))}
    </div>
  );
}

import { GROUP_BY_ID, type GroupId } from '../catalog/catalog';
import { disabledReason } from '../catalog/rules';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';
import { Modal } from './Modal';

interface Props {
  group: GroupId;
  onClose: () => void;
}

/**
 * A prepared house recommendation for one group. Nothing is chosen until the
 * user presses "Apply" — an unapplied suggestion is not a selection.
 */
export function SuggestionModal({ group, onClose }: Props) {
  const { state, dispatch, t } = useStore();
  const def = GROUP_BY_ID[group];
  const option = def.preset;
  const copy = t.options[option];
  // The suggestion is always for the group being viewed, on the garment being configured (the second trousers share the trousers groups).
  const garment = state.cursor.garment;
  const isCurrent = state.selections[garment][group] === option;
  const blocked = disabledReason(state.selections, garment, group, option) !== null;

  return (
    <Modal title={`${t.suggestion.title}: ${t.groups[group].name}`} onClose={onClose} closeLabel={t.close}>
      <p className="suggestion-why">{t.groups[group].suggestion}</p>
      <div className="suggestion-card">
        {def.noSketch ? null : (
          <span className="suggestion-sketch">
            <Sketch option={option} />
          </span>
        )}
        <span className="suggestion-text">
          <strong>{copy.label}</strong>
          {copy.term ? <span className="option-term">{copy.term}</span> : null}
          <span>{copy.desc}</span>
        </span>
      </div>
      <p className="fine-print">{t.suggestion.disclaimer}</p>
      {blocked ? <p className="notice">{t.suggestion.unavailable}</p> : null}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t.suggestion.decline}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={blocked || isCurrent}
          data-autofocus={!blocked && !isCurrent ? '' : undefined}
          onClick={() => {
            dispatch({ type: 'select', garment, group, option });
            onClose();
          }}
        >
          {isCurrent ? t.suggestion.applied : t.suggestion.apply}
        </button>
      </div>
    </Modal>
  );
}

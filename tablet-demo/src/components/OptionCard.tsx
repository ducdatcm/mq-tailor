import type { OptionId } from '../catalog/catalog';
import { fmt } from '../content/copy';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';
import { CheckIcon, ExpandIcon } from './icons';

interface Props {
  option: OptionId;
  selected: boolean;
  /** Visible reason this option cannot be chosen right now (null when available). */
  unavailableReason: string | null;
  onSelect: () => void;
  onZoom: () => void;
}

export function OptionCard({ option, selected, unavailableReason, onSelect, onZoom }: Props) {
  const { t } = useStore();
  const copy = t.options[option];
  const disabled = unavailableReason !== null;

  return (
    <div className={`option-wrap${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}>
      <button
        type="button"
        className="option"
        aria-pressed={selected}
        aria-disabled={disabled || undefined}
        data-option={option}
        onClick={() => {
          if (!disabled) onSelect();
        }}
      >
        <span className="option-sketch">
          <Sketch option={option} />
        </span>
        <span className="option-body">
          <span className="option-label">{copy.label}</span>
          {copy.term ? <span className="option-term">{copy.term}</span> : null}
          <span className="option-desc">{copy.desc}</span>
          {unavailableReason ? <span className="option-reason">{unavailableReason}</span> : null}
        </span>
        {selected ? (
          <span className="option-badge">
            <CheckIcon size={18} />
            {t.configure.selected}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="zoom-btn"
        onClick={onZoom}
        aria-label={fmt(t.configure.enlarge, { label: copy.label })}
      >
        <ExpandIcon size={20} />
      </button>
    </div>
  );
}

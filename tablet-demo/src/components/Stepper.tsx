import { groupsFor, type GroupId, type Unit } from '../catalog/catalog';
import { useStore } from '../state/store';
import { CheckIcon } from './icons';

interface Props {
  unit: Unit;
  active: GroupId;
}

/** One numbered stop per group of the current unit; every stop can be reopened. */
export function Stepper({ unit, active }: Props) {
  const { state, dispatch, t } = useStore();
  const selections = state.selections[unit.id] ?? {};
  // a group chosen on another group's screen has no stop of its own
  const groups = groupsFor(unit.garment, selections).filter((g) => !g.companionOf);

  return (
    <nav aria-label={t.configure.stepsLabel}>
      <ol className="stepper">
        {groups.map((g, i) => {
          const chosen = selections[g.id];
          const isActive = g.id === active;
          const label = `${t.groups[g.id].name} — ${
            chosen ? `${t.configure.stepDone}: ${t.options[chosen].label}` : t.configure.stepTodo
          }`;
          return (
            <li key={g.id}>
              <button
                type="button"
                className={`step${isActive ? ' is-active' : ''}${chosen ? ' is-done' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={label}
                onClick={() => dispatch({ type: 'goTo', unit: unit.id, group: g.id })}
              >
                <span className="step-dot">{chosen ? <CheckIcon size={20} /> : i + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

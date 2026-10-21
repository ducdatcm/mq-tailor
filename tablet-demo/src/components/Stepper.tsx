import { groupsFor, type GarmentId, type GroupId } from '../catalog/catalog';
import { useStore } from '../state/store';
import { CheckIcon } from './icons';

interface Props {
  garment: GarmentId;
  active: GroupId;
}

/** One numbered stop per group of the current garment; every stop can be reopened. */
export function Stepper({ garment, active }: Props) {
  const { state, dispatch, t } = useStore();
  const groups = groupsFor(garment);

  return (
    <nav aria-label={t.configure.stepsLabel}>
      <ol className="stepper">
        {groups.map((g, i) => {
          const chosen = state.selections[garment][g.id];
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
                onClick={() => dispatch({ type: 'goTo', garment, group: g.id })}
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

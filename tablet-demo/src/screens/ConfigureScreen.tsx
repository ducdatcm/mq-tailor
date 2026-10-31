import { useEffect, useId, useRef, useState } from 'react';
import { GROUP_BY_ID, groupsFor, stepsFor, type FamilyId, type GroupId, type OptionId } from '../catalog/catalog';
import { copyableUnits, countSelected, countUnit, disabledReason } from '../catalog/rules';
import { ChevronIcon } from '../components/icons';
import { Modal } from '../components/Modal';
import { OptionCard } from '../components/OptionCard';
import { Stepper } from '../components/Stepper';
import { SuggestionModal } from '../components/SuggestionModal';
import { SummaryPanel } from '../components/SummaryPanel';
import { fmt } from '../content/copy';
import { unitName } from '../order/labels';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';

export function ConfigureScreen() {
  const { state, dispatch, t } = useStore();
  const { unit: unitId, group } = state.cursor;
  const unit = state.units.find((u) => u.id === unitId)!;
  const mine = state.selections[unit.id] ?? {};
  const def = GROUP_BY_ID[group];
  const copy = t.groups[group];
  // groups chosen on this group's screen (the cuffs screen also asks functional or closed buttons)
  const companions = groupsFor(unit.garment, mine).filter((g) => g.companionOf === group);

  const steps = stepsFor(state.units, state.selections);
  const index = steps.findIndex((s) => s.group === group && s.unit === unit.id);
  const isFirst = index <= 0;
  const isLast = index === steps.length - 1;
  const unitSteps = steps.filter((s) => s.unit === unit.id);
  const unitIndex = unitSteps.findIndex((s) => s.group === group);

  // The earlier units of the same kind this one can copy ("same as the trousers already chosen").
  const copyable = copyableUnits(state.units, unit);
  const copying = state.sameAs[unit.id] ?? null;

  const [expanded, setExpanded] = useState<ReadonlySet<GroupId>>(new Set());
  const [suggestFor, setSuggestFor] = useState<GroupId | null>(null);
  const [zoom, setZoom] = useState<OptionId | null>(null);
  const [familyPick, setFamilyPick] = useState<Partial<Record<GroupId, FamilyId>>>({});
  const moreId = useId();
  const contentRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  // When the group changes, return to the top and put focus on the new heading.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (contentRef.current) contentRef.current.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
  }, [group, unitId]);

  const isOpen = expanded.has(group);
  const toggleMore = () =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const selected = mine[group];
  // Groups with many options are split into families; show the one holding the choice by default.
  const families = def.families;
  const heldBy = families?.find((f) => selected && f.options.includes(selected))?.id;
  const activeFamily = families ? (familyPick[group] ?? heldBy ?? families[0].id) : null;
  const shownOptions = families ? families.find((f) => f.id === activeFamily)!.options : def.options;
  const anyBlocked = def.options.some((o) => disabledReason(state.selections, unit, group, o));
  const progress = countSelected(state.units, state.selections);

  const pending = state.pending;
  const nameOf = (id: string) => unitName(t, state.units.find((u) => u.id === id)!, state.units);

  return (
    <>
      <main className="content configure" ref={contentRef}>
        <div className="configure-main">
          <div className="configure-top">
            {state.units.length > 1 ? (
              <div className="garment-tabs" role="group" aria-label={t.configure.garmentsLabel}>
                {state.units.map((u) => {
                  const done = countUnit(u, state.selections);
                  const active = u.id === unit.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`garment-tab${active ? ' is-active' : ''}`}
                      aria-pressed={active}
                      data-unit={u.id}
                      onClick={() => dispatch({ type: 'switchUnit', unit: u.id })}
                    >
                      <span>{unitName(t, u, state.units)}</span>
                      <span className="garment-count">
                        {done.done}/{done.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <Stepper unit={unit} active={group} />
          </div>

          {unit.product ? (
            <p className="unit-context">
              {unitName(t, unit, state.units)} · {t.products[unit.product].name}
              {(state.quantities[unit.product] ?? 0) > 1 ? ` (${unit.copy}/${state.quantities[unit.product]})` : ''}
            </p>
          ) : null}

          {copyable.length > 0 ? (
            <div className="same-as" role="group" aria-label={t.configure.sameAsTitle} data-same-as={unit.id}>
              <span className="same-as-label">{t.configure.sameAsTitle}</span>
              <div className="family-tabs">
                {copyable.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    className={`family-tab${copying === source.id ? ' is-active' : ''}`}
                    aria-pressed={copying === source.id}
                    data-same-as-source={source.id}
                    onClick={() => dispatch({ type: 'setSameAs', unit: unit.id, source: source.id })}
                  >
                    {fmt(t.configure.sameAsLike, { name: nameOf(source.id) })}
                  </button>
                ))}
                <button
                  type="button"
                  className={`family-tab${copying === null ? ' is-active' : ''}`}
                  aria-pressed={copying === null}
                  data-same-as-source="none"
                  onClick={() => dispatch({ type: 'setSameAs', unit: unit.id, source: null })}
                >
                  {t.configure.sameAsOwn}
                </button>
              </div>
              <p className="same-as-hint">
                {copying ? fmt(t.configure.sameAsHintOn, { name: nameOf(copying) }) : t.configure.sameAsHintOff}
              </p>
            </div>
          ) : null}

          <section className="group" aria-labelledby="group-title">
            <div className="group-head">
              <h1 id="group-title" ref={headingRef} tabIndex={-1} data-screen-heading className="group-title">
                {copy.name}
                {copy.term ? <span className="option-term">{copy.term}</span> : null}
              </h1>
              <div className="group-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setSuggestFor(group)}>
                  {t.configure.askHouse}
                </button>
                <button
                  type="button"
                  className="btn btn-quiet"
                  aria-expanded={isOpen}
                  aria-controls={moreId}
                  onClick={toggleMore}
                >
                  {isOpen ? t.configure.hideMore : t.configure.learnMore}
                  <ChevronIcon dir={isOpen ? 'up' : 'down'} />
                </button>
              </div>
            </div>
            <p className="group-difference">{copy.difference}</p>

            <div id={moreId} className="more" hidden={!isOpen}>
              <div className="more-block">
                <h3>{t.configure.askLabel}</h3>
                <p>{copy.ask}</p>
              </div>
              <div className="more-block">
                <h3>{t.configure.moreLabel}</h3>
                <p>{copy.more}</p>
              </div>
            </div>

            {families ? (
              <div className="family-tabs" role="group" aria-label={t.configure.familiesLabel}>
                {families.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`family-tab${f.id === activeFamily ? ' is-active' : ''}`}
                    aria-pressed={f.id === activeFamily}
                    onClick={() => setFamilyPick((prev) => ({ ...prev, [group]: f.id }))}
                  >
                    {f.id === 'single' ? t.configure.familySingle : t.configure.familyDouble}
                  </button>
                ))}
              </div>
            ) : null}

            <div
              className={`options${def.noSketch ? ' is-plain' : shownOptions.length === 4 ? ' is-compact' : ''}`}
              role="group"
              aria-label={fmt(t.configure.optionsOf, { group: copy.name })}
              style={{ ['--cols' as string]: def.noSketch ? Math.min(shownOptions.length, 4) : shownOptions.length === 4 ? 2 : Math.min(shownOptions.length, 3) }}
            >
              {shownOptions.map((option) => {
                const reason = disabledReason(state.selections, unit, group, option);
                return (
                  <OptionCard
                    key={option}
                    option={option}
                    selected={selected === option}
                    unavailableReason={reason ? t.lapelRule.disabledReason : null}
                    plain={def.noSketch}
                    onSelect={() => dispatch({ type: 'select', unit: unit.id, group, option })}
                    onZoom={() => setZoom(option)}
                  />
                );
              })}
            </div>

            {copy.note ? <p className="group-note">{copy.note}</p> : null}

            {companions.map((c) => (
              <div key={c.id} className="companion" role="group" aria-labelledby={`companion-${c.id}`} data-companion={c.id}>
                <h2 id={`companion-${c.id}`} className="companion-title">
                  {t.groups[c.id].name}
                  {t.groups[c.id].term ? <span className="option-term">{t.groups[c.id].term}</span> : null}
                </h2>
                <p className="group-difference">{t.groups[c.id].difference}</p>
                <div className="options is-plain" role="group" aria-label={fmt(t.configure.optionsOf, { group: t.groups[c.id].name })} style={{ ['--cols' as string]: c.options.length }}>
                  {c.options.map((option) => (
                    <OptionCard
                      key={option}
                      option={option}
                      plain
                      selected={mine[c.id] === option}
                      unavailableReason={null}
                      onSelect={() => dispatch({ type: 'select', unit: unit.id, group: c.id, option })}
                      onZoom={() => undefined}
                    />
                  ))}
                </div>
              </div>
            ))}

            {anyBlocked ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'goTo', unit: unit.id, group: 'closure' })}
              >
                {t.configure.changeClosure}
              </button>
            ) : null}
          </section>
        </div>

        <SummaryPanel />
      </main>

      <footer className="footer">
        <button
          type="button"
          className={`btn btn-secondary btn-large${isFirst ? ' is-invisible' : ''}`}
          disabled={isFirst}
          onClick={() => dispatch({ type: 'back' })}
        >
          <ChevronIcon dir="left" />
          {t.configure.back}
        </button>
        <p className="footer-status" role="status">
          {fmt(t.configure.groupOf, { n: unitIndex + 1, total: unitSteps.length })} · {fmt(t.configure.progress, progress)}
        </p>
        {state.returnToReview ? (
          <button type="button" className="btn btn-primary btn-large" onClick={() => dispatch({ type: 'backToReview' })}>
            {t.configure.doneBackToReview}
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-large" onClick={() => dispatch({ type: 'next' })}>
            {isLast ? t.configure.toReview : t.configure.next}
            <ChevronIcon dir="right" />
          </button>
        )}
      </footer>

      {suggestFor ? <SuggestionModal group={suggestFor} onClose={() => setSuggestFor(null)} /> : null}

      {zoom ? (
        <Modal title={t.options[zoom].label} size="wide" onClose={() => setZoom(null)} closeLabel={t.close}>
          <div className="zoom-sketch">
            <Sketch option={zoom} title={t.options[zoom].label} />
          </div>
          <p>{t.options[zoom].desc}</p>
          {copy.note ? <p className="fine-print">{copy.note}</p> : null}
        </Modal>
      ) : null}

      {pending ? (
        <Modal
          role="alertdialog"
          title={t.lapelRule.title}
          onClose={() => dispatch({ type: 'cancelPending' })}
          closeLabel={t.close}
        >
          <p>{t.lapelRule.body}</p>
          <ul className="change-list">
            <li>
              <span>{t.groups.closure.name}</span>
              <strong>{t.options[pending.option].label}</strong>
            </li>
            <li>
              <span>{t.groups.lapel.name}</span>
              <strong>
                {state.selections[pending.unit]?.lapel ? t.options[state.selections[pending.unit].lapel!].label : t.configure.notSelected}
                {' → '}
                {pending.next[pending.unit]?.lapel ? t.options[pending.next[pending.unit].lapel!].label : ''}
              </strong>
            </li>
          </ul>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              data-autofocus
              onClick={() => dispatch({ type: 'cancelPending' })}
            >
              {t.lapelRule.cancel}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'acceptPending' })}>
              {t.lapelRule.accept}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

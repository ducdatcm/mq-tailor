import { useEffect, useId, useRef, useState } from 'react';
import { GROUP_BY_ID, PRODUCTS, stepsFor, type GroupId, type OptionId } from '../catalog/catalog';
import { countGarment, countSelected, disabledReason } from '../catalog/rules';
import { ChevronIcon } from '../components/icons';
import { Modal } from '../components/Modal';
import { OptionCard } from '../components/OptionCard';
import { Stepper } from '../components/Stepper';
import { SuggestionModal } from '../components/SuggestionModal';
import { SummaryPanel } from '../components/SummaryPanel';
import { fmt } from '../content/copy';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';

export function ConfigureScreen() {
  const { state, dispatch, t } = useStore();
  const product = state.product!;
  const { garment, group } = state.cursor;
  const def = GROUP_BY_ID[group];
  const copy = t.groups[group];

  const steps = stepsFor(product);
  const index = steps.findIndex((s) => s.group === group && s.garment === garment);
  const isFirst = index <= 0;
  const isLast = index === steps.length - 1;
  const garmentSteps = steps.filter((s) => s.garment === garment);
  const garmentIndex = garmentSteps.findIndex((s) => s.group === group);

  const [expanded, setExpanded] = useState<ReadonlySet<GroupId>>(new Set());
  const [suggestFor, setSuggestFor] = useState<GroupId | null>(null);
  const [zoom, setZoom] = useState<OptionId | null>(null);
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
  }, [group, garment]);

  const isOpen = expanded.has(group);
  const toggleMore = () =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const selected = state.selections[garment][group];
  const anyBlocked = def.options.some((o) => disabledReason(state.selections, garment, group, o));
  const garments = PRODUCTS[product].garments;
  const progress = countSelected(product, state.selections);

  const pending = state.pending;

  return (
    <>
      <main className="content configure" ref={contentRef}>
        <div className="configure-main">
          <div className="configure-top">
            {garments.length > 1 ? (
              <div className="garment-tabs" role="group" aria-label={t.configure.garmentsLabel}>
                {garments.map((g) => {
                  const done = countGarment(g, state.selections);
                  const active = g === garment;
                  return (
                    <button
                      key={g}
                      type="button"
                      className={`garment-tab${active ? ' is-active' : ''}`}
                      aria-pressed={active}
                      onClick={() => dispatch({ type: 'switchGarment', garment: g })}
                    >
                      <span>{t.garments[product][g]}</span>
                      <span className="garment-count">
                        {done.done}/{done.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <Stepper garment={garment} active={group} />
          </div>

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

            <div
              className="options"
              role="group"
              aria-label={fmt(t.configure.optionsOf, { group: copy.name })}
              style={{ ['--cols' as string]: def.options.length }}
            >
              {def.options.map((option) => {
                const reason = disabledReason(state.selections, garment, group, option);
                return (
                  <OptionCard
                    key={option}
                    option={option}
                    selected={selected === option}
                    unavailableReason={reason ? t.lapelRule.disabledReason : null}
                    onSelect={() => dispatch({ type: 'select', garment, group, option })}
                    onZoom={() => setZoom(option)}
                  />
                );
              })}
            </div>

            {copy.note ? <p className="group-note">{copy.note}</p> : null}
            {anyBlocked ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'goTo', garment: 'jacket', group: 'closure' })}
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
          {fmt(t.configure.groupOf, { n: garmentIndex + 1, total: garmentSteps.length })} · {fmt(t.configure.progress, progress)}
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
                {state.selections.jacket.lapel ? t.options[state.selections.jacket.lapel].label : t.configure.notSelected}
                {' → '}
                {pending.next.jacket.lapel ? t.options[pending.next.jacket.lapel].label : ''}
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

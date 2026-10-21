import { PRODUCT_IDS } from '../catalog/catalog';
import { CheckIcon } from '../components/icons';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';

export function StartScreen() {
  const { state, dispatch, t } = useStore();
  const ready = state.startProduct !== null;

  return (
    <>
      <main className="content start">
        <div className="start-intro">
          <h1 tabIndex={-1} data-screen-heading>
            {t.start.title}
          </h1>
          <p>{t.start.intro}</p>
        </div>

        <section aria-labelledby="start-products">
          <h2 id="start-products" className="eyebrow">
            {t.start.productsLabel}
          </h2>
          <div className="product-grid" role="group" aria-labelledby="start-products">
            {PRODUCT_IDS.map((id) => {
              const selected = state.startProduct === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`product-card${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  data-product={id}
                  onClick={() => dispatch({ type: 'chooseProduct', product: id })}
                >
                  <span className="product-sketch">
                    <Sketch product={id} />
                  </span>
                  <span className="product-name">{t.products[id].name}</span>
                  <span className="product-desc">{t.products[id].desc}</span>
                  {selected ? (
                    <span className="option-badge">
                      <CheckIcon size={18} />
                      {t.configure.selected}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="start-mode">
          <h2 id="start-mode" className="eyebrow">
            {t.start.modeLabel}
          </h2>
          <div className="mode-grid" role="group" aria-labelledby="start-mode">
            {(['manual', 'preset'] as const).map((mode) => {
              const copy = mode === 'manual' ? t.start.modeManual : t.start.modePreset;
              const selected = state.startMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  className={`mode-card${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  data-mode={mode}
                  onClick={() => dispatch({ type: 'chooseMode', mode })}
                >
                  <span className="mode-check" aria-hidden="true">
                    {selected ? <CheckIcon size={18} /> : null}
                  </span>
                  <span className="mode-text">
                    <span className="mode-title">{copy.title}</span>
                    <span className="mode-desc">{copy.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="footer footer-center">
        {!ready ? (
          <p className="footer-hint" id="start-hint">
            {t.start.needProduct}
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-primary btn-large"
          disabled={!ready}
          aria-describedby={!ready ? 'start-hint' : undefined}
          onClick={() => dispatch({ type: 'start' })}
        >
          {t.start.cta}
        </button>
      </footer>
    </>
  );
}

import { PRODUCT_IDS, totalQuantity } from '../catalog/catalog';
import { CheckIcon } from '../components/icons';
import { QuantityStepper } from '../components/QuantityStepper';
import { fmt } from '../content/copy';
import { productList } from '../order/labels';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';

export function StartScreen() {
  const { state, dispatch, t } = useStore();
  const ready = totalQuantity(state.quantities) > 0;

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
              const quantity = state.quantities[id] ?? 0;
              const selected = quantity > 0;
              return (
                <div key={id} className={`product-card${selected ? ' is-selected' : ''}`}>
                  <button
                    type="button"
                    className="product-pick"
                    aria-pressed={selected}
                    data-product={id}
                    onClick={() => {
                      if (!selected) dispatch({ type: 'setQuantity', product: id, value: 1 });
                    }}
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
                  <QuantityStepper product={id} />
                </div>
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
        {ready ? (
          <p className="footer-hint qty-pieces" data-order-list>
            {fmt(t.start.quantityPieces, { list: productList(t, state.quantities) })}
          </p>
        ) : (
          <p className="footer-hint" id="start-hint">
            {t.start.needProduct}
          </p>
        )}
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

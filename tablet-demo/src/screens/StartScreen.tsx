import { PRODUCT_IDS, PRODUCTS, totalQuantity, type PieceKind, type ProductId } from '../catalog/catalog';
import { ArrowIcon, CheckIcon } from '../components/icons';
import { QuantityStepper } from '../components/QuantityStepper';
import { productCounts } from '../order/lines';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';

/** What one of the product is made of, e.g. 1 jacket and 2 trousers. */
function pieceCounts(id: ProductId) {
  const counts = new Map<PieceKind, number>();
  for (const garment of PRODUCTS[id].pieces) counts.set(garment, (counts.get(garment) ?? 0) + 1);
  // always jacket, trousers, waistcoat, whatever order the pieces are made in
  return (['jacket', 'trousers', 'waistcoat', 'shirt'] as const).filter((g) => counts.has(g)).map((garment) => ({ garment, count: counts.get(garment)! }));
}

export function StartScreen() {
  const { state, dispatch, t } = useStore();
  const ready = totalQuantity(state.quantities) > 0;

  return (
    <>
      <main className="content start">
        <div className="start-intro">
          <div className="start-heading">
            <span className="eyebrow">{t.start.eyebrow}</span>
            <h1 tabIndex={-1} data-screen-heading>
              {t.start.title}
            </h1>
          </div>
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
                    <span className="product-name">{t.products[id].title}</span>
                    {selected ? (
                      <span className="option-badge">
                        <CheckIcon size={16} />
                        {t.configure.selected}
                      </span>
                    ) : null}
                  </button>
                  <div className="product-foot">
                    <ul className="product-pieces">
                      {pieceCounts(id).map(({ garment, count }) => (
                        <li key={garment} className="chip">
                          <b>{count}</b> × {t.garments[garment]}
                        </li>
                      ))}
                    </ul>
                    <QuantityStepper product={id} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="footer start-footer">
        <div className="start-order">
          {ready ? (
            <>
              <span className="eyebrow">{t.start.orderLabel}</span>
              <p className="chips" data-order-list>
                {productCounts(state.quantities).map(({ product, quantity }, i) => (
                  <span key={product}>
                    {i > 0 ? <span hidden> · </span> : null}
                    <span className="chip chip-strong">
                      {t.products[product].name} × {quantity}
                    </span>
                  </span>
                ))}
              </p>
            </>
          ) : (
            <p className="footer-hint" id="start-hint">
              {t.start.needProduct}
            </p>
          )}
        </div>
        <div className="start-actions">
          <button
            type="button"
            className="btn btn-primary btn-large"
            disabled={!ready}
            aria-describedby={!ready ? 'start-hint' : undefined}
            onClick={() => dispatch({ type: 'start' })}
          >
            {t.start.cta}
            <ArrowIcon />
          </button>
        </div>
      </footer>
    </>
  );
}


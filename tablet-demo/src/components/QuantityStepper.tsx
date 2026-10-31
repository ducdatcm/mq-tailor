import { MAX_QUANTITY, MIN_QUANTITY, type ProductId } from '../catalog/catalog';
import { fmt } from '../content/copy';
import { useStore } from '../state/store';

/** How many of one product are in the order: minus, a number that can also be typed, plus. */
export function QuantityStepper({ product }: { product: ProductId }) {
  const { state, dispatch, t } = useStore();
  const value = state.quantities[product] ?? 0;
  const name = t.products[product].name;
  const set = (next: number) => dispatch({ type: 'setQuantity', product, value: next });

  return (
    <div className="qty" role="group" aria-label={`${t.start.quantityLabel}: ${name}`} data-quantity={product}>
      <div className="qty-controls">
        <button
          type="button"
          className="btn btn-secondary qty-btn"
          aria-label={fmt(t.start.quantityMinus, { name })}
          disabled={value <= MIN_QUANTITY}
          data-qty="minus"
          onClick={() => set(value - 1)}
        >
          −
        </button>
        <input
          className="field-input qty-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`${t.start.quantityLabel}: ${name}`}
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => set(Number(e.target.value.replace(/\D/g, '').slice(0, 3)))}
        />
        <button
          type="button"
          className="btn btn-secondary qty-btn"
          aria-label={fmt(t.start.quantityPlus, { name })}
          disabled={value >= MAX_QUANTITY}
          data-qty="plus"
          onClick={() => set(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

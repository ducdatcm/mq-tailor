import { GROUP_LIST, PRODUCT_IDS } from '../catalog/catalog';
import { getCopy } from '../content';
import { Sketch } from './Sketch';

/**
 * Reference sheet of every drawing (open the app with #/sketches). Not linked
 * from the customer flow — used for the visual check and for house approval.
 */
export function Gallery() {
  const t = getCopy('vi');
  return (
    <main className="gallery">
      <h1>Sketch gallery</h1>
      <p className="gallery-note">Tất cả hình minh họa trong demo. Dùng để duyệt hình, không nằm trong luồng khách hàng.</p>
      {GROUP_LIST.filter((g) => !g.noSketch).map((g) => (
        <section key={g.id} className="gallery-group">
          <h2>
            {g.garment === 'jacket' ? 'Áo' : g.garment === 'waistcoat' ? 'Gile' : 'Quần'} · {t.groups[g.id].name}
          </h2>
          <div className="gallery-row">
            {g.options.map((o) => (
              <figure key={o} className="gallery-item">
                <Sketch option={o} className="gallery-sketch" />
                <figcaption>
                  {t.options[o].label} <code>{o}</code>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <section className="gallery-group">
        <h2>Sản phẩm</h2>
        <div className="gallery-row">
          {PRODUCT_IDS.map((p) => (
            <figure key={p} className="gallery-item">
              <Sketch product={p} className="gallery-sketch" />
              <figcaption>{t.products[p].name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}

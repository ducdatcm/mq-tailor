import { GROUP_BY_ID, GROUP_LIST, PRODUCT_IDS, type GroupDef, type OptionId } from '../catalog/catalog';
import { getCopy } from '../content';
import { OPTION_SKETCHES, SKETCH_FOLLOWS } from './registry';
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
      {GROUP_LIST.filter((g) => !g.noSketch).flatMap((g) => {
        // a group whose drawings follow another choice is shown once for each of its options
        const follows = SKETCH_FOLLOWS[g.id];
        const variants: (OptionId | null)[] = follows ? [...GROUP_BY_ID[follows].options] : [null];
        return variants.map((v) => (
          <section key={`${g.id}${v ?? ''}`} className="gallery-group">
            <h2>
              {garmentName(g)} · {t.groups[g.id].name}
              {v && follows ? ` · ${t.groups[follows].name}: ${t.options[v].label}` : null}
            </h2>
            <div className="gallery-row">
              {g.options.filter((o) => OPTION_SKETCHES[o]).map((o) => (
                <figure key={o} className="gallery-item">
                  <Sketch option={o} className="gallery-sketch" chosen={v && follows ? { [follows]: v } : undefined} />
                  <figcaption>
                    {t.options[o].label} <code>{o}</code>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ));
      })}
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

function garmentName(g: GroupDef): string {
  return g.garment === 'jacket' ? 'Áo' : g.garment === 'waistcoat' ? 'Gile' : g.garment === 'shirt' ? 'Sơ mi' : 'Quần';
}

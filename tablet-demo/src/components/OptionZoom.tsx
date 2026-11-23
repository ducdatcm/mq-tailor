import type { GarmentSelections, OptionId } from '../catalog/catalog';
import { useOptionPhotos } from '../photos/optionPhotos';
import { Sketch } from '../sketches/Sketch';
import { useStore } from '../state/store';
import { Modal } from './Modal';
import { PhotoViewer } from './PhotoViewer';

/** A choice enlarged: its drawing, and beside it the real photos when the house has linked some. */
export function OptionZoom({ option, note, chosen, onClose }: { option: OptionId; note?: string; chosen?: GarmentSelections; onClose: () => void }) {
  const { t } = useStore();
  const photos = useOptionPhotos(option);
  const copy = t.options[option];

  return (
    <Modal title={copy.label} size={photos.length ? 'xl' : 'wide'} onClose={onClose} closeLabel={t.close}>
      {photos.length ? (
        <div className="zoom-pair">
          <section aria-label={t.configure.drawing}>
            <h3 className="eyebrow">{t.configure.drawing}</h3>
            <div className="zoom-sketch">
              <Sketch option={option} title={copy.label} chosen={chosen} />
            </div>
          </section>
          <section aria-label={t.configure.photos}>
            <h3 className="eyebrow">{t.configure.photos}</h3>
            <PhotoViewer photos={photos} />
          </section>
        </div>
      ) : (
        <div className="zoom-sketch">
          <Sketch option={option} title={copy.label} chosen={chosen} />
        </div>
      )}
      <p>{copy.desc}</p>
      {note ? <p className="fine-print">{note}</p> : null}
    </Modal>
  );
}

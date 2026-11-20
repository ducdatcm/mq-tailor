import { useState } from 'react';
import { fmt } from '../content/copy';
import type { OptionPhoto } from '../photos/optionPhotos';
import { useStore } from '../state/store';
import { ChevronIcon, ExpandIcon } from './icons';

/**
 * The real photos of a choice, one at a time and shown whole (never cropped): previous / next, the
 * caption and "Photo 1 of 3". Tapping the photo opens it full screen (PhotoSwipe, loaded only then),
 * where it can be pinched, double-tapped or zoomed with the buttons, dragged, and swiped to the next one.
 */
export function PhotoViewer({ photos }: { photos: readonly OptionPhoto[] }) {
  const { state, t } = useStore();
  const [index, setIndex] = useState(0);
  const i = Math.min(index, photos.length - 1);
  const photo = photos[i];
  const captionOf = (p: OptionPhoto) => (state.lang === 'vi' ? p.altVi : p.altEn) || p.altVi || p.altEn;
  const caption = captionOf(photo);
  const many = photos.length > 1;
  const ratio = photo.height ? `${photo.width} / ${photo.height}` : '4 / 3';

  const openFull = async () => {
    const [{ default: PhotoSwipe }] = await Promise.all([import('photoswipe'), import('photoswipe/style.css')]);
    const pswp = new PhotoSwipe({
      dataSource: photos.map((p) => {
        const big = p.full ?? { src: p.src, width: p.width, height: p.height };
        return { src: big.src, msrc: p.src, width: big.width, height: big.height ?? Math.round((big.width * 3) / 4), alt: captionOf(p) };
      }),
      index: i,
      bgOpacity: 0.94,
      maxZoomLevel: 4,
      secondaryZoomLevel: 2.5,
      wheelToZoom: true,
      imageClickAction: 'zoom-or-close',
      tapAction: 'toggle-controls',
      doubleTapAction: 'zoom',
      showHideAnimationType: 'fade',
      closeTitle: t.close,
      zoomTitle: t.configure.zoomPhoto,
      arrowPrevTitle: t.configure.prevPhoto,
      arrowNextTitle: t.configure.nextPhoto,
      errorMsg: t.configure.photoError,
    });
    pswp.on('change', () => setIndex(pswp.currIndex));
    pswp.init();
  };

  return (
    <figure className="photo-viewer" data-photo-viewer>
      <div className="photo-frame" style={{ aspectRatio: ratio }}>
        <button type="button" className="photo-open" onClick={() => void openFull()} aria-label={fmt(t.configure.openPhoto, { caption: caption || t.configure.photos })}>
          <img key={photo.src} src={photo.src} alt={caption} width={photo.width} height={photo.height ?? undefined} draggable={false} />
          <span className="photo-zoom-hint" aria-hidden="true">
            <ExpandIcon size={18} />
          </span>
        </button>
        {many ? (
          <>
            <button
              type="button"
              className="photo-nav photo-prev"
              aria-label={t.configure.prevPhoto}
              onClick={() => setIndex((i - 1 + photos.length) % photos.length)}
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              className="photo-nav photo-next"
              aria-label={t.configure.nextPhoto}
              onClick={() => setIndex((i + 1) % photos.length)}
            >
              <ChevronIcon dir="right" />
            </button>
          </>
        ) : null}
      </div>
      <figcaption className="photo-caption">
        {caption ? <span>{caption}</span> : null}
        {many ? (
          <span className="photo-count" aria-live="polite">
            {fmt(t.configure.photoCount, { n: i + 1, total: photos.length })}
          </span>
        ) : null}
      </figcaption>
      <p className="photo-hint">{t.configure.photoHint}</p>
    </figure>
  );
}

import { useState } from 'react';
import { fmt } from '../content/copy';
import type { OptionPhoto } from '../photos/optionPhotos';
import { useStore } from '../state/store';
import { ChevronIcon, ExpandIcon } from './icons';

/** The real pixel size of a picture, read from the file (after any EXIF turn the browser applies). */
function naturalSize(src: string): Promise<{ w: number; h: number }> {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => ({ w: img.naturalWidth, h: img.naturalHeight }));
}

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
  // The size the website records can be wrong for older uploads (an upright phone photo recorded sideways),
  // so the shape comes from the picture itself once it has loaded.
  const [shapes, setShapes] = useState<Record<string, { w: number; h: number }>>({});
  const shape = shapes[photo.src] ?? (photo.height ? { w: photo.width, h: photo.height } : { w: 4, h: 3 });

  const openFull = async () => {
    const [{ default: PhotoSwipe }, items] = await Promise.all([
      import('photoswipe'),
      // each full-screen copy is measured before opening (it comes from the copy kept on the tablet)
      Promise.all(
        photos.map(async (p) => {
          const big = p.full ?? { src: p.src, width: p.width, height: p.height };
          const size = await naturalSize(big.src).catch(() => null);
          const width = size?.w ?? big.width;
          const height = size?.h ?? big.height ?? Math.round((big.width * 3) / 4);
          return { src: big.src, msrc: p.src, width, height, alt: captionOf(p) };
        }),
      ),
      import('photoswipe/style.css'),
    ]);
    const pswp = new PhotoSwipe({
      dataSource: items,
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
      <div
        className="photo-frame"
        // its own shape, as wide as the column allows but never taller than 62 % of the screen (a tall photo narrows)
        style={{ aspectRatio: `${shape.w} / ${shape.h}`, width: `min(100%, calc(62vh * ${shape.w / shape.h}))` }}
      >
        <button type="button" className="photo-open" onClick={() => void openFull()} aria-label={fmt(t.configure.openPhoto, { caption: caption || t.configure.photos })}>
          <img
            key={photo.src}
            src={photo.src}
            alt={caption}
            draggable={false}
            onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              if (w && h) setShapes((s) => (s[photo.src]?.w === w && s[photo.src]?.h === h ? s : { ...s, [photo.src]: { w, h } }));
            }}
          />
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

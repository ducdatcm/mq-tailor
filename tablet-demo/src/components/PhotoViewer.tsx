import { useState } from 'react';
import { fmt } from '../content/copy';
import type { OptionPhoto } from '../photos/optionPhotos';
import { useStore } from '../state/store';
import { ChevronIcon } from './icons';

/** The real photos of a choice, one at a time: previous / next, the caption and "Photo 1 of 3". */
export function PhotoViewer({ photos }: { photos: readonly OptionPhoto[] }) {
  const { state, t } = useStore();
  const [index, setIndex] = useState(0);
  const i = Math.min(index, photos.length - 1);
  const photo = photos[i];
  const caption = (state.lang === 'vi' ? photo.altVi : photo.altEn) || photo.altVi || photo.altEn;
  const many = photos.length > 1;

  return (
    <figure className="photo-viewer" data-photo-viewer>
      <div className="photo-frame">
        <img
          key={photo.src}
          src={photo.src}
          alt={caption}
          width={photo.width}
          height={photo.height ?? undefined}
          style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }}
          draggable={false}
        />
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
    </figure>
  );
}

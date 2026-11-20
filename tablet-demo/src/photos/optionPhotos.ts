import { useSyncExternalStore } from 'react';
import type { OptionId } from '../catalog/catalog';

/**
 * Real photos of the choices, linked to them in the website's Media Library (admin › Media Library ›
 * Tablet choices). The website lists them at ./api/option-photos (next to the app at /tablet/) and
 * passes each photo on from ./api/photo/<id>/<width>.webp.
 *
 * The list is kept on the tablet (localStorage) and every photo in it is copied into the "mq-photos"
 * cache, which the offline worker answers from: the photos show without a connection too. Photos
 * no longer in the list are dropped from the cache. With no website behind the app (local demo),
 * there are simply no photos.
 */
export interface OptionPhoto {
  id: number;
  /** relative to the app, e.g. "api/photo/7/1200.webp" */
  src: string;
  width: number;
  height: number | null;
  altVi: string;
  altEn: string;
  /** where to keep the crop centred, in % of the photo */
  focalX: number;
  focalY: number;
}

export type PhotoMap = Partial<Record<OptionId, OptionPhoto[]>>;

const STORAGE_KEY = 'mq-tablet-demo/option-photos';
export const PHOTO_CACHE = 'mq-photos';
const LIST_URL = './api/option-photos';

function readSaved(): PhotoMap {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? ((JSON.parse(saved) as { photos?: PhotoMap }).photos ?? {}) : {};
  } catch {
    return {};
  }
}

let photos: PhotoMap = readSaved();
const listeners = new Set<() => void>();

function setPhotos(next: PhotoMap) {
  photos = next;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The photos of one choice (none when it has no photo or there is no option). */
export function useOptionPhotos(option: OptionId | null | undefined): readonly OptionPhoto[] {
  const all = useSyncExternalStore(subscribe, () => photos);
  return (option && all[option]) || NONE;
}
const NONE: readonly OptionPhoto[] = [];

const isPhoto = (p: unknown): p is OptionPhoto =>
  typeof p === 'object' && p !== null && typeof (p as OptionPhoto).src === 'string' && /^api\/photo\/\d+\/\d+\.webp$/.test((p as OptionPhoto).src);

/** Keeps only well-formed entries: a photo list from the network is not trusted blindly. */
function clean(data: unknown): PhotoMap | null {
  if (typeof data !== 'object' || data === null || typeof (data as { photos?: unknown }).photos !== 'object') return null;
  const out: PhotoMap = {};
  for (const [option, list] of Object.entries((data as { photos: Record<string, unknown> }).photos ?? {})) {
    if (!Array.isArray(list)) continue;
    const good = list.filter(isPhoto);
    if (good.length) out[option as OptionId] = good;
  }
  return out;
}

/** Copies every listed photo into the offline cache (a few at a time) and drops the ones no longer listed. */
async function keepOffline(map: PhotoMap): Promise<void> {
  if (typeof caches === 'undefined') return;
  const wanted = new Set(
    Object.values(map)
      .flat()
      .map((p) => new URL(p!.src, window.location.href).href),
  );
  const cache = await caches.open(PHOTO_CACHE);
  const have = new Set<string>();
  for (const request of await cache.keys()) {
    if (wanted.has(request.url)) have.add(request.url);
    else await cache.delete(request);
  }
  const missing = [...wanted].filter((url) => !have.has(url));
  const worker = async () => {
    for (let url = missing.shift(); url; url = missing.shift()) {
      try {
        await cache.add(url);
      } catch {
        /* offline or gone: tried again next time */
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}

/** Asks the website for the current photo list; keeps the saved one when offline or without a website. */
export async function refreshOptionPhotos(): Promise<void> {
  try {
    const res = await fetch(LIST_URL, { cache: 'no-cache', headers: { accept: 'application/json' } });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return;
    const next = clean(await res.json());
    if (!next) return;
    setPhotos(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ photos: next, savedAt: Date.now() }));
    } catch {
      /* storage full or blocked: the list still works for this visit */
    }
    await keepOffline(next);
  } catch {
    /* offline: the saved list stays */
  }
}

/** For tests: replace the photo list. */
export function setOptionPhotosForTest(next: PhotoMap) {
  setPhotos(next);
}

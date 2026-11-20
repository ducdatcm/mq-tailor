const fs = require('node:fs');
const path = require('node:path');
const db = require('../config/db');

/**
 * Photos for the in-store tablet app: Media Library photos linked to the app's choices
 * (table media_tablet_options). The choices themselves come from tablet-app/options.json,
 * written by the tablet build (`npm run build:site` in tablet-demo/).
 */

const OPTIONS_FILE = path.join(__dirname, '..', '..', 'tablet-app', 'options.json');

let cached = null;
/** Pieces › groups › choices with Vietnamese names, plus a lookup by choice id. Re-read when the build changes. */
function readTabletOptions() {
  let mtime = 0;
  try {
    mtime = fs.statSync(OPTIONS_FILE).mtimeMs;
  } catch {
    return { garments: [], byId: new Map() };
  }
  if (cached && cached.mtime === mtime) return cached.value;
  const data = JSON.parse(fs.readFileSync(OPTIONS_FILE, 'utf8'));
  const byId = new Map();
  for (const garment of data.garments) {
    for (const group of garment.groups) {
      for (const option of group.options) byId.set(option.id, { ...option, group: group.name, garment: garment.name });
    }
  }
  const value = { garments: data.garments, byId };
  cached = { mtime, value };
  return value;
}

/** The WebP copy closest to `target` px wide without going over (the smallest one if all are wider). */
function pickWidth(variants, target = 1200) {
  const webp = variants && variants.webp;
  if (!webp) return null;
  const widths = Object.keys(webp).map(Number).sort((a, b) => a - b);
  if (widths.length === 0) return null;
  const fit = widths.filter((w) => w <= target);
  const w = fit.length ? fit[fit.length - 1] : widths[0];
  return { src: webp[w], width: w };
}

const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

/**
 * Turns joined rows (one per photo-choice link) into what the tablet reads:
 * { photos: { "lapel.peak": [{ id, src, width, height, altVi, altEn, focalX, focalY }, ...] } }.
 * `src` is relative to /tablet/ (see photoPath): the tablet loads photos from its own address.
 * Links to choices the app no longer offers, and photos without a web copy, are left out.
 */
function buildOptionPhotos(rows, validIds) {
  const photos = {};
  for (const row of rows) {
    if (validIds && !validIds.has(row.option_id)) continue;
    const pick = pickWidth(parse(row.variants));
    if (!pick) continue;
    const height = row.width ? Math.round((pick.width * row.height) / row.width) : null;
    (photos[row.option_id] ||= []).push({
      id: row.media_id,
      src: photoPath(row.media_id, pick.width),
      width: pick.width,
      height,
      altVi: row.alt_vi || '',
      altEn: row.alt_en || '',
      focalX: row.focal_x != null ? Number(row.focal_x) : 50,
      focalY: row.focal_y != null ? Number(row.focal_y) : 50,
    });
  }
  return { photos };
}

/**
 * Where the tablet asks for a photo, relative to /tablet/. The website passes the file on from the
 * photo store: the tablet then keeps it like any of its own files (a copy fetched from another
 * address would be stored as an opaque response, which Chrome counts at several MB each).
 */
function photoPath(mediaId, width) {
  return `api/photo/${mediaId}/${width}.webp`;
}

/** The store address of one web copy of a photo, only if the photo is linked to a tablet choice. */
async function linkedPhotoUrl(mediaId, width) {
  const row = await db('media as m')
    .whereExists(db('media_tablet_options as l').whereRaw('l.media_id = m.id'))
    .where('m.id', mediaId)
    .first('m.variants');
  const webp = row && parse(row.variants) && parse(row.variants).webp;
  return (webp && webp[width]) || null;
}

/** Every photo-choice link with the photo's details, in display order. */
function loadOptionPhotoRows() {
  return db('media_tablet_options as l')
    .join('media as m', 'm.id', 'l.media_id')
    .select('l.option_id', 'l.sort', 'l.media_id', 'm.variants', 'm.width', 'm.height', 'm.alt_vi', 'm.alt_en', 'm.focal_x', 'm.focal_y')
    .orderBy([{ column: 'l.option_id' }, { column: 'l.sort' }, { column: 'l.media_id' }]);
}

module.exports = { readTabletOptions, pickWidth, buildOptionPhotos, loadOptionPhotoRows, linkedPhotoUrl, photoPath };

const db = require('../config/db');

async function getMediaById(id) {
  if (!id) return null;
  return db('media').where({ id }).first();
}

async function getMediaByIds(ids) {
  const clean = [...new Set(ids.filter(Boolean))];
  if (clean.length === 0) return {};
  const rows = await db('media').whereIn('id', clean);
  const byId = {};
  rows.forEach((row) => {
    byId[row.id] = row;
  });
  return byId;
}

/**
 * Turns a media row into what the `image` partial needs: a srcset string
 * across the generated responsive WebP widths, the largest as fallback
 * `src`, and the image's own aspect ratio so layout space is reserved
 * before the file loads (avoids layout shift).
 */
function resolveMedia(row, lang = 'en') {
  if (!row || !row.variants || !row.variants.webp) return null;
  const widths = Object.keys(row.variants.webp)
    .map(Number)
    .sort((a, b) => a - b);
  if (widths.length === 0) return null;

  const srcset = widths.map((w) => `${row.variants.webp[w]} ${w}w`).join(', ');
  const largest = row.variants.webp[widths[widths.length - 1]];

  return {
    src: largest,
    srcset,
    width: row.width,
    height: row.height,
    alt: (lang === 'vi' ? row.alt_vi : row.alt_en) || row.alt_en || '',
    // Where to keep the crop centred when object-fit:cover trims the
    // image into a fixed-ratio frame — set per-photo in the Media Library.
    focalX: row.focal_x != null ? Number(row.focal_x) : 50,
    focalY: row.focal_y != null ? Number(row.focal_y) : 50,
  };
}

module.exports = { getMediaById, getMediaByIds, resolveMedia };

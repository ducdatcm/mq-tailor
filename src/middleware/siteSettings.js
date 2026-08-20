const db = require('../config/db');
const { resolveMedia } = require('../utils/media');

let cache = null;
let logoCache = null;
let cacheAt = 0;
const TTL_MS = 60 * 1000; // 1 minute — low-traffic site, keeps admin edits showing up quickly

async function loadSettings() {
  const now = Date.now();
  if (cache && now - cacheAt < TTL_MS) return { settings: cache, logo: logoCache };

  const row = await db('site_settings').where({ id: 1 }).first();
  if (row && row.hours && typeof row.hours === 'string') {
    try {
      row.hours = JSON.parse(row.hours);
    } catch (e) {
      row.hours = [];
    }
  }

  let logo = null;
  if (row && row.logo_media_id) {
    const media = await db('media').where({ id: row.logo_media_id }).first();
    logo = resolveMedia(media);
  }

  cache = row || null;
  logoCache = logo;
  cacheAt = now;
  return { settings: cache, logo: logoCache };
}

function invalidateSettingsCache() {
  cache = null;
  logoCache = null;
  cacheAt = 0;
}

/** Attaches res.locals.settings and res.locals.logo on every request. */
async function siteSettingsMiddleware(req, res, next) {
  try {
    const { settings, logo } = await loadSettings();
    res.locals.settings = settings;
    res.locals.logo = logo;
  } catch (err) {
    // DB not reachable / not migrated yet — don't crash the whole site over it.
    res.locals.settings = null;
    res.locals.logo = null;
  }
  next();
}

module.exports = siteSettingsMiddleware;
module.exports.invalidateSettingsCache = invalidateSettingsCache;

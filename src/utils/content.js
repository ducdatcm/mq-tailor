const db = require('../config/db');

/**
 * Loads every page_content row for a page and returns it keyed by
 * section_key, e.g. { hero: {...}, intro: {...} }, so controllers/views
 * can do content.hero.title_en instead of hunting through an array.
 */
async function getPageContent(pageKey) {
  const rows = await db('page_content').where({ page_key: pageKey }).orderBy('sort_order', 'asc');
  const byKey = {};
  rows.forEach((row) => {
    byKey[row.section_key] = row;
  });
  return byKey;
}

/** Picks the right-language field off a row, e.g. field(row, 'title', 'en'). */
function field(row, base, lang) {
  if (!row) return '';
  return row[`${base}_${lang}`] || row[`${base}_en`] || '';
}

module.exports = { getPageContent, field };

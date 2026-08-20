const en = require('../locales/en.json');
const vi = require('../locales/vi.json');

const dictionaries = { en, vi };

/** Deep-get a dot path like "cta.visit_the_house" from a dictionary. */
function get(dict, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
}

/**
 * Returns a translator function bound to a locale.
 * t('cta.visit_the_house') -> "Visit the House"
 * Falls back to the English string, then to the key itself, so a missing
 * Vietnamese string never breaks the page.
 */
function translator(lang) {
  const dict = dictionaries[lang] || dictionaries.en;
  return function t(path) {
    const value = get(dict, path);
    if (value !== undefined) return value;
    const fallback = get(dictionaries.en, path);
    return fallback !== undefined ? fallback : path;
  };
}

const SUPPORTED_LOCALES = ['en', 'vi'];
const DEFAULT_LOCALE = 'en';

module.exports = { translator, SUPPORTED_LOCALES, DEFAULT_LOCALE };

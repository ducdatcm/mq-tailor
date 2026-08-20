const { translator, SUPPORTED_LOCALES, DEFAULT_LOCALE } = require('../config/i18n');

/**
 * Mounted on the `/:lang(en|vi)` public router. Express's route param
 * regex already rejects anything outside en|vi before this runs, so this
 * middleware's job is just to wire up res.locals for the views.
 */
function localeMiddleware(req, res, next) {
  const lang = SUPPORTED_LOCALES.includes(req.params.lang) ? req.params.lang : DEFAULT_LOCALE;

  res.locals.lang = lang;
  res.locals.altLang = lang === 'en' ? 'vi' : 'en';
  res.locals.t = translator(lang);

  // Path of the current page with the language segment swapped, for the
  // language toggle and hreflang alternate links. e.g. /en/tailoring ->
  // /vi/tailoring, preserving anything after the lang segment.
  const rest = req.path.replace(/^\/(en|vi)/, '');
  res.locals.altLangPath = `/${res.locals.altLang}${rest}`;
  res.locals.currentPath = req.path;
  res.locals.baseUrl = process.env.BASE_URL || '';

  next();
}

module.exports = localeMiddleware;

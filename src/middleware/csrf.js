const crypto = require('node:crypto');

/**
 * Minimal CSRF protection for admin forms that change or export data: each
 * session gets a random token, forms send it back as a hidden `_csrf` field,
 * and a POST without the matching token is refused.
 */
function csrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  return req.session.csrfToken;
}

function verifyCsrf(req, res, next) {
  const sent = Buffer.from(String((req.body && req.body._csrf) || ''));
  const expected = Buffer.from(String(req.session.csrfToken || ''));
  if (sent.length && sent.length === expected.length && crypto.timingSafeEqual(sent, expected)) return next();
  req.flash('error', 'Your session expired. Please try again.');
  return res.redirect('/admin/backups');
}

module.exports = { csrfToken, verifyCsrf };

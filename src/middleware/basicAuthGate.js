/**
 * Password-protects the entire site with a single shared username/password
 * (HTTP Basic Auth) — for working on the real domain privately, without the
 * "fully blocked, even for you" behaviour of privateDomainGate. Anyone
 * without the password just sees a browser login prompt; there's no page
 * content for search engines or safety scanners to see or index either way.
 *
 * Configure via BASIC_AUTH_USER and BASIC_AUTH_PASSWORD environment
 * variables. Leave either one unset (the default) and this middleware does
 * nothing — remove both when you're ready to go fully public.
 */
function basicAuthGate(req, res, next) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return next();

  res.set('X-Robots-Tag', 'noindex, nofollow');

  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    const suppliedUser = sep === -1 ? decoded : decoded.slice(0, sep);
    const suppliedPass = sep === -1 ? '' : decoded.slice(sep + 1);
    if (suppliedUser === user && suppliedPass === pass) return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Minh Quang - Preview", charset="UTF-8"');
  res.status(401).type('text/plain').send('Authentication required.');
}

module.exports = basicAuthGate;

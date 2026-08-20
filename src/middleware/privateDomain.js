/**
 * Blocks specific hostnames from reaching the site — used to keep a real
 * (publicly resolvable) domain dark while still testing on a Hostinger
 * temporary *.hostingersite.com URL.
 *
 * Configure via the PRIVATE_DOMAINS environment variable: a comma-separated
 * list of hostnames to block, e.g. "minhquanghanoi.com,www.minhquanghanoi.com".
 * Leave it unset (the default) and this middleware does nothing — so it's
 * safe to leave the code in place after launch, just remove/clear the env
 * var when you're ready to go public on that domain.
 */
const blockedHosts = (process.env.PRIVATE_DOMAINS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function privateDomainGate(req, res, next) {
  if (blockedHosts.length === 0) return next();

  const host = (req.hostname || '').toLowerCase();
  if (!blockedHosts.includes(host)) return next();

  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.status(503).type('html').send(
    '<!doctype html><html><head><meta name="robots" content="noindex,nofollow">' +
      '<title>Not available yet</title></head><body style="font-family:sans-serif;' +
      'max-width:32rem;margin:15vh auto;text-align:center;color:#2b2620;">' +
      '<h1>Not available yet</h1><p>This site is still being prepared.</p>' +
      '</body></html>'
  );
}

module.exports = privateDomainGate;

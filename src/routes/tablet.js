/**
 * Serves the in-store tablet app (built into tablet-app/ by `npm run build:site` in tablet-demo/)
 * at /tablet/.
 *
 * It needs its own security headers: the app posts finished orders to a Google Apps Script web app, so
 * the site-wide policy (connect-src 'self') would block them. Everything else stays locked to this
 * origin. The app is for staff, so it is also kept out of search engines. The private-domain gate runs
 * before this, like for every other page; the site password does not (the app has its own access code,
 * see middleware/tabletAccess.js).
 */
const path = require('path');
const express = require('express');
const helmet = require('helmet');

const router = express.Router();
// Deliberately not under public/: Hostinger hands out files in public/ straight from its own web server,
// before this app (and so before the access code) ever sees the request.
const appDir = path.join(__dirname, '..', '..', 'tablet-app');

router.use((req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});

router.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://script.google.com', 'https://script.googleusercontent.com'],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

// Everything below needs the tablet's own access code (the website's password does not apply here).
router.use(require('../middleware/tabletAccess'));

// The page, the offline worker, the manifest and config.json are always re-checked, so a new version or a
// new spreadsheet address reaches the tablet as soon as it is online; the numbered files never change.
const ALWAYS_FRESH = new Set(['index.html', 'sw.js', 'config.json', 'manifest.webmanifest']);

router.use(
  express.static(appDir, {
    maxAge: 0,
    setHeaders(res, filePath) {
      if (ALWAYS_FRESH.has(path.basename(filePath))) {
        res.set('Cache-Control', 'no-cache');
      } else if (path.basename(path.dirname(filePath)) === 'assets') {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

module.exports = router;

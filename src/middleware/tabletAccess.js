/**
 * The in-store tablet app has its own lock, separate from the website's password: staff type one access
 * code (TABLET_ACCESS_CODE) once on each tablet, and the tablet is remembered for a year. It keeps working
 * when the website itself is public, and a tablet app that is shut to everyone else never shows a browser
 * login box (those do not stay remembered in an installed app).
 *
 * Changing the code signs every tablet out. If the code is missing or too short the app stays shut
 * rather than falling open. The install manifest and icons stay open: Chrome's app-packaging service
 * fetches them without cookies and they hold nothing private.
 */
const crypto = require('crypto');
const express = require('express');

const COOKIE = 'mq_tablet';
const REMEMBER_MS = 365 * 24 * 60 * 60 * 1000;
const MIN_CODE_LENGTH = 6;
const MAX_FAILS = 8;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const OPEN_PATHS = [/^\/manifest\.webmanifest$/, /^\/icons\/[\w-]+\.png$/];

const fails = new Map(); // ip -> { count, resetAt }
let warned = false;

function accessCode() {
  const code = process.env.TABLET_ACCESS_CODE || '';
  if (code.length >= MIN_CODE_LENGTH) return code;
  if (!warned) {
    warned = true;
    console.warn(`TABLET_ACCESS_CODE is ${code ? 'shorter than ' + MIN_CODE_LENGTH + ' characters' : 'not set'}: the tablet app at /tablet/ stays closed.`);
  }
  return null;
}

const sign = (code, expires) => crypto.createHmac('sha256', code).update(`mq-tablet-access:${expires}`).digest('hex');

function sameText(a, b) {
  const hash = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(hash(a), hash(b));
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const at = part.indexOf('=');
    if (at !== -1 && part.slice(0, at).trim() === name) return part.slice(at + 1).trim();
  }
  return '';
}

function isSignedIn(req, code) {
  const [expires, signature] = readCookie(req, COOKIE).split('.');
  if (!expires || !signature || !(Number(expires) > Date.now())) return false;
  return sameText(signature, sign(code, expires));
}

function loginPage(message, withForm = true) {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<title>Minh Quang Bespoke</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f2ec;color:#2b2622;font:18px/1.5 system-ui,sans-serif}
  main{width:min(92vw,26rem);padding:2rem;background:#fff;border:1px solid #ded5c8;border-radius:12px;text-align:center}
  h1{margin:0 0 .25rem;font-size:1.4rem;letter-spacing:.04em;color:#8a7558}
  p{margin:.25rem 0 1rem}
  input,button{box-sizing:border-box;width:100%;padding:.8rem 1rem;font:inherit;border-radius:8px}
  input{border:1px solid #b9ad9c;margin-bottom:.75rem;text-align:center}
  button{border:0;background:#ac9679;color:#fff;cursor:pointer}
  .error{color:#a3321f}
</style></head>
<body><main>
  <h1>Minh Quang Bespoke</h1>
  ${withForm ? '<p>Nhập mã truy cập của máy tư vấn.</p>' : ''}
  ${message ? `<p class="error" role="alert">${message}</p>` : ''}
  ${
    withForm
      ? `<form method="post" action="login">
    <input type="password" name="code" autocomplete="off" autocapitalize="off" autofocus required aria-label="Mã truy cập">
    <button type="submit">Vào ứng dụng</button>
  </form>`
      : ''
  }
</main></body></html>`;
}

function send(res, status, html) {
  res.status(status).set('Cache-Control', 'no-store').type('html').send(html);
}

const router = express.Router();

router.use((req, res, next) => {
  const code = accessCode();
  if (!code) return send(res, 503, loginPage('Ứng dụng tạm thời chưa mở.', false));
  req.tabletCode = code;
  next();
});

router.get('/login', (req, res) => {
  if (isSignedIn(req, req.tabletCode)) return res.redirect(`${req.baseUrl}/`);
  send(res, 200, loginPage(''));
});

router.post('/login', express.urlencoded({ extended: false, limit: '1kb' }), (req, res) => {
  const now = Date.now();
  const record = fails.get(req.ip);
  if (record && record.resetAt <= now) fails.delete(req.ip);
  const current = fails.get(req.ip);
  if (current && current.count >= MAX_FAILS) {
    return send(res, 429, loginPage('Nhập sai nhiều lần. Đợi 15 phút rồi thử lại.'));
  }

  if (!sameText(req.body?.code ?? '', req.tabletCode)) {
    for (const [ip, r] of fails) if (r.resetAt <= now) fails.delete(ip);
    const entry = fails.get(req.ip) || { count: 0, resetAt: now + FAIL_WINDOW_MS };
    entry.count += 1;
    fails.set(req.ip, entry);
    return send(res, 401, loginPage('Mã chưa đúng. Hãy thử lại.'));
  }

  fails.delete(req.ip);
  const expires = now + REMEMBER_MS;
  res.cookie(COOKIE, `${expires}.${sign(req.tabletCode, expires)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    path: req.baseUrl || '/',
    maxAge: REMEMBER_MS,
  });
  res.redirect(303, `${req.baseUrl}/`);
});

router.use((req, res, next) => {
  if (OPEN_PATHS.some((re) => re.test(req.path))) return next();
  if (isSignedIn(req, req.tabletCode)) return next();
  // Pages go to the code page. Anything else (script, config, the offline worker's downloads) gets a plain
  // refusal, so a page asking for a file is never handed the code page in its place.
  if (/text\/html/.test(req.headers.accept || '')) return res.redirect(`${req.baseUrl}/login`);
  res.status(401).set('Cache-Control', 'no-store').type('text/plain').send('Access code required.');
});

router.resetFailures = () => fails.clear();

module.exports = router;

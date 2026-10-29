const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const tablet = require('../src/routes/tablet');
const access = require('../src/middleware/tabletAccess');

const CODE = 'tailor-2468';
const HTML = { accept: 'text/html,application/xhtml+xml' };

function serve() {
  const app = express();
  app.use('/tablet', tablet);
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function withServer(code, fn) {
  const before = process.env.TABLET_ACCESS_CODE;
  if (code === undefined) delete process.env.TABLET_ACCESS_CODE;
  else process.env.TABLET_ACCESS_CODE = code;
  access.resetFailures();
  const { server, base } = await serve();
  try {
    await fn(base);
  } finally {
    server.close();
    if (before === undefined) delete process.env.TABLET_ACCESS_CODE;
    else process.env.TABLET_ACCESS_CODE = before;
  }
}

async function signIn(base, code = CODE) {
  const res = await fetch(`${base}/tablet/login`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `code=${encodeURIComponent(code)}`,
  });
  return { res, cookie: (res.headers.get('set-cookie') || '').split(';')[0] };
}

test('the tablet app is served at /tablet/ with its own policy, kept out of search engines', async () => {
  await withServer(CODE, async (base) => {
    const { cookie } = await signIn(base);
    const headers = { cookie };
    const res = await fetch(`${base}/tablet/`, { headers });
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('x-robots-tag') || '', /noindex/);
    const csp = res.headers.get('content-security-policy') || '';
    assert.ok(csp.includes('https://script.google.com'), 'orders go to Google Apps Script');
    assert.ok(csp.includes('https://script.googleusercontent.com'), 'the script answers from googleusercontent');
    assert.match(csp, /script-src 'self'/);
    assert.match(res.headers.get('cache-control') || '', /no-cache/);
    assert.match(await res.text(), /manifest\.webmanifest/);

    const sw = await fetch(`${base}/tablet/sw.js`, { headers });
    assert.strictEqual(sw.status, 200);
    assert.match(sw.headers.get('cache-control') || '', /no-cache/);
    assert.doesNotMatch(await sw.text(), /__BUILD__|__PRECACHE__/, 'the build must fill in the offline worker');

    const redirect = await fetch(`${base}/tablet`, { redirect: 'manual', headers });
    assert.ok([301, 302].includes(redirect.status));
  });
});

test('without the access code nothing of the app is served, and the install files stay open', async () => {
  await withServer(CODE, async (base) => {
    const page = await fetch(`${base}/tablet/`, { redirect: 'manual', headers: HTML });
    assert.strictEqual(page.status, 302);
    assert.match(page.headers.get('location') || '', /\/tablet\/login$/);

    for (const file of ['sw.js', 'config.json', 'index.html']) {
      const res = await fetch(`${base}/tablet/${file}`, { redirect: 'manual' });
      assert.strictEqual(res.status, 401, `${file} must not be handed out`);
      assert.strictEqual(res.headers.get('content-type')?.includes('html'), false, `${file} must not get the code page in its place`);
    }
    const assets = fs.readdirSync(path.join(__dirname, '..', 'tablet-app', 'assets')).filter((f) => f.endsWith('.js'));
    assert.strictEqual((await fetch(`${base}/tablet/assets/${assets[0]}`)).status, 401);
    assert.strictEqual((await fetch(`${base}/tablet/icons/../config.json`)).status, 401);

    assert.strictEqual((await fetch(`${base}/tablet/manifest.webmanifest`)).status, 200);
    assert.strictEqual((await fetch(`${base}/tablet/icons/icon-192.png`)).status, 200);

    const login = await fetch(`${base}/tablet/login`);
    assert.strictEqual(login.status, 200);
    assert.match(login.headers.get('cache-control') || '', /no-store/);
    assert.match(login.headers.get('x-robots-tag') || '', /noindex/);
    assert.match(await login.text(), /name="code"/);
  });
});

test('the right code opens the app for a year; a wrong one or a changed code does not', async () => {
  await withServer(CODE, async (base) => {
    const wrong = await signIn(base, 'not-the-code');
    assert.strictEqual(wrong.res.status, 401);
    assert.strictEqual(wrong.cookie, '');

    const { res, cookie } = await signIn(base);
    assert.strictEqual(res.status, 303);
    assert.match(res.headers.get('location') || '', /\/tablet\/$/);
    const setCookie = res.headers.get('set-cookie') || '';
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    assert.match(setCookie, /Path=\/tablet/);
    assert.match(setCookie, /Max-Age=31536000/);

    assert.strictEqual((await fetch(`${base}/tablet/`, { headers: { cookie } })).status, 200);
    assert.strictEqual((await fetch(`${base}/tablet/config.json`, { headers: { cookie } })).status, 200);

    const tampered = cookie.replace(/\.[0-9a-f]+$/, '.' + '0'.repeat(64));
    assert.strictEqual((await fetch(`${base}/tablet/config.json`, { headers: { cookie: tampered } })).status, 401);

    process.env.TABLET_ACCESS_CODE = 'a-new-code-99';
    assert.strictEqual((await fetch(`${base}/tablet/config.json`, { headers: { cookie } })).status, 401, 'changing the code signs every tablet out');
  });
});

test('too many wrong codes are turned away for a while', async () => {
  await withServer(CODE, async (base) => {
    for (let i = 0; i < 8; i += 1) assert.strictEqual((await signIn(base, 'guess' + i)).res.status, 401);
    assert.strictEqual((await signIn(base, CODE)).res.status, 429, 'even the right code waits out the lock');
  });
});

test('with no usable access code the app stays shut', async () => {
  for (const code of [undefined, '', 'short']) {
    await withServer(code, async (base) => {
      assert.strictEqual((await fetch(`${base}/tablet/`, { headers: HTML })).status, 503);
      assert.strictEqual((await fetch(`${base}/tablet/config.json`)).status, 503);
      const login = await signIn(base, code ?? '');
      assert.strictEqual(login.res.status, 503);
      assert.strictEqual(login.cookie, '');
    });
  }
});

test('the copy of the app on the site carries no spreadsheet address or secret', () => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tablet-app', 'config.json'), 'utf8'));
  assert.deepStrictEqual(config, { orderSheetUrl: '', orderSheetToken: '' });
  const everything = fs
    .readdirSync(path.join(__dirname, '..', 'tablet-app', 'assets'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(__dirname, '..', 'tablet-app', 'assets', f), 'utf8'))
    .join('');
  assert.ok(!/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}/.test(everything), 'no real Apps Script address in the build');
});

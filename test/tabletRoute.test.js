const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const tablet = require('../src/routes/tablet');

function serve() {
  const app = express();
  app.use('/tablet', tablet);
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

test('the tablet app is served at /tablet/ with its own policy, kept out of search engines', async () => {
  const { server, base } = await serve();
  try {
    const res = await fetch(`${base}/tablet/`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('x-robots-tag') || '', /noindex/);
    const csp = res.headers.get('content-security-policy') || '';
    assert.ok(csp.includes('https://script.google.com'), 'orders go to Google Apps Script');
    assert.ok(csp.includes('https://script.googleusercontent.com'), 'the script answers from googleusercontent');
    assert.match(csp, /script-src 'self'/);
    assert.match(res.headers.get('cache-control') || '', /no-cache/);
    assert.match(await res.text(), /manifest\.webmanifest/);

    const sw = await fetch(`${base}/tablet/sw.js`);
    assert.strictEqual(sw.status, 200);
    assert.match(sw.headers.get('cache-control') || '', /no-cache/);
    assert.doesNotMatch(await sw.text(), /__BUILD__|__PRECACHE__/, 'the build must fill in the offline worker');

    const redirect = await fetch(`${base}/tablet`, { redirect: 'manual' });
    assert.ok([301, 302].includes(redirect.status));
  } finally {
    server.close();
  }
});

test('the copy of the app on the site carries no spreadsheet address or secret', () => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'tablet', 'config.json'), 'utf8'));
  assert.deepStrictEqual(config, { orderSheetUrl: '', orderSheetToken: '' });
  const everything = fs
    .readdirSync(path.join(__dirname, '..', 'public', 'tablet', 'assets'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(__dirname, '..', 'public', 'tablet', 'assets', f), 'utf8'))
    .join('');
  assert.ok(!/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}/.test(everything), 'no real Apps Script address in the build');
});

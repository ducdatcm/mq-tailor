const test = require('node:test');
const assert = require('node:assert');

function run(path, authorization) {
  delete require.cache[require.resolve('../src/middleware/basicAuthGate')];
  const gate = require('../src/middleware/basicAuthGate');
  const req = { path, headers: authorization ? { authorization } : {} };
  const out = { status: null, nexted: false };
  const res = {
    set() {},
    status(code) {
      out.status = code;
      return this;
    },
    type() {
      return this;
    },
    send() {},
  };
  gate(req, res, () => {
    out.nexted = true;
  });
  return out;
}

test('with a password set, pages ask for it but the tablet manifest and icons do not', () => {
  process.env.BASIC_AUTH_USER = 'u';
  process.env.BASIC_AUTH_PASSWORD = 'p';
  try {
    assert.strictEqual(run('/en/').status, 401);
    assert.strictEqual(run('/tablet/').status, 401);
    assert.strictEqual(run('/tablet/sw.js').status, 401);
    assert.strictEqual(run('/tablet/config.json').status, 401);
    assert.ok(run('/tablet/manifest.webmanifest').nexted);
    assert.ok(run('/tablet/icons/icon-192.png').nexted);
    assert.strictEqual(run('/tablet/icons/../config.json').status, 401);
    assert.ok(run('/en/', 'Basic ' + Buffer.from('u:p').toString('base64')).nexted);
  } finally {
    delete process.env.BASIC_AUTH_USER;
    delete process.env.BASIC_AUTH_PASSWORD;
  }
});

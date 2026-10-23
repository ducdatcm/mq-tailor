const test = require('node:test');
const assert = require('node:assert/strict');
const backup = require('../src/utils/dbBackup');

/** A stand-in for a mysql2 connection that answers the few queries the dump makes. */
function fakeConnection(tables) {
  return {
    async query(sql) {
      if (sql === 'SHOW FULL TABLES') {
        return [Object.keys(tables).map((name) => ({ Tables_in_db: name, Table_type: 'BASE TABLE' })), []];
      }
      let m = sql.match(/^SHOW CREATE TABLE `(.+)`$/);
      if (m) return [[{ Table: m[1], 'Create Table': `CREATE TABLE \`${m[1]}\` (\`id\` int)` }], []];
      m = sql.match(/^SELECT \* FROM `(.+)`$/);
      if (m) return [tables[m[1]], []];
      throw new Error(`unexpected query: ${sql}`);
    },
  };
}

const sample = {
  media: [
    {
      id: 1,
      filename: "o'brien \"quote\" \\ back\nslash",
      alt_vi: 'Áo vest một hàng khuy — 🧵',
      variants: { webp: { 480: 'https://x/a-480.webp' } },
      created_at: '2026-01-02 03:04:05',
      focal_x: '50.00',
      note: null,
    },
  ],
  sessions: [{ session_id: 'abc', data: 'secret' }],
  knex_migrations_lock: [{ index: 1, is_locked: 0 }],
  empty_table: [],
};

test('dump contains structure and rows, and skips sessions and the lock table', async () => {
  const { sql, tables } = await backup.dumpDatabase(fakeConnection(sample), new Date('2026-11-01T09:00:00Z'));
  assert.match(sql, /-- Created: 2026-11-01T09:00:00.000Z/);
  assert.match(sql, /DROP TABLE IF EXISTS `media`;/);
  assert.match(sql, /CREATE TABLE `media`/);
  assert.match(sql, /INSERT INTO `media` \(`id`, `filename`, `alt_vi`, `variants`, `created_at`, `focal_x`, `note`\) VALUES/);
  assert.match(sql, /CREATE TABLE `empty_table`/);
  assert.doesNotMatch(sql, /INSERT INTO `empty_table`/);
  assert.doesNotMatch(sql, /sessions|knex_migrations_lock|secret/);
  assert.deepEqual(tables, [
    { name: 'empty_table', rows: 0 },
    { name: 'media', rows: 1 },
  ]);
});

test('awkward values are written as safe SQL literals', async () => {
  const { sql } = await backup.dumpDatabase(fakeConnection(sample));
  // quotes and backslashes are escaped, newlines are written as \n
  assert.ok(sql.includes("'o\\'brien \\\"quote\\\" \\\\ back\\nslash'"), sql);
  // unicode survives untouched
  assert.ok(sql.includes("'Áo vest một hàng khuy — 🧵'"));
  // JSON columns are stored as JSON text, not as `key = value` pairs
  assert.ok(sql.includes(String.raw`'{\"webp\":{\"480\":\"https://x/a-480.webp\"}}'`), sql);
  // dates stay as the exact text the database gave, and NULL stays NULL
  assert.ok(sql.includes("'2026-01-02 03:04:05'"));
  assert.match(sql, /, NULL\)/);
});

test('large tables are split into several INSERT statements', async () => {
  const rows = Array.from({ length: 250 }, (_, i) => ({ id: i + 1 }));
  const { sql } = await backup.dumpDatabase(fakeConnection({ big: rows }));
  assert.equal(sql.match(/INSERT INTO `big`/g).length, 3);
});

test('encrypt and decrypt round-trip, and a wrong passphrase is rejected', () => {
  const data = Buffer.from('secret backup text');
  const enc = backup.encrypt(data, 'correct horse battery');
  assert.notDeepEqual(enc.subarray(0, 5), data.subarray(0, 5));
  assert.deepEqual(backup.decrypt(enc, 'correct horse battery'), data);
  assert.throws(() => backup.decrypt(enc, 'a different passphrase'), /wrong BACKUP_PASSPHRASE/);
  const tampered = Buffer.from(enc);
  tampered[tampered.length - 1] ^= 1;
  assert.throws(() => backup.decrypt(tampered, 'correct horse battery'), /wrong BACKUP_PASSPHRASE|damaged/);
});

test('a short passphrase is refused', () => {
  assert.throws(() => backup.encrypt(Buffer.from('x'), 'short'), /at least 12/);
});

test('pack and unpack work with and without a passphrase', () => {
  const sql = 'SELECT 1;\n-- Täst';
  assert.equal(backup.unpackBackup(backup.packBackup(sql, null)), sql);
  assert.equal(backup.unpackBackup(backup.packBackup(sql, 'twelve chars ok'), 'twelve chars ok'), sql);
  // a plain .sql file is accepted as well
  assert.equal(backup.unpackBackup(Buffer.from(sql)), sql);
});

test('file names are sortable UTC timestamps', () => {
  const d = new Date('2026-11-01T09:05:07Z');
  assert.equal(backup.backupFileName(d, false), 'mq-backup-20261101-090507.sql.gz');
  assert.equal(backup.backupFileName(d, true), 'mq-backup-20261101-090507.sql.gz.enc');
});

const zlib = require('node:zlib');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const { escape } = require('mysql2');

const knexConfig = require('../../knexfile');
const storage = require('../config/storage');

/**
 * Database backups for a host with no shell and no mysqldump.
 *
 * A backup is one .sql file (table structure + every row) that can be replayed
 * into an empty database, compressed with gzip. Cloud copies are also
 * ENCRYPTED with BACKUP_PASSPHRASE before they are uploaded: the R2 bucket
 * serves files publicly, and a database dump contains enquiries (names,
 * phones, emails) and the admin password hash. Without the passphrase an
 * uploaded copy is just noise.
 */

const BACKUP_PREFIX = 'backups/';
const KEEP_BACKUPS = 30;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;
const ROWS_PER_INSERT = 100;
const MAGIC = Buffer.from('MQBK1'); // marks an encrypted backup file

// Login sessions are temporary and the lock table is bookkeeping — neither is worth keeping.
const SKIPPED_TABLES = new Set(['sessions', 'knex_migrations_lock']);

const quoteId = (name) => `\`${String(name).replace(/`/g, '``')}\``;

/** SQL text for one value, whatever the column type. */
function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (Buffer.isBuffer(value)) return escape(value);
  // JSON columns come back as parsed objects/arrays; store them as JSON text.
  if (typeof value === 'object' && !(value instanceof Date)) return escape(JSON.stringify(value));
  return escape(value);
}

/**
 * Builds the full dump as SQL text. `conn` is a mysql2/promise connection (or
 * anything with the same `query` method). Dates must come back as strings
 * (`dateStrings: true`) so they are restored exactly, regardless of time zone.
 */
async function dumpDatabase(conn, now = new Date()) {
  const [tableRows] = await conn.query('SHOW FULL TABLES');
  const tables = tableRows
    .filter((r) => r.Table_type === 'BASE TABLE')
    .map((r) => Object.values(r)[0])
    .filter((name) => !SKIPPED_TABLES.has(name))
    .sort();

  const out = [
    '-- Minh Quang database backup',
    `-- Created: ${now.toISOString()}`,
    `-- Tables: ${tables.length}`,
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS=0;',
    'SET SQL_MODE=\'NO_AUTO_VALUE_ON_ZERO\';',
    '',
  ];
  const summary = [];

  for (const table of tables) {
    const [[createRow]] = await conn.query(`SHOW CREATE TABLE ${quoteId(table)}`);
    const [rows] = await conn.query(`SELECT * FROM ${quoteId(table)}`);

    out.push(`-- Table ${table} (${rows.length} rows)`);
    out.push(`DROP TABLE IF EXISTS ${quoteId(table)};`);
    out.push(`${createRow['Create Table']};`);

    if (rows.length) {
      const columns = Object.keys(rows[0]).map(quoteId).join(', ');
      for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
        const values = rows
          .slice(i, i + ROWS_PER_INSERT)
          .map((row) => `(${Object.values(row).map(literal).join(', ')})`)
          .join(',\n');
        out.push(`INSERT INTO ${quoteId(table)} (${columns}) VALUES\n${values};`);
      }
    }
    out.push('');
    summary.push({ name: table, rows: rows.length });
  }

  out.push('SET FOREIGN_KEY_CHECKS=1;');
  return { sql: `${out.join('\n')}\n`, tables: summary };
}

// --- Encryption (AES-256-GCM, key derived from the passphrase with scrypt) ---

function requirePassphrase(passphrase) {
  if (!passphrase || passphrase.length < 12) {
    throw new Error('BACKUP_PASSPHRASE must be set and at least 12 characters long.');
  }
}

function encrypt(buffer, passphrase) {
  requirePassphrase(passphrase);
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]);
}

function decrypt(buffer, passphrase) {
  requirePassphrase(passphrase);
  const header = MAGIC.length + 16 + 12 + 16;
  if (buffer.length < header || !buffer.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('This file is not an encrypted Minh Quang backup.');
  }
  const salt = buffer.subarray(MAGIC.length, MAGIC.length + 16);
  const iv = buffer.subarray(MAGIC.length + 16, MAGIC.length + 28);
  const tag = buffer.subarray(MAGIC.length + 28, header);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(buffer.subarray(header)), decipher.final()]);
  } catch (err) {
    throw new Error('Could not decrypt the backup — wrong BACKUP_PASSPHRASE, or the file is damaged.');
  }
}

/** SQL text -> file bytes (gzip, then encrypted when a passphrase is given). */
function packBackup(sql, passphrase) {
  const gz = zlib.gzipSync(Buffer.from(sql, 'utf8'), { level: 9 });
  return passphrase ? encrypt(gz, passphrase) : gz;
}

/** File bytes -> SQL text. Accepts encrypted or plain gzip, or a plain .sql file. */
function unpackBackup(buffer, passphrase) {
  let data = buffer;
  if (data.subarray(0, MAGIC.length).equals(MAGIC)) data = decrypt(data, passphrase);
  if (data[0] === 0x1f && data[1] === 0x8b) data = zlib.gunzipSync(data);
  return data.toString('utf8');
}

function backupFileName(date = new Date(), encrypted = false) {
  const p = date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  return `mq-backup-${p}.sql.gz${encrypted ? '.enc' : ''}`;
}

// --- Database connection ---

function connectionOptions(extra = {}) {
  return { ...knexConfig.connection, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true, ...extra };
}

/** Dumps the live database to SQL text using its own short-lived connection. */
async function dumpLiveDatabase() {
  const conn = await mysql.createConnection(connectionOptions());
  try {
    return await dumpDatabase(conn);
  } finally {
    await conn.end();
  }
}

/** Replays a backup's SQL into the configured database. Replaces the tables it contains. */
async function restoreSql(sql) {
  const conn = await mysql.createConnection(connectionOptions({ multipleStatements: true }));
  try {
    await conn.query(sql);
  } finally {
    await conn.end();
  }
}

// --- Cloud copies (Cloudflare R2) ---

const passphrase = () => (process.env.BACKUP_PASSPHRASE || '').trim();

function cloudReady() {
  return storage.isConfigured() && passphrase().length >= 12;
}

let statusCache = null;
let running = false;

/** Newest first: [{ key, name, size, lastModified }]. */
async function listCloudBackups() {
  const items = await storage.listObjects(BACKUP_PREFIX);
  return items
    .map((o) => ({ ...o, name: o.key.slice(BACKUP_PREFIX.length) }))
    .filter((o) => o.name.startsWith('mq-backup-'))
    .reverse();
}

async function pruneCloudBackups(keep = KEEP_BACKUPS) {
  const all = await listCloudBackups();
  const old = all.slice(keep);
  for (const o of old) await storage.deleteObjectByKey(o.key);
  return old.length;
}

/** Makes an encrypted backup and stores it in R2. Throws when cloud backup is not set up. */
async function createCloudBackup() {
  if (!storage.isConfigured()) throw new Error('Cloud storage (R2) is not configured.');
  requirePassphrase(passphrase());
  if (running) throw new Error('A backup is already running.');
  running = true;
  try {
    const { sql, tables } = await dumpLiveDatabase();
    const bytes = packBackup(sql, passphrase());
    const name = backupFileName(new Date(), true);
    await storage.putObject(`${BACKUP_PREFIX}${name}`, bytes, 'application/octet-stream', 'private, no-store');
    const pruned = await pruneCloudBackups().catch(() => 0);
    statusCache = null;
    return { name, size: bytes.length, tables, pruned };
  } finally {
    running = false;
  }
}

/** A plain gzip backup for the admin to download to their own computer. */
async function createDownload() {
  const { sql, tables } = await dumpLiveDatabase();
  return { name: backupFileName(new Date(), false), bytes: packBackup(sql, null), tables };
}

/** What the admin pages show: is it set up, and when was the last cloud backup. Cached for 5 minutes. */
async function getStatus() {
  if (statusCache && Date.now() - statusCache.at < 5 * 60 * 1000) return statusCache.value;
  const value = {
    storageConfigured: storage.isConfigured(),
    passphraseSet: passphrase().length >= 12,
    last: null,
    count: 0,
    error: null,
  };
  if (value.storageConfigured) {
    try {
      const all = await listCloudBackups();
      value.count = all.length;
      value.last = all[0] || null;
    } catch (err) {
      value.error = err.message;
    }
  }
  statusCache = { at: Date.now(), value };
  return value;
}

/** Makes a cloud backup if there is none from the last 24 hours. Safe to call often. */
async function ensureFreshBackup() {
  if (!cloudReady() || running) return null;
  try {
    const all = await listCloudBackups();
    if (all[0] && Date.now() - new Date(all[0].lastModified).getTime() < MAX_AGE_MS) return null;
    const result = await createCloudBackup();
    console.log(`[backup] created ${result.name} (${result.size} bytes)`);
    return result;
  } catch (err) {
    console.error('[backup] automatic backup failed:', err.message);
    return null;
  }
}

/**
 * Checks shortly after boot, then every few hours. The host may stop an idle
 * app, so this is a safety net, not a guarantee — the admin page shows the real
 * date of the last backup and warns when it is old.
 */
function startScheduler() {
  const first = setTimeout(ensureFreshBackup, 90 * 1000);
  const loop = setInterval(ensureFreshBackup, CHECK_EVERY_MS);
  first.unref();
  loop.unref();
}

module.exports = {
  BACKUP_PREFIX,
  dumpDatabase,
  encrypt,
  decrypt,
  packBackup,
  unpackBackup,
  backupFileName,
  dumpLiveDatabase,
  restoreSql,
  listCloudBackups,
  createCloudBackup,
  createDownload,
  getStatus,
  ensureFreshBackup,
  startScheduler,
  cloudReady,
  connectionOptions,
};

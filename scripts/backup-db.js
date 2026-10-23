/**
 * Makes a database backup from the command line.
 *
 *   node scripts/backup-db.js                 # writes backups/mq-backup-<date>.sql.gz here
 *   node scripts/backup-db.js --out my.sql.gz # choose the file name
 *   node scripts/backup-db.js --cloud         # also store an encrypted copy in R2
 *
 * Needs the same DB_* settings as the site (a .env file, or environment
 * variables). --cloud also needs the R2_* settings and BACKUP_PASSPHRASE.
 * Most people will use /admin/backups instead; this is for developers.
 */
const fs = require('node:fs');
const path = require('node:path');
const backup = require('../src/utils/dbBackup');

async function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const cloud = args.includes('--cloud');

  const { name, bytes, tables } = await backup.createDownload();
  const file = outIndex !== -1 ? args[outIndex + 1] : path.join('backups', name);
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, bytes);
  console.log(`Saved ${file} (${Math.round(bytes.length / 1024)} KB, ${tables.length} tables)`);
  tables.forEach((t) => console.log(`  ${t.name}: ${t.rows} rows`));

  if (cloud) {
    const result = await backup.createCloudBackup();
    console.log(`Encrypted copy stored in the cloud as ${result.name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backup failed:', err.message);
    process.exit(1);
  });

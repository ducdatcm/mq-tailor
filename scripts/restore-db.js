/**
 * Restores a backup into the database named in .env (DB_*).
 *
 *   node scripts/restore-db.js backups/mq-backup-20261101-090000.sql.gz --yes
 *   node scripts/restore-db.js --latest-cloud --yes      # newest encrypted copy in R2
 *   node scripts/restore-db.js <file> --dry-run          # only show what is inside
 *
 * THIS REPLACES the tables contained in the backup (same-named tables are
 * dropped and recreated with the saved rows). Anything added after the backup
 * was made is lost. It refuses to run without --yes.
 *
 * Encrypted files (.enc) are opened with BACKUP_PASSPHRASE.
 */
const fs = require('node:fs');
const backup = require('../src/utils/dbBackup');
const storage = require('../src/config/storage');

async function main() {
  const args = process.argv.slice(2);
  const yes = args.includes('--yes');
  const dry = args.includes('--dry-run');
  const passphrase = (process.env.BACKUP_PASSPHRASE || '').trim();

  let bytes;
  let label;
  if (args.includes('--latest-cloud')) {
    const all = await backup.listCloudBackups();
    if (!all.length) throw new Error('There are no cloud backups.');
    label = all[0].name;
    bytes = await storage.getObjectBuffer(all[0].key);
  } else {
    const file = args.find((a) => !a.startsWith('--'));
    if (!file) throw new Error('Give a backup file, or --latest-cloud.');
    label = file;
    bytes = fs.readFileSync(file);
  }

  const sql = backup.unpackBackup(bytes, passphrase);
  const tables = [...sql.matchAll(/^-- Table (\S+) \((\d+) rows\)$/gm)];
  console.log(`Backup: ${label}`);
  console.log((sql.match(/^-- Created: .*$/m) || ['-- Created: unknown'])[0]);
  tables.forEach((m) => console.log(`  ${m[1]}: ${m[2]} rows`));

  if (dry) return;
  if (!yes) {
    console.log('\nThis would REPLACE the tables listed above in the database from .env.');
    console.log('Run again with --yes to go ahead.');
    return;
  }
  await backup.restoreSql(sql);
  console.log('\nRestore finished. Restart the app so it picks up the restored data.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Restore failed:', err.message);
    process.exit(1);
  });

/**
 * One-time admin account setup.
 * Reads ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD from .env, hashes the
 * password, and creates (or resets) that admin user. Run with:
 *   npm run seed:admin
 * Then remove the two ADMIN_SEED_* lines from .env — they're only needed
 * for this one run.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

async function main() {
  const username = process.env.ADMIN_SEED_USERNAME;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!username || !password) {
    console.error('Set ADMIN_SEED_USERNAME and ADMIN_SEED_PASSWORD in .env before running this script.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_SEED_PASSWORD should be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db('admin_users').where({ username }).first();

  if (existing) {
    await db('admin_users').where({ id: existing.id }).update({ password_hash: passwordHash });
    console.log(`Updated password for existing admin user "${username}".`);
  } else {
    await db('admin_users').insert({ username, password_hash: passwordHash });
    console.log(`Created admin user "${username}".`);
  }

  console.log('Now remove ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD from .env.');
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

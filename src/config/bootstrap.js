const bcrypt = require('bcryptjs');
const db = require('./db');

/**
 * Runs on every app boot. This exists because some hosting setups (e.g.
 * Hostinger's Git-based "Deploy Web App") don't give you a shell with
 * npm/node on PATH, so `npm run migrate` / `npm run seed` can't be run
 * by hand after deploy. Everything here is safe to run on every restart:
 *
 * - Migrations are idempotent (Knex tracks what's already applied).
 * - The starter content seed only runs once, ever — guarded by checking
 *   whether site_settings already has a row, so it can never wipe content
 *   you've since edited from /admin.
 * - The admin account is only created if ADMIN_SEED_USERNAME doesn't
 *   already exist — leaving ADMIN_SEED_* in your environment variables
 *   afterward is harmless (it won't reset the password), though removing
 *   them once login works is still good practice.
 */
async function runStartupTasks() {
  try {
    await db.migrate.latest();
    console.log('[bootstrap] database migrations up to date');
  } catch (err) {
    console.error('[bootstrap] migration failed — skipping seed/admin steps:', err.message);
    return;
  }

  try {
    const alreadySeeded = await db('site_settings').where({ id: 1 }).first();
    if (!alreadySeeded) {
      console.log('[bootstrap] first boot detected — loading starter content...');
      await db.seed.run();
      console.log('[bootstrap] starter content loaded');
    }
  } catch (err) {
    console.error('[bootstrap] content seed failed:', err.message);
  }

  try {
    const seedUsername = process.env.ADMIN_SEED_USERNAME;
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (seedUsername && seedPassword) {
      const existing = await db('admin_users').where({ username: seedUsername }).first();
      if (!existing) {
        const passwordHash = await bcrypt.hash(seedPassword, 12);
        await db('admin_users').insert({ username: seedUsername, password_hash: passwordHash });
        console.log(`[bootstrap] created admin user "${seedUsername}" — you can log in at /admin/login now.`);
      }
    }
  } catch (err) {
    console.error('[bootstrap] admin account setup failed:', err.message);
  }
}

module.exports = { runStartupTasks };

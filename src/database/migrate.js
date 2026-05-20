/**
 * Migration runner
 * Reads migrations.sql and executes it against the PostgreSQL database
 * using the DATABASE_URL environment variable (standard pg connection string).
 *
 * Uses CREATE TABLE IF NOT EXISTS — safe to run multiple times (idempotent).
 * Called automatically from src/app.js before the server starts listening.
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[migrate] ERROR: Environment variable DATABASE_URL is not set.');
  console.error('[migrate] Please add DATABASE_URL to your .env file.');
  console.error('[migrate] Example: DATABASE_URL=postgresql://postgres:password@db.ref.supabase.co:5432/postgres');
  process.exit(1);
}

const MIGRATIONS_FILE = path.join(__dirname, 'migrations.sql');

/**
 * Run all migrations from migrations.sql.
 * Idempotent — safe to call on every startup.
 *
 * @returns {Promise<void>}
 */
async function runMigrations() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  let client;
  try {
    client = await pool.connect();
    console.log('[migrate] Connected to database.');

    const sql = fs.readFileSync(MIGRATIONS_FILE, 'utf8');

    await client.query(sql);
    console.log('[migrate] Migrations applied successfully.');
  } catch (err) {
    console.error('[migrate] ERROR: Migration failed.');
    console.error('[migrate]', err.message);
    throw err; // Let the caller (app.js) decide whether to exit
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

module.exports = { runMigrations };

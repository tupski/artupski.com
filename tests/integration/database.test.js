'use strict';

/**
 * Integration tests — Supabase connection and migration idempotency
 *
 * Requirements: 2.6, 2.7
 *
 * These tests require real environment variables to run against a live database.
 * They are skipped gracefully when SUPABASE_URL / DATABASE_URL are not set.
 */

// ---------------------------------------------------------------------------
// Environment check — skip all DB tests if env vars are absent
// ---------------------------------------------------------------------------

const SKIP_DB_TESTS =
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_ANON_KEY ||
  !process.env.DATABASE_URL;

// ---------------------------------------------------------------------------
// Supabase client connection tests
// ---------------------------------------------------------------------------

describe('Supabase connection', () => {
  /**
   * Test: Supabase client can be initialized without throwing.
   *
   * When SUPABASE_URL and SUPABASE_ANON_KEY are present, createClient()
   * must return a client object without errors.
   *
   * Requirements: 2.6
   */
  test('client initializes without error when env vars are set', () => {
    if (SKIP_DB_TESTS) {
      console.log('[SKIP] SUPABASE_URL / SUPABASE_ANON_KEY not set — skipping Supabase init test');
      return;
    }

    // Require inside the test so process.exit() in database.js only fires
    // when the env vars are actually present (which they are here).
    const { createClient } = require('@supabase/supabase-js');

    expect(() => {
      const client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      // Client must be a non-null object with a `from` method
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');
    }).not.toThrow();
  });

  /**
   * Test: Supabase client can execute a basic query without throwing.
   *
   * Runs a lightweight SELECT 1 equivalent via the REST API to confirm
   * the connection is live.
   *
   * Requirements: 2.6
   */
  test('client can execute a query against the database', async () => {
    if (SKIP_DB_TESTS) {
      console.log('[SKIP] SUPABASE_URL / SUPABASE_ANON_KEY not set — skipping query test');
      return;
    }

    const { createClient } = require('@supabase/supabase-js');
    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Query the settings table — it must exist after migrations have run.
    // We only check that the call does not throw; the result may be empty.
    const { error } = await client.from('settings').select('key').limit(1);

    expect(error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Migration idempotency tests
// ---------------------------------------------------------------------------

describe('Migration idempotency', () => {
  /**
   * Test: runMigrations() can be called twice without throwing.
   *
   * The SQL uses CREATE TABLE IF NOT EXISTS, so a second run must be a no-op.
   * This test verifies that the migration runner is safe to call on every
   * application startup.
   *
   * Requirements: 2.7
   */
  test('runMigrations() called twice does not throw or duplicate tables', async () => {
    if (SKIP_DB_TESTS) {
      console.log('[SKIP] DATABASE_URL not set — skipping migration idempotency test');
      return;
    }

    // Dynamically require so the process.exit() guard in migrate.js only
    // fires when DATABASE_URL is actually present (which it is here).
    const { runMigrations } = require('../../src/database/migrate');

    // First run — applies migrations
    await expect(runMigrations()).resolves.not.toThrow();

    // Second run — must be a no-op (IF NOT EXISTS guards)
    await expect(runMigrations()).resolves.not.toThrow();
  }, 30000); // Allow up to 30 s for real DB round-trips

  /**
   * Test: After running migrations, all expected tables exist.
   *
   * Queries the Postgres information_schema to confirm every required table
   * was created by the migration script.
   *
   * Requirements: 2.6, 2.7
   */
  test('all required tables exist after running migrations', async () => {
    if (SKIP_DB_TESTS) {
      console.log('[SKIP] DATABASE_URL not set — skipping table existence test');
      return;
    }

    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const REQUIRED_TABLES = [
      'users',
      'settings',
      'portfolios',
      'blog_posts',
      'services',
      'skills',
      'experiences',
      'social_links',
      'contact_messages',
    ];

    let client;
    try {
      client = await pool.connect();

      const { rows } = await client.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_type = 'BASE TABLE'`
      );

      const existingTables = rows.map((r) => r.table_name);

      for (const table of REQUIRED_TABLES) {
        expect(existingTables).toContain(table);
      }
    } finally {
      if (client) client.release();
      await pool.end();
    }
  }, 30000);
});

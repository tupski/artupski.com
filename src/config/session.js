/**
 * Session configuration
 * Uses connect-pg-simple with Supabase PostgreSQL as session store
 * so sessions persist across Vercel serverless function invocations.
 *
 * Requirements: 4.4
 */

'use strict';

const session    = require('express-session');
const PgSession  = require('connect-pg-simple')(session);

const SESSION_SECRET = process.env.SESSION_SECRET;
const DATABASE_URL   = process.env.DATABASE_URL;

if (!SESSION_SECRET) {
  console.warn('[session] WARNING: SESSION_SECRET is not set. Using insecure fallback.');
}

// Build session options — use PostgreSQL store when DATABASE_URL is available
function buildSessionOptions() {
  const base = {
    secret: SESSION_SECRET || 'insecure-fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  if (DATABASE_URL) {
    // Persist sessions in PostgreSQL — survives serverless cold starts
    base.store = new PgSession({
      conString: DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
      ssl: { rejectUnauthorized: false },
    });
    console.log('[session] Using PostgreSQL session store.');
  } else {
    console.warn('[session] DATABASE_URL not set — using in-memory session store (not suitable for production).');
  }

  return base;
}

module.exports = buildSessionOptions();

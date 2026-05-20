'use strict';

/**
 * Session configuration
 * Uses connect-pg-simple with Supabase PostgreSQL as session store
 * so sessions persist across Vercel serverless function invocations.
 *
 * Requirements: 4.4
 */

const session   = require('express-session');
const PgSession = require('connect-pg-simple')(session);

const SESSION_SECRET = process.env.SESSION_SECRET;
const DATABASE_URL   = process.env.DATABASE_URL;

if (!SESSION_SECRET) {
  console.warn('[session] WARNING: SESSION_SECRET is not set. Using insecure fallback.');
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

let store;

if (DATABASE_URL) {
  try {
    store = new PgSession({
      conString: DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
      ssl: { rejectUnauthorized: false },
      // Prune expired sessions every hour
      pruneSessionInterval: 60 * 60,
    });
    console.log('[session] Using PostgreSQL session store.');
  } catch (err) {
    console.error('[session] Failed to create PgSession store:', err.message);
    console.warn('[session] Falling back to in-memory session store.');
    store = undefined;
  }
} else {
  console.warn('[session] DATABASE_URL not set — using in-memory session store.');
}

const sessionOptions = {
  secret: SESSION_SECRET || 'insecure-fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: cookieOptions,
  ...(store ? { store } : {}),
};

module.exports = sessionOptions;

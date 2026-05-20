/**
 * Session configuration
 * Exports express-session options for use in app.js.
 *
 * Requirements: 4.4
 */

'use strict';

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.warn('[session] WARNING: SESSION_SECRET is not set. Using insecure fallback. Set SESSION_SECRET in .env for production.');
}

const sessionOptions = {
  secret: SESSION_SECRET || 'insecure-fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

module.exports = sessionOptions;

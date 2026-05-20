/**
 * src/app.js — Express application entry point
 *
 * Sets up all global middleware, view engine, static files, routes,
 * error handlers, and runs database migrations + seed on startup.
 *
 * Exported as a handler for Vercel serverless functions.
 *
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8
 */

'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

// Internal modules
const sessionOptions = require('./config/session');
const errorHandler = require('./middlewares/errorHandler');
const { runMigrations } = require('./database/migrate');
const { runSeed } = require('./database/seed');

// Route modules
const publicRouter = require('./routes/public');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');

// ─── App Initialization ───────────────────────────────────────────────────────

const app = express();

// ─── Trust Proxy (Vercel / reverse proxy) ────────────────────────────────────
// Required for secure cookies and correct IP detection behind Vercel's proxy

app.set('trust proxy', 1);

// ─── View Engine ─────────────────────────────────────────────────────────────

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(
  helmet({
    // Allow inline scripts/styles needed by Tabler and Quill.js
    contentSecurityPolicy: false,
  })
);

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
// 100 requests per 15 minutes per IP — general protection

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.',
});

app.use(globalLimiter);

// ─── Session ──────────────────────────────────────────────────────────────────

app.use(session(sessionOptions));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
// Using Express built-in parsers (Express 4.16+ bundles body-parser)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ─────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));

// ─── Settings Middleware ───────────────────────────────────────────────────────
// Inject all settings from DB into res.locals.settings on every request

const { injectSettings } = require('./utils/settingsManager');
app.use(injectSettings);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public website routes — mounted at /
app.use('/', publicRouter);

// Auth routes (login/logout) — mounted at /admin
app.use('/admin', authRouter);

// Admin CMS routes — mounted at /admin (auth middleware applied inside router)
app.use('/admin', adminRouter);

// API routes — mounted at /api
app.use('/api', apiRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Must be registered after all routes

app.use((req, res) => {
  res.status(404).render('pages/404', {
    settings: res.locals.settings || {},
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered last (4 arguments = error handler)

app.use(errorHandler);

// ─── Startup: Migrations + Seed + Server Listen ───────────────────────────────

async function startServer() {
  try {
    // Run database migrations (idempotent — safe on every startup)
    await runMigrations();
  } catch (err) {
    console.error('[app] FATAL: Database migration failed. Exiting.');
    console.error('[app]', err.message);
    process.exit(1);
  }

  try {
    // Seed admin user and default settings (idempotent)
    await runSeed();
  } catch (err) {
    // Seed failure is non-fatal — log and continue
    console.error('[app] WARNING: Database seed failed. Continuing startup.');
    console.error('[app]', err.message);
  }

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`[app] Server running on http://localhost:${PORT}`);
    console.log(`[app] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Only start the server when this file is run directly (not imported by Vercel)
if (require.main === module) {
  startServer();
}

// ─── Export for Vercel Serverless Function ────────────────────────────────────

module.exports = app;

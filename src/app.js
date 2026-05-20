'use strict';

/**
 * src/app.js — Express application entry point
 *
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8
 */

require('dotenv').config();

const express = require('express');
const path    = require('path');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const session   = require('express-session');

const sessionOptions  = require('./config/session');
const errorHandler    = require('./middlewares/errorHandler');
const { runMigrations } = require('./database/migrate');
const { runSeed }       = require('./database/seed');
const { injectSettings } = require('./utils/settingsManager');

const publicRouter = require('./routes/public');
const authRouter   = require('./routes/auth');
const adminRouter  = require('./routes/admin');
const apiRouter    = require('./routes/api');

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

// Trust Vercel's reverse proxy so secure cookies and req.ip work correctly
app.set('trust proxy', 1);

// ─── View Engine ──────────────────────────────────────────────────────────────

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Static Files (FIRST — must not depend on session or DB) ─────────────────
// Serve before any middleware that could throw, so CSS/JS always loads.

app.use(express.static(path.join(__dirname, 'public')));

// ─── Security ─────────────────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.',
}));

// ─── Session ──────────────────────────────────────────────────────────────────

app.use(session(sessionOptions));

// ─── Body Parsers ─────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Settings (inject DB settings into res.locals on every request) ───────────

app.use(injectSettings);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/', publicRouter);
app.use('/admin', authRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).render('pages/404', { settings: res.locals.settings || {} });
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Startup (local dev only) ─────────────────────────────────────────────────

async function startServer() {
  try {
    await runMigrations();
  } catch (err) {
    console.error('[app] FATAL: Migration failed:', err.message);
    process.exit(1);
  }

  try {
    await runSeed();
  } catch (err) {
    console.error('[app] WARNING: Seed failed:', err.message);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[app] Server running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;

/**
 * Global error handler middleware
 * Centralized error handling for all Express routes.
 * Never exposes stack traces in production.
 *
 * Requirements: 4.7, 4.8
 */

'use strict';

/**
 * Global error handler.
 * Must be registered AFTER all routes in app.js.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  // Log error details server-side (always)
  console.error(`[errorHandler] ${status} — ${req.method} ${req.url}`);
  console.error('[errorHandler]', err.message);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  // 404 errors — render 404 page
  if (status === 404) {
    return res.status(404).render('pages/404', {
      settings: res.locals.settings || {},
    });
  }

  // All other errors — render 500 page
  // Never expose stack traces in production
  res.status(status).render('pages/500', {
    settings: res.locals.settings || {},
    message: isDev ? err.message : 'Terjadi kesalahan pada server.',
    stack: isDev ? err.stack : null,
  });
}

module.exports = errorHandler;

/**
 * Rate Limiter Middleware
 * Provides rate limiting instances for login and contact form endpoints.
 */

const rateLimit = require('express-rate-limit');

/**
 * Login rate limiter.
 * Allows a maximum of 5 requests per IP within a 15-minute window.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
});

/**
 * Contact form rate limiter.
 * Allows a maximum of 3 requests per IP within a 10-minute window.
 */
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: 'Terlalu banyak pesan dikirim. Coba lagi dalam 10 menit.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, contactLimiter };

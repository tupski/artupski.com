/**
 * Public routes
 * Handles all public-facing pages: homepage, about, portfolio, blog, services, contact.
 *
 * Requirements: 11.1–11.9
 */

'use strict';

const express = require('express');
const router = express.Router();

// TODO: Import publicController when implemented (Task 16.1)
// const publicController = require('../controllers/publicController');

// Placeholder routes — will be replaced with real controller handlers in Task 16.1
router.get('/', (req, res) => {
  res.render('pages/index', { settings: res.locals.settings || {} });
});

router.get('/about', (req, res) => {
  res.render('pages/about', { settings: res.locals.settings || {} });
});

router.get('/portfolio', (req, res) => {
  res.render('pages/portfolio', { settings: res.locals.settings || {} });
});

router.get('/portfolio/:slug', (req, res) => {
  res.render('pages/portfolio-detail', { settings: res.locals.settings || {} });
});

router.get('/services', (req, res) => {
  res.render('pages/services', { settings: res.locals.settings || {} });
});

router.get('/services/:slug', (req, res) => {
  res.render('pages/service-detail', { settings: res.locals.settings || {} });
});

router.get('/blog', (req, res) => {
  res.render('pages/blog', { settings: res.locals.settings || {} });
});

router.get('/blog/:slug', (req, res) => {
  res.render('pages/blog-detail', { settings: res.locals.settings || {} });
});

router.get('/contact', (req, res) => {
  res.render('pages/contact', { settings: res.locals.settings || {} });
});

router.post('/contact', (req, res) => {
  // TODO: Implement contact form submission in Task 16.1
  res.redirect('/contact');
});

module.exports = router;

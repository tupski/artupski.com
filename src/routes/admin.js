/**
 * Admin routes
 * All routes here require authentication via requireAuth middleware.
 * Handles dashboard and all CMS CRUD operations.
 *
 * Requirements: 12.1–12.6
 */

'use strict';

const express               = require('express');
const router                = express.Router();
const { requireAuth }       = require('../middlewares/auth');
const dashboardController   = require('../controllers/dashboardController');
const settingsController    = require('../controllers/settingsController');
const skillsController      = require('../controllers/skillsController');
const blogController        = require('../controllers/blogController');
const portfolioController   = require('../controllers/portfolioController');
const servicesController    = require('../controllers/servicesController');
const experienceController  = require('../controllers/experienceController');
const socialLinksController = require('../controllers/socialLinksController');
const contactController     = require('../controllers/contactController');
const { upload }            = require('../config/multer');

// Apply auth middleware to ALL admin routes
router.use(requireAuth);

// GET /admin — dashboard
router.get('/', dashboardController.index);

// ── Settings routes ───────────────────────────────────────────────────────────
router.get('/settings', settingsController.index);
router.post(
  '/settings',
  upload.fields([
    { name: 'logo',       maxCount: 1 },
    { name: 'favicon',    maxCount: 1 },
    { name: 'hero_image', maxCount: 1 },
  ]),
  settingsController.update
);

// ── Skills routes ─────────────────────────────────────────────────────────────
router.get('/skills',          skillsController.index);
router.get('/skills/create',   skillsController.create);
router.post('/skills',         skillsController.store);
router.get('/skills/:id/edit', skillsController.edit);
router.post('/skills/:id',     skillsController.update);
router.delete('/skills/:id',   skillsController.destroy);

// ── Blog routes ───────────────────────────────────────────────────────────────
router.get('/blog',              blogController.index);
router.get('/blog/create',       blogController.create);
router.post('/blog',             upload.single('featured_image'), blogController.store);
router.get('/blog/:id/edit',     blogController.edit);
router.post('/blog/:id',         upload.single('featured_image'), blogController.update);
router.delete('/blog/:id',       blogController.destroy);

// ── Portfolio routes ──────────────────────────────────────────────────────────
router.get('/portfolio',              portfolioController.index);
router.get('/portfolio/create',       portfolioController.create);
router.post('/portfolio',             upload.single('image'), portfolioController.store);
router.get('/portfolio/:id/edit',     portfolioController.edit);
router.post('/portfolio/:id',         upload.single('image'), portfolioController.update);
router.delete('/portfolio/:id',       portfolioController.destroy);

// ── Services routes ───────────────────────────────────────────────────────────
// Note: servicesController handles multer internally via uploadIcon middleware
router.get('/services',              servicesController.index);
router.get('/services/create',       servicesController.create);
router.post('/services',             servicesController.store);
router.get('/services/:id/edit',     servicesController.edit);
router.post('/services/:id',         servicesController.update);
router.delete('/services/:id',       servicesController.destroy);

// ── Experience routes ─────────────────────────────────────────────────────────
router.get('/experience',              experienceController.index);
router.get('/experience/create',       experienceController.create);
router.post('/experience',             experienceController.store);
router.get('/experience/:id/edit',     experienceController.edit);
router.post('/experience/:id',         experienceController.update);
router.delete('/experience/:id',       experienceController.destroy);

// ── Social Links routes ───────────────────────────────────────────────────────
router.get('/social-links',              socialLinksController.index);
router.get('/social-links/create',       socialLinksController.create);
router.post('/social-links',             socialLinksController.store);
router.get('/social-links/:id/edit',     socialLinksController.edit);
router.post('/social-links/:id',         socialLinksController.update);
router.delete('/social-links/:id',       socialLinksController.destroy);

// ── Messages routes ───────────────────────────────────────────────────────────
router.get('/messages',          contactController.index);
router.get('/messages/:id',      contactController.show);
router.delete('/messages/:id',   contactController.destroy);

module.exports = router;

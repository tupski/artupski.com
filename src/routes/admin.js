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
const contactController     = require('../controllers/contactController');
const { upload }            = require('../config/multer');

// Apply auth middleware to ALL admin routes
router.use(requireAuth);

// GET /admin — dashboard
router.get('/', dashboardController.index);

// ── Settings routes (Task 10.1) ───────────────────────────────────────────────
// GET  /admin/settings       — render settings page
router.get('/settings', settingsController.index);

// POST /admin/settings       — update settings (with optional file uploads)
router.post(
  '/settings',
  upload.fields([
    { name: 'logo',       maxCount: 1 },
    { name: 'favicon',    maxCount: 1 },
    { name: 'hero_image', maxCount: 1 },
  ]),
  settingsController.update
);

// TODO: Mount CMS module routes in their respective tasks:
// router.use('/portfolio', portfolioRoutes);      // Task 12.1
// router.use('/blog', blogRoutes);                // Task 13.1
// router.use('/services', servicesRoutes);        // Task 14.1
// router.use('/experience', experienceRoutes);    // Task 11.3
// router.use('/social-links', socialLinksRoutes); // Task 10.2
// router.use('/messages', messagesRoutes);        // Task 14.2

// ── Skills routes (Task 11.1) ─────────────────────────────────────────────
router.get('/skills',          skillsController.index);
router.get('/skills/create',   skillsController.create);
router.post('/skills',         skillsController.store);
router.get('/skills/:id/edit', skillsController.edit);
router.post('/skills/:id',     skillsController.update);   // handles ?_method=PUT
router.delete('/skills/:id',   skillsController.destroy);  // handles ?_method=DELETE

module.exports = router;

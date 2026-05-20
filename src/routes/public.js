/**
 * Public routes
 * Handles all public-facing pages: homepage, about, portfolio, blog, services, contact.
 *
 * Requirements: 11.1–11.9
 */

'use strict';

const express = require('express');
const router = express.Router();

const publicController = require('../controllers/publicController');
const { contactLimiter } = require('../middlewares/rateLimiter');

router.get('/', publicController.index);
router.get('/about', publicController.about);
router.get('/portfolio', publicController.portfolio);
router.get('/portfolio/:slug', publicController.portfolioDetail);
router.get('/services', publicController.services);
router.get('/services/:slug', publicController.serviceDetail);
router.get('/blog', publicController.blog);
router.get('/blog/:slug', publicController.blogDetail);
router.get('/contact', publicController.contactGet);
router.post('/contact', contactLimiter, publicController.contactPost);

module.exports = router;

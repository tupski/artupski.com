/**
 * Auth routes
 * Handles admin login and logout.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8
 */

'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { loginLimiter } = require('../middlewares/rateLimiter');

// GET /admin/login — render login page (redirect to dashboard if already authenticated)
router.get('/login', authController.getLogin);

// POST /admin/login — process login with rate limiting
router.post('/login', loginLimiter, authController.postLogin);

// GET /admin/logout — destroy session and redirect to login
router.get('/logout', authController.logout);

module.exports = router;

/**
 * API routes
 * AJAX/JSON endpoints used by client-side JavaScript.
 * Currently handles unread message badge count.
 *
 * Requirements: 10.10, 10.11, 10.12
 */

'use strict';

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// GET /api/unread-count — returns unread contact message count as { count: N }
// Used by admin.js to update the sidebar badge without full page reload
router.get('/unread-count', apiController.getUnreadCount);

module.exports = router;

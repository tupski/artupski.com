/**
 * API controller
 * Handles JSON endpoints used by client-side JavaScript.
 *
 * Requirements: 10.10, 10.11, 10.12
 */

'use strict';

const ContactMessage = require('../models/ContactMessage');

/**
 * GET /api/unread-count
 * Returns the number of unread contact messages as JSON.
 * Used by admin.js to update the sidebar badge without a full page reload.
 * Returns { count: 0 } on error to avoid crashing the badge polling.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function getUnreadCount(req, res) {
  try {
    const count = await ContactMessage.countUnread();
    res.json({ count });
  } catch (err) {
    // Don't crash the badge — return 0 silently on any DB error
    console.error('[apiController] getUnreadCount error:', err.message);
    res.json({ count: 0 });
  }
}

module.exports = { getUnreadCount };

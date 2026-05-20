/**
 * Contact Controller (Admin)
 * Handles admin views for contact messages: list, detail, delete.
 *
 * Requirements: 10.7, 10.8, 10.9
 */

'use strict';

const ContactMessage = require('../models/ContactMessage');

/**
 * GET /admin/messages
 * List all contact messages sorted by created_at DESC with status badges.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function index(req, res, next) {
  try {
    const [messages, unreadCount] = await Promise.all([
      ContactMessage.findAll(),
      ContactMessage.countUnread(),
    ]);

    // Consume flash messages from session
    const successMessage = req.session.successMessage || null;
    const errorMessage   = req.session.errorMessage   || null;
    delete req.session.successMessage;
    delete req.session.errorMessage;

    res.render('admin/messages/index', {
      pageTitle:      'Pesan Masuk',
      activePage:     'messages',
      settings:       res.locals.settings || {},
      unreadCount,
      messages,
      successMessage,
      errorMessage,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/messages/:id
 * Show detail of a single message. Auto-marks as read if status is 'unread'.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function show(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      req.session.errorMessage = 'ID pesan tidak valid.';
      return res.redirect('/admin/messages');
    }

    const message = await ContactMessage.findById(id);

    if (!message) {
      req.session.errorMessage = 'Pesan tidak ditemukan.';
      return res.redirect('/admin/messages');
    }

    // Auto-mark as read if still unread
    if (message.status === 'unread') {
      await ContactMessage.markAsRead(id);
      message.status = 'read';
    }

    const unreadCount = await ContactMessage.countUnread();

    res.render('admin/messages/detail', {
      pageTitle:  `Pesan dari ${message.name}`,
      activePage: 'messages',
      settings:   res.locals.settings || {},
      unreadCount,
      message,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/messages/:id
 * Delete a contact message and redirect to index with flash.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function destroy(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      req.session.errorMessage = 'ID pesan tidak valid.';
      return res.redirect('/admin/messages');
    }

    const message = await ContactMessage.findById(id);

    if (!message) {
      req.session.errorMessage = 'Pesan tidak ditemukan.';
      return res.redirect('/admin/messages');
    }

    await ContactMessage.remove(id);

    req.session.successMessage = 'Pesan berhasil dihapus.';
    res.redirect('/admin/messages');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, destroy };

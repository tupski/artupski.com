/**
 * Auth Controller
 * Handles admin login and logout.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8
 */

'use strict';

const bcrypt = require('bcrypt');
const User = require('../models/User');

/**
 * GET /admin/login
 * Render the login page, or redirect to dashboard if already authenticated.
 */
async function getLogin(req, res) {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { settings: res.locals.settings || {}, error: null });
}

/**
 * POST /admin/login
 * Validate email/password, create session on success, show generic error on failure.
 */
async function postLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);

    if (!user) {
      return res.render('admin/login', {
        settings: res.locals.settings || {},
        error: 'Email atau password salah',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render('admin/login', {
        settings: res.locals.settings || {},
        error: 'Email atau password salah',
      });
    }

    req.session.adminId = user.id;
    return res.redirect('/admin');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/logout
 * Destroy the session and redirect to login page.
 */
function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

module.exports = { getLogin, postLogin, logout };

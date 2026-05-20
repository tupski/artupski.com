/**
 * Settings Controller
 * Handles admin settings page — view and update all website settings.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

'use strict';

const path = require('path');
const { getAllSettings, updateSetting } = require('../utils/settingsManager');
const { processImage } = require('../utils/mediaHandler');

/**
 * GET /admin/settings
 * Render the settings page with all current settings from DB.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function index(req, res, next) {
  try {
    const settings = await getAllSettings();

    // Read flash messages from session and clear them
    const successMessage = req.session.flash_success || null;
    const errorMessage   = req.session.flash_error   || null;
    delete req.session.flash_success;
    delete req.session.flash_error;

    res.render('admin/settings/index', {
      pageTitle:      'Settings',
      activePage:     'settings',
      settings,
      unreadCount:    res.locals.unreadCount || 0,
      successMessage,
      errorMessage,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/settings
 * Update settings from form submission.
 * Handles text fields and optional file uploads for logo, favicon, hero_image.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function update(req, res, next) {
  try {
    const body  = req.body  || {};
    const files = req.files || {};

    // ── Text / textarea settings ──────────────────────────────────────────────
    const textFields = [
      'site_name',
      'tagline',
      'hero_title',
      'hero_subtitle',
      'hero_description',
      'about_content',
      'contact_email',
      'whatsapp_number',
      'address',
      'footer_text',
      'seo_title_default',
      'seo_description_default',
    ];

    for (const key of textFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        await updateSetting(key, body[key] || '');
      }
    }

    // ── File uploads: logo, favicon, hero_image ───────────────────────────────
    const fileFields = ['logo', 'favicon', 'hero_image'];

    for (const fieldName of fileFields) {
      const fileArray = files[fieldName];
      if (!fileArray || fileArray.length === 0) continue;

      const file = fileArray[0];

      // Build output path alongside the uploaded file (same directory)
      const ext        = path.extname(file.filename);
      const baseName   = path.basename(file.filename, ext);
      const outputName = `${baseName}-processed${ext}`;
      const outputPath = path.join(path.dirname(file.path), outputName);

      // Compress / resize via sharp
      await processImage(file.path, outputPath, { quality: 80, maxWidth: 1200 });

      // Store the public URL path (relative to /public)
      const publicPath = `/uploads/${outputName}`;
      await updateSetting(fieldName, publicPath);
    }

    req.session.flash_success = 'Settings berhasil disimpan.';
    return res.redirect('/admin/settings');
  } catch (err) {
    req.session.flash_error = `Gagal menyimpan settings: ${err.message}`;
    return res.redirect('/admin/settings');
  }
}

module.exports = { index, update };

'use strict';

/**
 * Settings Controller
 * Handles admin settings page — view and update all website settings.
 * Uses Supabase Storage for logo, favicon, and hero_image uploads.
 */

const { getAllSettings, updateSetting } = require('../utils/settingsManager');
const { uploadToSupabase } = require('../utils/mediaHandler');

async function index(req, res, next) {
  try {
    const settings = await getAllSettings();

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

async function update(req, res, next) {
  try {
    const body  = req.body  || {};
    const files = req.files || {};

    // ── Text / textarea settings ──────────────────────────────────────────────
    const textFields = [
      'site_name', 'tagline', 'hero_title', 'hero_subtitle', 'hero_description',
      'about_content', 'contact_email', 'whatsapp_number', 'address',
      'footer_text', 'seo_title_default', 'seo_description_default',
    ];

    for (const key of textFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        await updateSetting(key, body[key] || '');
      }
    }

    // ── File uploads: logo, favicon, hero_image → Supabase Storage ───────────
    const fileFields = ['logo', 'favicon', 'hero_image'];

    for (const fieldName of fileFields) {
      const fileArray = files[fieldName];
      if (!fileArray || fileArray.length === 0) continue;

      const file = fileArray[0];

      // Upload to Supabase Storage and get public URL
      const publicUrl = await uploadToSupabase(file, { folder: 'settings' });
      await updateSetting(fieldName, publicUrl);
    }

    req.session.flash_success = 'Settings berhasil disimpan.';
    return res.redirect('/admin/settings');
  } catch (err) {
    req.session.flash_error = `Gagal menyimpan settings: ${err.message}`;
    return res.redirect('/admin/settings');
  }
}

module.exports = { index, update };

/**
 * Social Links Controller
 * Handles CRUD operations for the social_links table in the admin panel.
 *
 * Requirements: 6.5
 */

'use strict';

const SocialLink = require('../models/SocialLink');

/**
 * GET /admin/social-links
 * List all social links.
 */
async function index(req, res, next) {
  try {
    const socialLinks = await SocialLink.findAll();

    const successMessage = req.session.successMessage || null;
    const errorMessage   = req.session.errorMessage   || null;
    delete req.session.successMessage;
    delete req.session.errorMessage;

    res.render('admin/social-links/index', {
      pageTitle:      'Social Links',
      activePage:     'social-links',
      settings:       res.locals.settings || {},
      unreadCount:    res.locals.unreadCount || 0,
      socialLinks,
      successMessage,
      errorMessage,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/social-links/create
 * Render the create form.
 */
function create(req, res) {
  res.render('admin/social-links/create', {
    pageTitle:    'Tambah Social Link',
    activePage:   'social-links',
    settings:     res.locals.settings || {},
    unreadCount:  res.locals.unreadCount || 0,
    errorMessage: null,
    formData:     {},
  });
}

/**
 * POST /admin/social-links
 * Save a new social link and redirect to index.
 */
async function store(req, res, next) {
  try {
    const { platform, url, icon, is_active } = req.body;

    // Basic validation
    if (!platform || !platform.trim()) {
      return res.render('admin/social-links/create', {
        pageTitle:    'Tambah Social Link',
        activePage:   'social-links',
        settings:     res.locals.settings || {},
        unreadCount:  res.locals.unreadCount || 0,
        errorMessage: 'Platform wajib diisi.',
        formData:     req.body,
      });
    }

    if (!url || !url.trim()) {
      return res.render('admin/social-links/create', {
        pageTitle:    'Tambah Social Link',
        activePage:   'social-links',
        settings:     res.locals.settings || {},
        unreadCount:  res.locals.unreadCount || 0,
        errorMessage: 'URL wajib diisi.',
        formData:     req.body,
      });
    }

    await SocialLink.create({
      platform:  platform.trim(),
      url:       url.trim(),
      icon:      icon ? icon.trim() : null,
      is_active: is_active === 'on' || is_active === 'true' || is_active === true,
    });

    req.session.successMessage = `Social link "${platform.trim()}" berhasil ditambahkan.`;
    res.redirect('/admin/social-links');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/social-links/:id/edit
 * Render the edit form with current data.
 */
async function edit(req, res, next) {
  try {
    const socialLink = await SocialLink.findById(req.params.id);

    if (!socialLink) {
      req.session.errorMessage = 'Social link tidak ditemukan.';
      return res.redirect('/admin/social-links');
    }

    res.render('admin/social-links/edit', {
      pageTitle:    'Edit Social Link',
      activePage:   'social-links',
      settings:     res.locals.settings || {},
      unreadCount:  res.locals.unreadCount || 0,
      socialLink,
      errorMessage: null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/social-links/:id/update  (method-override for PUT)
 * Update a social link and redirect to index.
 */
async function update(req, res, next) {
  try {
    const { platform, url, icon, is_active } = req.body;
    const { id } = req.params;

    // Basic validation
    if (!platform || !platform.trim()) {
      const socialLink = await SocialLink.findById(id);
      return res.render('admin/social-links/edit', {
        pageTitle:    'Edit Social Link',
        activePage:   'social-links',
        settings:     res.locals.settings || {},
        unreadCount:  res.locals.unreadCount || 0,
        socialLink:   socialLink || { id, ...req.body },
        errorMessage: 'Platform wajib diisi.',
      });
    }

    if (!url || !url.trim()) {
      const socialLink = await SocialLink.findById(id);
      return res.render('admin/social-links/edit', {
        pageTitle:    'Edit Social Link',
        activePage:   'social-links',
        settings:     res.locals.settings || {},
        unreadCount:  res.locals.unreadCount || 0,
        socialLink:   socialLink || { id, ...req.body },
        errorMessage: 'URL wajib diisi.',
      });
    }

    await SocialLink.update(id, {
      platform:  platform.trim(),
      url:       url.trim(),
      icon:      icon ? icon.trim() : null,
      is_active: is_active === 'on' || is_active === 'true' || is_active === true,
    });

    req.session.successMessage = `Social link "${platform.trim()}" berhasil diperbarui.`;
    res.redirect('/admin/social-links');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/social-links/:id/delete  (method-override for DELETE)
 * Delete a social link and redirect to index.
 */
async function destroy(req, res, next) {
  try {
    const socialLink = await SocialLink.findById(req.params.id);

    if (!socialLink) {
      req.session.errorMessage = 'Social link tidak ditemukan.';
      return res.redirect('/admin/social-links');
    }

    await SocialLink.remove(req.params.id);

    req.session.successMessage = `Social link "${socialLink.platform}" berhasil dihapus.`;
    res.redirect('/admin/social-links');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, store, edit, update, destroy };

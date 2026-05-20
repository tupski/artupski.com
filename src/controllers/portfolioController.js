/**
 * Portfolio Controller (Admin)
 * Handles CRUD operations for portfolio items in the admin panel.
 * Auto-generates slugs via Slug_Generator, validates uniqueness,
 * and handles image uploads via Media_Handler.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.8, 7.9
 */

'use strict';

const path                            = require('path');
const fs                              = require('fs');
const Portfolio                       = require('../models/Portfolio');
const { generateSlug, ensureUniqueSlug } = require('../utils/slugGenerator');
const { processImage }                = require('../utils/mediaHandler');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Delete a file from disk if it exists (used to clean up old images on update).
 * @param {string} relativePath - e.g. '/uploads/filename.jpg'
 */
function deleteUploadedFile(relativePath) {
  if (!relativePath) return;
  try {
    const abs = path.join(__dirname, '../public', relativePath);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
    }
  } catch (_) {
    // Non-fatal — log silently
  }
}

/**
 * Process an uploaded image file with sharp and return the public-relative path.
 * Deletes the original multer temp file after processing.
 *
 * @param {Express.Multer.File} file - Multer file object
 * @returns {Promise<string>} Public-relative path e.g. '/uploads/processed-xxx.jpg'
 */
async function handleImageUpload(file) {
  const inputPath  = file.path;
  const outputPath = file.path; // process in-place (same file)

  await processImage(inputPath, outputPath, { quality: 80, maxWidth: 1200 });

  // Return path relative to /public so it can be stored in DB and served statically
  return '/uploads/' + file.filename;
}

// ─── Controller Actions ──────────────────────────────────────────────────────

/**
 * GET /admin/portfolio
 * List all portfolio items sorted by created_at DESC.
 */
async function index(req, res, next) {
  try {
    const portfolios = await Portfolio.findAll();

    const successMessage = req.session.successMessage || null;
    const errorMessage   = req.session.errorMessage   || null;
    delete req.session.successMessage;
    delete req.session.errorMessage;

    res.render('admin/portfolio/index', {
      pageTitle: 'Portfolio',
      activePage: 'portfolio',
      settings: res.locals.settings || {},
      unreadCount: res.locals.unreadCount || 0,
      portfolios,
      successMessage,
      errorMessage,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/portfolio/create
 * Render the create portfolio form.
 */
function create(req, res) {
  const errorMessage = req.session.errorMessage || null;
  delete req.session.errorMessage;

  res.render('admin/portfolio/create', {
    pageTitle: 'Tambah Portfolio',
    activePage: 'portfolio',
    settings: res.locals.settings || {},
    unreadCount: res.locals.unreadCount || 0,
    portfolio: {},
    errorMessage,
  });
}

/**
 * POST /admin/portfolio
 * Create a new portfolio item.
 * - Auto-generates slug from title if not provided
 * - Validates slug uniqueness
 * - Handles image upload via multer + sharp
 */
async function store(req, res, next) {
  try {
    const {
      title,
      slug: rawSlug,
      short_description,
      full_description,
      tech_stack,
      category,
      client_name,
      demo_link,
      github_link,
      status,
    } = req.body;

    // Basic validation
    if (!title || !title.trim()) {
      if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
      req.session.errorMessage = 'Judul portfolio wajib diisi.';
      return res.redirect('/admin/portfolio/create');
    }

    // Generate or sanitize slug
    const baseSlug  = rawSlug && rawSlug.trim() ? generateSlug(rawSlug.trim()) : generateSlug(title.trim());
    const finalSlug = await ensureUniqueSlug(baseSlug, Portfolio);

    // Handle image upload
    let imagePath = null;
    if (req.file) {
      imagePath = await handleImageUpload(req.file);
    }

    await Portfolio.create({
      title:             title.trim(),
      slug:              finalSlug,
      short_description: short_description ? short_description.trim() : null,
      full_description:  full_description  || null,
      tech_stack:        tech_stack        ? tech_stack.trim()        : null,
      image:             imagePath,
      category:          category          ? category.trim()          : null,
      client_name:       client_name       ? client_name.trim()       : null,
      demo_link:         demo_link         ? demo_link.trim()         : null,
      github_link:       github_link       ? github_link.trim()       : null,
      status:            status === 'published' ? 'published' : 'draft',
    });

    req.session.successMessage = `Portfolio "${title.trim()}" berhasil ditambahkan.`;
    res.redirect('/admin/portfolio');
  } catch (err) {
    if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
    next(err);
  }
}

/**
 * GET /admin/portfolio/:id/edit
 * Render the edit portfolio form with current data.
 */
async function edit(req, res, next) {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      req.session.errorMessage = 'Portfolio tidak ditemukan.';
      return res.redirect('/admin/portfolio');
    }

    const errorMessage = req.session.errorMessage || null;
    delete req.session.errorMessage;

    res.render('admin/portfolio/edit', {
      pageTitle: 'Edit Portfolio',
      activePage: 'portfolio',
      settings: res.locals.settings || {},
      unreadCount: res.locals.unreadCount || 0,
      portfolio,
      errorMessage,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/portfolio/:id
 * Update an existing portfolio item.
 * - Validates slug uniqueness (excluding current item)
 * - Handles image upload (replaces old image if new one provided)
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await Portfolio.findById(id);

    if (!existing) {
      if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
      req.session.errorMessage = 'Portfolio tidak ditemukan.';
      return res.redirect('/admin/portfolio');
    }

    const {
      title,
      slug: rawSlug,
      short_description,
      full_description,
      tech_stack,
      category,
      client_name,
      demo_link,
      github_link,
      status,
    } = req.body;

    // Basic validation
    if (!title || !title.trim()) {
      if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
      req.session.errorMessage = 'Judul portfolio wajib diisi.';
      return res.redirect(`/admin/portfolio/${id}/edit`);
    }

    // Generate or sanitize slug, excluding current item from uniqueness check
    const baseSlug  = rawSlug && rawSlug.trim() ? generateSlug(rawSlug.trim()) : generateSlug(title.trim());
    const finalSlug = await ensureUniqueSlug(baseSlug, Portfolio, id);

    // Handle image upload — replace old image if new one provided
    let imagePath = existing.image;
    if (req.file) {
      if (existing.image) {
        deleteUploadedFile(existing.image);
      }
      imagePath = await handleImageUpload(req.file);
    }

    await Portfolio.update(id, {
      title:             title.trim(),
      slug:              finalSlug,
      short_description: short_description ? short_description.trim() : null,
      full_description:  full_description  || null,
      tech_stack:        tech_stack        ? tech_stack.trim()        : null,
      image:             imagePath,
      category:          category          ? category.trim()          : null,
      client_name:       client_name       ? client_name.trim()       : null,
      demo_link:         demo_link         ? demo_link.trim()         : null,
      github_link:       github_link       ? github_link.trim()       : null,
      status:            status === 'published' ? 'published' : 'draft',
    });

    req.session.successMessage = `Portfolio "${title.trim()}" berhasil diperbarui.`;
    res.redirect('/admin/portfolio');
  } catch (err) {
    if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
    next(err);
  }
}

/**
 * DELETE /admin/portfolio/:id
 * Delete a portfolio item and its associated image file.
 */
async function destroy(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await Portfolio.findById(id);

    if (!existing) {
      req.session.errorMessage = 'Portfolio tidak ditemukan.';
      return res.redirect('/admin/portfolio');
    }

    // Remove image file from disk
    if (existing.image) {
      deleteUploadedFile(existing.image);
    }

    await Portfolio.remove(id);

    req.session.successMessage = `Portfolio "${existing.title}" berhasil dihapus.`;
    res.redirect('/admin/portfolio');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, store, edit, update, destroy };

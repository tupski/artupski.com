'use strict';

/**
 * Portfolio Controller (Admin)
 * Handles CRUD operations for portfolio items in the admin panel.
 * Uses Supabase Storage for image uploads.
 */

const Portfolio = require('../models/Portfolio');
const { generateSlug, ensureUniqueSlug } = require('../utils/slugGenerator');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/mediaHandler');

// ─── Controller Actions ──────────────────────────────────────────────────────

async function index(req, res, next) {
  try {
    const portfolios = await Portfolio.findAll();

    const successMessage = req.session.successMessage || null;
    const errorMessage   = req.session.errorMessage   || null;
    delete req.session.successMessage;
    delete req.session.errorMessage;

    res.render('admin/portfolio/index', {
      pageTitle:   'Portfolio',
      activePage:  'portfolio',
      settings:    res.locals.settings || {},
      unreadCount: res.locals.unreadCount || 0,
      portfolios,
      successMessage,
      errorMessage,
    });
  } catch (err) {
    next(err);
  }
}

function create(req, res) {
  const errorMessage = req.session.errorMessage || null;
  delete req.session.errorMessage;

  res.render('admin/portfolio/create', {
    pageTitle:   'Tambah Portfolio',
    activePage:  'portfolio',
    settings:    res.locals.settings || {},
    unreadCount: res.locals.unreadCount || 0,
    portfolio:   {},
    errorMessage,
  });
}

async function store(req, res, next) {
  try {
    const {
      title, slug: rawSlug, short_description, full_description,
      tech_stack, category, client_name, demo_link, github_link, status,
    } = req.body;

    if (!title || !title.trim()) {
      req.session.errorMessage = 'Judul portfolio wajib diisi.';
      return res.redirect('/admin/portfolio/create');
    }

    const baseSlug  = rawSlug && rawSlug.trim() ? generateSlug(rawSlug.trim()) : generateSlug(title.trim());
    const finalSlug = await ensureUniqueSlug(baseSlug, Portfolio);

    // Upload image to Supabase Storage
    let imagePath = null;
    if (req.file) {
      imagePath = await uploadToSupabase(req.file, { folder: 'portfolio' });
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
    next(err);
  }
}

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
      pageTitle:   'Edit Portfolio',
      activePage:  'portfolio',
      settings:    res.locals.settings || {},
      unreadCount: res.locals.unreadCount || 0,
      portfolio,
      errorMessage,
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await Portfolio.findById(id);

    if (!existing) {
      req.session.errorMessage = 'Portfolio tidak ditemukan.';
      return res.redirect('/admin/portfolio');
    }

    const {
      title, slug: rawSlug, short_description, full_description,
      tech_stack, category, client_name, demo_link, github_link, status,
    } = req.body;

    if (!title || !title.trim()) {
      req.session.errorMessage = 'Judul portfolio wajib diisi.';
      return res.redirect(`/admin/portfolio/${id}/edit`);
    }

    const baseSlug  = rawSlug && rawSlug.trim() ? generateSlug(rawSlug.trim()) : generateSlug(title.trim());
    const finalSlug = await ensureUniqueSlug(baseSlug, Portfolio, id);

    // Upload new image and delete old one from Supabase Storage
    let imagePath = existing.image;
    if (req.file) {
      await deleteFromSupabase(existing.image);
      imagePath = await uploadToSupabase(req.file, { folder: 'portfolio' });
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
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await Portfolio.findById(id);

    if (!existing) {
      req.session.errorMessage = 'Portfolio tidak ditemukan.';
      return res.redirect('/admin/portfolio');
    }

    // Delete image from Supabase Storage
    await deleteFromSupabase(existing.image);

    await Portfolio.remove(id);

    req.session.successMessage = `Portfolio "${existing.title}" berhasil dihapus.`;
    res.redirect('/admin/portfolio');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, store, edit, update, destroy };

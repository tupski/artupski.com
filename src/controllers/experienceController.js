/**
 * Experience Controller
 * Handles CRUD operations for work experience entries in the admin panel.
 *
 * Requirements: 6.2
 */

'use strict';

const Experience = require('../models/Experience');

/**
 * GET /admin/experience
 * List all experience entries sorted by start_date DESC.
 */
async function index(req, res, next) {
  try {
    const experiences = await Experience.findAll();

    res.render('admin/experience/index', {
      pageTitle:      'Work Experience',
      activePage:     'experience',
      settings:       res.locals.settings || {},
      unreadCount:    res.locals.unreadCount || 0,
      experiences,
      successMessage: req.session.successMessage || null,
      errorMessage:   req.session.errorMessage   || null,
    });

    // Clear flash messages after rendering
    delete req.session.successMessage;
    delete req.session.errorMessage;
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/experience/create
 * Render the create experience form.
 */
function create(req, res) {
  res.render('admin/experience/create', {
    pageTitle:    'Tambah Experience',
    activePage:   'experience',
    settings:     res.locals.settings || {},
    unreadCount:  res.locals.unreadCount || 0,
    errorMessage: req.session.errorMessage || null,
    formData:     {},
  });

  delete req.session.errorMessage;
}

/**
 * POST /admin/experience
 * Save a new experience entry and redirect to index.
 */
async function store(req, res, next) {
  try {
    const {
      company_name,
      position,
      description,
      start_date,
      end_date,
      is_current,
    } = req.body;

    // Basic validation
    if (!company_name || !company_name.trim()) {
      req.session.errorMessage = 'Nama perusahaan wajib diisi.';
      return res.redirect('/admin/experience/create');
    }
    if (!position || !position.trim()) {
      req.session.errorMessage = 'Posisi/jabatan wajib diisi.';
      return res.redirect('/admin/experience/create');
    }
    if (!start_date) {
      req.session.errorMessage = 'Tanggal mulai wajib diisi.';
      return res.redirect('/admin/experience/create');
    }

    const isCurrent = is_current === 'on' || is_current === '1' || is_current === true;

    await Experience.create({
      company_name:  company_name.trim(),
      position:      position.trim(),
      description:   description ? description.trim() : null,
      start_date,
      end_date:      isCurrent ? null : (end_date || null),
      is_current:    isCurrent,
    });

    req.session.successMessage = 'Experience berhasil ditambahkan.';
    res.redirect('/admin/experience');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/experience/:id/edit
 * Render the edit form with current experience data.
 */
async function edit(req, res, next) {
  try {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      req.session.errorMessage = 'Experience tidak ditemukan.';
      return res.redirect('/admin/experience');
    }

    res.render('admin/experience/edit', {
      pageTitle:    'Edit Experience',
      activePage:   'experience',
      settings:     res.locals.settings || {},
      unreadCount:  res.locals.unreadCount || 0,
      experience,
      errorMessage: req.session.errorMessage || null,
    });

    delete req.session.errorMessage;
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/experience/:id
 * Update an existing experience entry and redirect to index.
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const {
      company_name,
      position,
      description,
      start_date,
      end_date,
      is_current,
    } = req.body;

    // Basic validation
    if (!company_name || !company_name.trim()) {
      req.session.errorMessage = 'Nama perusahaan wajib diisi.';
      return res.redirect(`/admin/experience/${id}/edit`);
    }
    if (!position || !position.trim()) {
      req.session.errorMessage = 'Posisi/jabatan wajib diisi.';
      return res.redirect(`/admin/experience/${id}/edit`);
    }
    if (!start_date) {
      req.session.errorMessage = 'Tanggal mulai wajib diisi.';
      return res.redirect(`/admin/experience/${id}/edit`);
    }

    const isCurrent = is_current === 'on' || is_current === '1' || is_current === true;

    await Experience.update(id, {
      company_name:  company_name.trim(),
      position:      position.trim(),
      description:   description ? description.trim() : null,
      start_date,
      end_date:      isCurrent ? null : (end_date || null),
      is_current:    isCurrent,
    });

    req.session.successMessage = 'Experience berhasil diperbarui.';
    res.redirect('/admin/experience');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/experience/:id
 * Delete an experience entry and redirect to index.
 */
async function destroy(req, res, next) {
  try {
    await Experience.remove(req.params.id);
    req.session.successMessage = 'Experience berhasil dihapus.';
    res.redirect('/admin/experience');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, store, edit, update, destroy };

/**
 * Skills Controller
 * Handles CRUD operations for the `skills` table.
 * Validates that `level` is an integer between 0 and 100 before saving.
 *
 * Requirements: 6.1, 6.3
 */

'use strict';

const Skill = require('../models/Skill');

/**
 * GET /admin/skills
 * List all skills sorted by sort_order ASC.
 */
async function index(req, res, next) {
  try {
    const skills = await Skill.findAll();

    res.render('admin/skills/index', {
      pageTitle:      'Skills',
      activePage:     'skills',
      settings:       res.locals.settings || {},
      unreadCount:    res.locals.unreadCount || 0,
      skills,
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
 * GET /admin/skills/create
 * Render the create skill form.
 */
function create(req, res) {
  res.render('admin/skills/create', {
    pageTitle:    'Tambah Skill',
    activePage:   'skills',
    settings:     res.locals.settings || {},
    unreadCount:  res.locals.unreadCount || 0,
    errorMessage: null,
    formData:     {},
  });
}

/**
 * POST /admin/skills
 * Validate and save a new skill.
 */
async function store(req, res, next) {
  try {
    const { name, level, category, sort_order } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.render('admin/skills/create', {
        pageTitle:    'Tambah Skill',
        activePage:   'skills',
        settings:     res.locals.settings || {},
        unreadCount:  res.locals.unreadCount || 0,
        errorMessage: 'Nama skill wajib diisi.',
        formData:     req.body,
      });
    }

    // Validate level: must be an integer between 0 and 100
    const levelInt = parseInt(level, 10);
    if (isNaN(levelInt) || levelInt < 0 || levelInt > 100) {
      return res.render('admin/skills/create', {
        pageTitle:    'Tambah Skill',
        activePage:   'skills',
        settings:     res.locals.settings || {},
        unreadCount:  res.locals.unreadCount || 0,
        errorMessage: 'Level skill harus berupa angka antara 0 dan 100.',
        formData:     req.body,
      });
    }

    await Skill.create({
      name:       name.trim(),
      level:      levelInt,
      category:   category && category.trim() !== '' ? category.trim() : null,
      sort_order: sort_order ? parseInt(sort_order, 10) || 0 : 0,
    });

    req.session.successMessage = `Skill "${name.trim()}" berhasil ditambahkan.`;
    res.redirect('/admin/skills');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/skills/:id/edit
 * Render the edit skill form with current data.
 */
async function edit(req, res, next) {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      req.session.errorMessage = 'Skill tidak ditemukan.';
      return res.redirect('/admin/skills');
    }

    res.render('admin/skills/edit', {
      pageTitle:    'Edit Skill',
      activePage:   'skills',
      settings:     res.locals.settings || {},
      unreadCount:  res.locals.unreadCount || 0,
      errorMessage: null,
      skill,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/skills/:id  (submitted as POST with _method=PUT)
 * Validate and update an existing skill.
 */
async function update(req, res, next) {
  try {
    const { name, level, category, sort_order } = req.body;
    const { id } = req.params;

    // Ensure skill exists
    const existing = await Skill.findById(id);
    if (!existing) {
      req.session.errorMessage = 'Skill tidak ditemukan.';
      return res.redirect('/admin/skills');
    }

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.render('admin/skills/edit', {
        pageTitle:    'Edit Skill',
        activePage:   'skills',
        settings:     res.locals.settings || {},
        unreadCount:  res.locals.unreadCount || 0,
        errorMessage: 'Nama skill wajib diisi.',
        skill:        { ...existing, ...req.body, id },
      });
    }

    // Validate level: must be an integer between 0 and 100
    const levelInt = parseInt(level, 10);
    if (isNaN(levelInt) || levelInt < 0 || levelInt > 100) {
      return res.render('admin/skills/edit', {
        pageTitle:    'Edit Skill',
        activePage:   'skills',
        settings:     res.locals.settings || {},
        unreadCount:  res.locals.unreadCount || 0,
        errorMessage: 'Level skill harus berupa angka antara 0 dan 100.',
        skill:        { ...existing, ...req.body, id },
      });
    }

    await Skill.update(id, {
      name:       name.trim(),
      level:      levelInt,
      category:   category && category.trim() !== '' ? category.trim() : null,
      sort_order: sort_order ? parseInt(sort_order, 10) || 0 : 0,
    });

    req.session.successMessage = `Skill "${name.trim()}" berhasil diperbarui.`;
    res.redirect('/admin/skills');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/skills/:id  (submitted as POST with _method=DELETE)
 * Delete a skill and redirect back to the list.
 */
async function destroy(req, res, next) {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      req.session.errorMessage = 'Skill tidak ditemukan.';
      return res.redirect('/admin/skills');
    }

    await Skill.remove(req.params.id);

    req.session.successMessage = `Skill "${skill.name}" berhasil dihapus.`;
    res.redirect('/admin/skills');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, store, edit, update, destroy };

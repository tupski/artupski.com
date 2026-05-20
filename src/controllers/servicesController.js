'use strict';

/**
 * Services Controller (Admin)
 * Handles CRUD operations for the services CMS module.
 * Uses Supabase Storage for icon/image uploads.
 */

const Service = require('../models/Service');
const { generateSlug, ensureUniqueSlug } = require('../utils/slugGenerator');
const { upload } = require('../config/multer');
const { uploadToSupabase } = require('../utils/mediaHandler');

// Multer middleware for icon_image field (memory storage)
const uploadIcon = upload.single('icon_image');

async function index(req, res, next) {
  try {
    const services = await Service.findAll();

    res.render('admin/services/index', {
      pageTitle:      'Services',
      activePage:     'services',
      settings:       res.locals.settings || {},
      unreadCount:    res.locals.unreadCount || 0,
      services,
      successMessage: req.session.successMessage || null,
      errorMessage:   req.session.errorMessage   || null,
    });

    delete req.session.successMessage;
    delete req.session.errorMessage;
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.render('admin/services/create', {
      pageTitle:    'Tambah Service',
      activePage:   'services',
      settings:     res.locals.settings || {},
      unreadCount:  res.locals.unreadCount || 0,
      breadcrumbs:  [{ label: 'Services', href: '/admin/services' }, { label: 'Tambah' }],
      errorMessage: req.session.errorMessage || null,
      formData:     req.session.formData     || {},
    });

    delete req.session.errorMessage;
    delete req.session.formData;
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  uploadIcon(req, res, async function (uploadErr) {
    try {
      if (uploadErr) {
        req.session.errorMessage = uploadErr.message;
        req.session.formData     = req.body;
        return res.redirect('/admin/services/create');
      }

      const {
        title, slug: rawSlug, short_description, full_description,
        price_label, sort_order, status,
      } = req.body;

      if (!title || !title.trim()) {
        req.session.errorMessage = 'Judul service wajib diisi.';
        req.session.formData     = req.body;
        return res.redirect('/admin/services/create');
      }

      const baseSlug  = rawSlug && rawSlug.trim() ? generateSlug(rawSlug.trim()) : generateSlug(title.trim());
      const finalSlug = await ensureUniqueSlug(baseSlug, Service);

      // Upload icon to Supabase Storage
      let iconPath = null;
      if (req.file) {
        iconPath = await uploadToSupabase(req.file, { folder: 'services' });
      }

      await Service.create({
        title:             title.trim(),
        slug:              finalSlug,
        short_description: short_description ? short_description.trim() : null,
        full_description:  full_description  || null,
        icon_image:        iconPath,
        price_label:       price_label ? price_label.trim() : null,
        sort_order:        sort_order  ? parseInt(sort_order, 10) : 0,
        status:            status === 'active' ? 'active' : 'inactive',
      });

      req.session.successMessage = `Service "${title.trim()}" berhasil ditambahkan.`;
      res.redirect('/admin/services');
    } catch (err) {
      next(err);
    }
  });
}

async function edit(req, res, next) {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      req.session.errorMessage = 'Service tidak ditemukan.';
      return res.redirect('/admin/services');
    }

    res.render('admin/services/edit', {
      pageTitle:    'Edit Service',
      activePage:   'services',
      settings:     res.locals.settings || {},
      unreadCount:  res.locals.unreadCount || 0,
      breadcrumbs:  [{ label: 'Services', href: '/admin/services' }, { label: 'Edit' }],
      service,
      errorMessage: req.session.errorMessage || null,
    });

    delete req.session.errorMessage;
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  const { id } = req.params;

  uploadIcon(req, res, async function (uploadErr) {
    try {
      if (uploadErr) {
        req.session.errorMessage = uploadErr.message;
        return res.redirect(`/admin/services/${id}/edit`);
      }

      const existing = await Service.findById(id);
      if (!existing) {
        req.session.errorMessage = 'Service tidak ditemukan.';
        return res.redirect('/admin/services');
      }

      const {
        title, slug: rawSlug, short_description, full_description,
        price_label, sort_order, status,
      } = req.body;

      if (!title || !title.trim()) {
        req.session.errorMessage = 'Judul service wajib diisi.';
        return res.redirect(`/admin/services/${id}/edit`);
      }

      const baseSlug  = rawSlug && rawSlug.trim() ? generateSlug(rawSlug.trim()) : generateSlug(title.trim());
      const finalSlug = await ensureUniqueSlug(baseSlug, Service, parseInt(id, 10));

      // Upload new icon to Supabase Storage (keep existing if no new file)
      let iconPath = existing.icon_image;
      if (req.file) {
        iconPath = await uploadToSupabase(req.file, { folder: 'services' });
      }

      await Service.update(id, {
        title:             title.trim(),
        slug:              finalSlug,
        short_description: short_description ? short_description.trim() : null,
        full_description:  full_description  || null,
        icon_image:        iconPath,
        price_label:       price_label ? price_label.trim() : null,
        sort_order:        sort_order  ? parseInt(sort_order, 10) : 0,
        status:            status === 'active' ? 'active' : 'inactive',
      });

      req.session.successMessage = `Service "${title.trim()}" berhasil diperbarui.`;
      res.redirect('/admin/services');
    } catch (err) {
      next(err);
    }
  });
}

async function destroy(req, res, next) {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      req.session.errorMessage = 'Service tidak ditemukan.';
      return res.redirect('/admin/services');
    }

    await Service.remove(req.params.id);

    req.session.successMessage = `Service "${service.title}" berhasil dihapus.`;
    res.redirect('/admin/services');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, store, edit, update, destroy };

/**
 * Blog Controller (Admin)
 * Handles CRUD operations for blog posts in the admin panel.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.7, 8.8
 */

'use strict';

const path            = require('path');
const fs              = require('fs');
const BlogPost        = require('../models/BlogPost');
const { generateSlug, ensureUniqueSlug } = require('../utils/slugGenerator');
const { processImage } = require('../utils/mediaHandler');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

/**
 * GET /admin/blog
 * List all blog posts sorted by created_at DESC.
 */
async function index(req, res, next) {
  try {
    const posts = await BlogPost.findAll();

    // Sort by created_at DESC for admin view (findAll uses published_at order)
    posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.render('admin/blog/index', {
      pageTitle:      'Blog Posts',
      activePage:     'blog',
      breadcrumbs:    [{ label: 'Blog' }],
      settings:       res.locals.settings || {},
      unreadCount:    res.locals.unreadCount || 0,
      posts,
      successMessage: req.session.successMessage || null,
      errorMessage:   req.session.errorMessage   || null,
    });

    // Clear flash messages after reading
    delete req.session.successMessage;
    delete req.session.errorMessage;
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/blog/create
 * Render the create blog post form.
 */
async function create(req, res, next) {
  try {
    res.render('admin/blog/create', {
      pageTitle:    'Tambah Blog Post',
      activePage:   'blog',
      breadcrumbs:  [{ label: 'Blog', href: '/admin/blog' }, { label: 'Tambah' }],
      settings:     res.locals.settings || {},
      unreadCount:  res.locals.unreadCount || 0,
      errorMessage: req.session.errorMessage || null,
      formData:     req.session.formData    || null,
    });

    delete req.session.errorMessage;
    delete req.session.formData;
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/blog
 * Create a new blog post.
 * Handles featured image upload and auto-slug generation.
 */
async function store(req, res, next) {
  try {
    const {
      title,
      slug: rawSlug,
      excerpt,
      content,
      meta_title,
      meta_description,
      status,
      published_at,
    } = req.body;

    // Basic validation
    if (!title || !title.trim()) {
      req.session.errorMessage = 'Judul tidak boleh kosong.';
      req.session.formData     = req.body;
      return res.redirect('/admin/blog/create');
    }

    // Generate slug from title if not provided
    const baseSlug = (rawSlug && rawSlug.trim())
      ? generateSlug(rawSlug.trim())
      : generateSlug(title.trim());

    // Ensure slug uniqueness
    const slug = await ensureUniqueSlug(baseSlug, BlogPost);

    // Handle featured image upload
    let featured_image = null;
    if (req.file) {
      const inputPath  = req.file.path;
      const outputPath = path.join(UPLOADS_DIR, req.file.filename);

      await processImage(inputPath, outputPath, { quality: 80, maxWidth: 1200 });
      featured_image = `/uploads/${req.file.filename}`;
    }

    // Normalize published_at
    const publishedAt = (status === 'published' && published_at)
      ? new Date(published_at).toISOString()
      : (status === 'published' ? new Date().toISOString() : null);

    await BlogPost.create({
      title:            title.trim(),
      slug,
      excerpt:          excerpt ? excerpt.trim() : null,
      content:          content || null,
      featured_image,
      meta_title:       meta_title       ? meta_title.trim()       : null,
      meta_description: meta_description ? meta_description.trim() : null,
      status:           status === 'published' ? 'published' : 'draft',
      published_at:     publishedAt,
    });

    req.session.successMessage = `Blog post "${title.trim()}" berhasil ditambahkan.`;
    res.redirect('/admin/blog');
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
}

/**
 * GET /admin/blog/:id/edit
 * Render the edit blog post form.
 */
async function edit(req, res, next) {
  try {
    const post = await BlogPost.findById(parseInt(req.params.id, 10));

    if (!post) {
      req.session.errorMessage = 'Blog post tidak ditemukan.';
      return res.redirect('/admin/blog');
    }

    res.render('admin/blog/edit', {
      pageTitle:    `Edit: ${post.title}`,
      activePage:   'blog',
      breadcrumbs:  [{ label: 'Blog', href: '/admin/blog' }, { label: 'Edit' }],
      settings:     res.locals.settings || {},
      unreadCount:  res.locals.unreadCount || 0,
      post,
      errorMessage: req.session.errorMessage || null,
    });

    delete req.session.errorMessage;
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/blog/:id
 * Update an existing blog post.
 */
async function update(req, res, next) {
  const id = parseInt(req.params.id, 10);

  try {
    const existing = await BlogPost.findById(id);

    if (!existing) {
      req.session.errorMessage = 'Blog post tidak ditemukan.';
      return res.redirect('/admin/blog');
    }

    const {
      title,
      slug: rawSlug,
      excerpt,
      content,
      meta_title,
      meta_description,
      status,
      published_at,
    } = req.body;

    // Basic validation
    if (!title || !title.trim()) {
      req.session.errorMessage = 'Judul tidak boleh kosong.';
      return res.redirect(`/admin/blog/${id}/edit`);
    }

    // Determine slug
    const baseSlug = (rawSlug && rawSlug.trim())
      ? generateSlug(rawSlug.trim())
      : generateSlug(title.trim());

    // Ensure uniqueness excluding current record
    const slug = await ensureUniqueSlug(baseSlug, BlogPost, id);

    // Handle featured image upload
    let featured_image = existing.featured_image;
    if (req.file) {
      // Delete old image if it exists and is a local upload
      if (existing.featured_image && existing.featured_image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../public', existing.featured_image);
        fs.unlink(oldPath, () => {});
      }

      const inputPath  = req.file.path;
      const outputPath = path.join(UPLOADS_DIR, req.file.filename);
      await processImage(inputPath, outputPath, { quality: 80, maxWidth: 1200 });
      featured_image = `/uploads/${req.file.filename}`;
    }

    // Normalize published_at
    let publishedAt = existing.published_at;
    if (status === 'published') {
      publishedAt = published_at
        ? new Date(published_at).toISOString()
        : (existing.published_at || new Date().toISOString());
    } else {
      publishedAt = null;
    }

    await BlogPost.update(id, {
      title:            title.trim(),
      slug,
      excerpt:          excerpt ? excerpt.trim() : null,
      content:          content || null,
      featured_image,
      meta_title:       meta_title       ? meta_title.trim()       : null,
      meta_description: meta_description ? meta_description.trim() : null,
      status:           status === 'published' ? 'published' : 'draft',
      published_at:     publishedAt,
    });

    req.session.successMessage = `Blog post "${title.trim()}" berhasil diperbarui.`;
    res.redirect('/admin/blog');
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
}

/**
 * DELETE /admin/blog/:id
 * Delete a blog post and its associated featured image.
 */
async function destroy(req, res, next) {
  const id = parseInt(req.params.id, 10);

  try {
    const post = await BlogPost.findById(id);

    if (!post) {
      req.session.errorMessage = 'Blog post tidak ditemukan.';
      return res.redirect('/admin/blog');
    }

    // Delete associated featured image
    if (post.featured_image && post.featured_image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '../public', post.featured_image);
      fs.unlink(imgPath, () => {});
    }

    await BlogPost.remove(id);

    req.session.successMessage = `Blog post "${post.title}" berhasil dihapus.`;
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, store, edit, update, destroy };

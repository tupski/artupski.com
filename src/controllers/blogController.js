'use strict';

/**
 * Blog Controller (Admin)
 * Handles CRUD operations for blog posts in the admin panel.
 * Uses Supabase Storage for featured image uploads.
 */

const BlogPost = require('../models/BlogPost');
const { generateSlug, ensureUniqueSlug } = require('../utils/slugGenerator');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/mediaHandler');

async function index(req, res, next) {
  try {
    const posts = await BlogPost.findAll();
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

    delete req.session.successMessage;
    delete req.session.errorMessage;
  } catch (err) {
    next(err);
  }
}

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

async function store(req, res, next) {
  try {
    const {
      title, slug: rawSlug, excerpt, content,
      meta_title, meta_description, status, published_at,
    } = req.body;

    if (!title || !title.trim()) {
      req.session.errorMessage = 'Judul tidak boleh kosong.';
      req.session.formData     = req.body;
      return res.redirect('/admin/blog/create');
    }

    const baseSlug = rawSlug && rawSlug.trim() ? generateSlug(rawSlug.trim()) : generateSlug(title.trim());
    const slug     = await ensureUniqueSlug(baseSlug, BlogPost);

    // Upload featured image to Supabase Storage
    let featured_image = null;
    if (req.file) {
      featured_image = await uploadToSupabase(req.file, { folder: 'blog' });
    }

    const publishedAt = (status === 'published' && published_at)
      ? new Date(published_at).toISOString()
      : (status === 'published' ? new Date().toISOString() : null);

    await BlogPost.create({
      title:            title.trim(),
      slug,
      excerpt:          excerpt          ? excerpt.trim()          : null,
      content:          content          || null,
      featured_image,
      meta_title:       meta_title       ? meta_title.trim()       : null,
      meta_description: meta_description ? meta_description.trim() : null,
      status:           status === 'published' ? 'published' : 'draft',
      published_at:     publishedAt,
    });

    req.session.successMessage = `Blog post "${title.trim()}" berhasil ditambahkan.`;
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
}

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

async function update(req, res, next) {
  const id = parseInt(req.params.id, 10);

  try {
    const existing = await BlogPost.findById(id);

    if (!existing) {
      req.session.errorMessage = 'Blog post tidak ditemukan.';
      return res.redirect('/admin/blog');
    }

    const {
      title, slug: rawSlug, excerpt, content,
      meta_title, meta_description, status, published_at,
    } = req.body;

    if (!title || !title.trim()) {
      req.session.errorMessage = 'Judul tidak boleh kosong.';
      return res.redirect(`/admin/blog/${id}/edit`);
    }

    const baseSlug = rawSlug && rawSlug.trim() ? generateSlug(rawSlug.trim()) : generateSlug(title.trim());
    const slug     = await ensureUniqueSlug(baseSlug, BlogPost, id);

    // Upload new image and delete old one from Supabase Storage
    let featured_image = existing.featured_image;
    if (req.file) {
      await deleteFromSupabase(existing.featured_image);
      featured_image = await uploadToSupabase(req.file, { folder: 'blog' });
    }

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
      excerpt:          excerpt          ? excerpt.trim()          : null,
      content:          content          || null,
      featured_image,
      meta_title:       meta_title       ? meta_title.trim()       : null,
      meta_description: meta_description ? meta_description.trim() : null,
      status:           status === 'published' ? 'published' : 'draft',
      published_at:     publishedAt,
    });

    req.session.successMessage = `Blog post "${title.trim()}" berhasil diperbarui.`;
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  const id = parseInt(req.params.id, 10);

  try {
    const post = await BlogPost.findById(id);

    if (!post) {
      req.session.errorMessage = 'Blog post tidak ditemukan.';
      return res.redirect('/admin/blog');
    }

    // Delete featured image from Supabase Storage
    await deleteFromSupabase(post.featured_image);

    await BlogPost.remove(id);

    req.session.successMessage = `Blog post "${post.title}" berhasil dihapus.`;
    res.redirect('/admin/blog');
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create, store, edit, update, destroy };

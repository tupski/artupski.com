/**
 * Public Controller
 * Handles all public-facing page rendering.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 13.1, 13.2, 13.3
 */

'use strict';

const Portfolio = require('../models/Portfolio');
const BlogPost = require('../models/BlogPost');
const Service = require('../models/Service');
const Skill = require('../models/Skill');
const Experience = require('../models/Experience');
const SocialLink = require('../models/SocialLink');
const ContactMessage = require('../models/ContactMessage');
const { buildSeoMeta } = require('../utils/seoHelper');

// ---------------------------------------------------------------------------
// Simple email format validator (no external dependency)
// ---------------------------------------------------------------------------
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// GET /
// ---------------------------------------------------------------------------
async function index(req, res, next) {
  try {
    const [portfolios, services, blogPosts, socialLinks] = await Promise.all([
      Portfolio.findAll({ status: 'published', limit: 3 }),
      Service.findAll({ status: 'active' }),
      BlogPost.findAll({ status: 'published', limit: 3 }),
      SocialLink.findAll({ isActive: true }),
    ]);

    const seo = buildSeoMeta({ settings: res.locals.settings });

    res.render('pages/index', {
      seo,
      settings: res.locals.settings,
      portfolios,
      services,
      blogPosts,
      socialLinks,
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /about
// ---------------------------------------------------------------------------
async function about(req, res, next) {
  try {
    const [skills, experiences, socialLinks] = await Promise.all([
      Skill.findAll(),                        // ordered sort_order ASC by model
      Experience.findAll(),                   // ordered start_date DESC by model
      SocialLink.findAll({ isActive: true }),
    ]);

    const seo = buildSeoMeta({
      title: 'About',
      settings: res.locals.settings,
    });

    res.render('pages/about', {
      seo,
      settings: res.locals.settings,
      skills,
      experiences,
      socialLinks,
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /portfolio
// ---------------------------------------------------------------------------
async function portfolio(req, res, next) {
  try {
    const category = req.query.category || undefined;

    const portfolios = await Portfolio.findAll({ status: 'published', category });

    const seo = buildSeoMeta({
      title: 'Portfolio',
      settings: res.locals.settings,
    });

    res.render('pages/portfolio', {
      seo,
      settings: res.locals.settings,
      portfolios,
      activeCategory: req.query.category || '',
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /portfolio/:slug
// ---------------------------------------------------------------------------
async function portfolioDetail(req, res, next) {
  try {
    const item = await Portfolio.findBySlug(req.params.slug);

    if (!item || item.status !== 'published') {
      const err = new Error('Portfolio item not found');
      err.status = 404;
      return next(err);
    }

    const seo = buildSeoMeta({
      title: item.title,
      description: item.short_description,
      image: item.image,
      settings: res.locals.settings,
    });

    res.render('pages/portfolio-detail', {
      seo,
      settings: res.locals.settings,
      item,
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /services
// ---------------------------------------------------------------------------
async function services(req, res, next) {
  try {
    const serviceList = await Service.findAll({ status: 'active' }); // sort_order ASC by model

    const seo = buildSeoMeta({
      title: 'Services',
      settings: res.locals.settings,
    });

    res.render('pages/services', {
      seo,
      settings: res.locals.settings,
      services: serviceList,
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /services/:slug
// ---------------------------------------------------------------------------
async function serviceDetail(req, res, next) {
  try {
    const item = await Service.findBySlug(req.params.slug);

    if (!item || item.status !== 'active') {
      const err = new Error('Service not found');
      err.status = 404;
      return next(err);
    }

    const seo = buildSeoMeta({
      title: item.title,
      description: item.short_description,
      image: item.icon_image,
      settings: res.locals.settings,
    });

    res.render('pages/service-detail', {
      seo,
      settings: res.locals.settings,
      item,
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /blog
// ---------------------------------------------------------------------------
async function blog(req, res, next) {
  try {
    const blogPosts = await BlogPost.findAll({ status: 'published' }); // published_at DESC by model

    const seo = buildSeoMeta({
      title: 'Blog',
      settings: res.locals.settings,
    });

    res.render('pages/blog', {
      seo,
      settings: res.locals.settings,
      blogPosts,
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /blog/:slug
// ---------------------------------------------------------------------------
async function blogDetail(req, res, next) {
  try {
    const post = await BlogPost.findBySlug(req.params.slug);

    if (!post || post.status !== 'published') {
      const err = new Error('Blog post not found');
      err.status = 404;
      return next(err);
    }

    const seo = buildSeoMeta({
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      image: post.featured_image,
      settings: res.locals.settings,
      type: 'article',
    });

    res.render('pages/blog-detail', {
      seo,
      settings: res.locals.settings,
      post,
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /contact
// ---------------------------------------------------------------------------
async function contactGet(req, res, next) {
  try {
    const seo = buildSeoMeta({
      title: 'Contact',
      settings: res.locals.settings,
    });

    res.render('pages/contact', {
      seo,
      settings: res.locals.settings,
      errors: {},
      formData: {},
      success: false,
      currentPath: req.path,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /contact
// ---------------------------------------------------------------------------
async function contactPost(req, res, next) {
  const { name, email, subject, message } = req.body;

  // --- Validation ---
  const errors = {};

  if (!name || String(name).trim().length === 0) {
    errors.name = 'Nama wajib diisi.';
  } else if (String(name).trim().length > 100) {
    errors.name = 'Nama maksimal 100 karakter.';
  }

  if (!email || String(email).trim().length === 0) {
    errors.email = 'Email wajib diisi.';
  } else if (!isValidEmail(String(email).trim())) {
    errors.email = 'Format email tidak valid.';
  } else if (String(email).trim().length > 254) {
    errors.email = 'Email maksimal 254 karakter.';
  }

  if (!subject || String(subject).trim().length === 0) {
    errors.subject = 'Subjek wajib diisi.';
  } else if (String(subject).trim().length > 150) {
    errors.subject = 'Subjek maksimal 150 karakter.';
  }

  if (!message || String(message).trim().length === 0) {
    errors.message = 'Pesan wajib diisi.';
  } else if (String(message).trim().length > 2000) {
    errors.message = 'Pesan maksimal 2000 karakter.';
  }

  const seo = buildSeoMeta({
    title: 'Contact',
    settings: res.locals.settings,
  });

  if (Object.keys(errors).length > 0) {
    return res.render('pages/contact', {
      seo,
      settings: res.locals.settings,
      errors,
      formData: req.body,
      success: false,
      currentPath: req.path,
    });
  }

  // --- Save to DB ---
  try {
    await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      ip_address: req.ip || null,
    });

    res.render('pages/contact', {
      seo,
      settings: res.locals.settings,
      errors: {},
      formData: {},
      success: true,
      currentPath: req.path,
    });
  } catch (err) {
    // DB failure — re-render with generic error, preserve formData
    res.render('pages/contact', {
      seo,
      settings: res.locals.settings,
      errors: { general: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.' },
      formData: req.body,
      success: false,
      currentPath: req.path,
    });
  }
}

module.exports = {
  index,
  about,
  portfolio,
  portfolioDetail,
  services,
  serviceDetail,
  blog,
  blogDetail,
  contactGet,
  contactPost,
};

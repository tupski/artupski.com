/**
 * Dashboard Controller
 * Handles the admin dashboard page — aggregates stats and recent items
 * from all CMS models.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

'use strict';

const Portfolio      = require('../models/Portfolio');
const BlogPost       = require('../models/BlogPost');
const Service        = require('../models/Service');
const ContactMessage = require('../models/ContactMessage');

/**
 * GET /admin
 * Render the admin dashboard with stats widgets and recent items.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function index(req, res, next) {
  try {
    // Run all count queries in parallel for performance
    const [
      portfolioCount,
      blogCount,
      serviceCount,
      unreadCount,
    ] = await Promise.all([
      Portfolio.countAll(),
      BlogPost.countAll(),
      Service.countAll(),
      ContactMessage.countUnread(),
    ]);

    // Fetch recent items (latest 5 each)
    const [
      recentPortfolios,
      recentBlogPosts,
      recentMessages,
    ] = await Promise.all([
      Portfolio.findAll({ limit: 5 }),
      BlogPost.findAll({ limit: 5 }),
      ContactMessage.findAll({ limit: 5 }),
    ]);

    res.render('admin/dashboard', {
      pageTitle:        'Dashboard',
      activePage:       'dashboard',
      settings:         res.locals.settings || {},
      unreadCount,
      portfolioCount,
      blogCount,
      serviceCount,
      recentPortfolios,
      recentBlogPosts,
      recentMessages,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };

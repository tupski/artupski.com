# Changelog

All notable changes to **artupski.com** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Homepage redesign: split hero layout with profile photo, social icons, availability badge
- Services section with 4-column dark cards and placeholder fallback
- Portfolio section with tech stack badges, demo/GitHub links, and placeholder fallback
- Stats section (20+ projects, 15+ clients, 99% satisfaction) with testimonial quote card
- Blog section with category badge, date, and placeholder fallback
- CTA section "Mari Wujudkan Ide Anda" with contact info and laptop illustration
- Footer redesign: 4-column layout (brand+social, navigation, services, newsletter form)
- Navbar redesign: dark style, Indonesian labels, cyan "Hubungi Saya" CTA button

---

## [1.1.0] - 2025-05-20

### Added
- Supabase Storage integration for all file uploads (logo, favicon, hero image, portfolio, blog, services)
- `uploadToSupabase()` function in `mediaHandler.js` — compresses with sharp in-memory then uploads
- `deleteFromSupabase()` function for cleanup on update/delete operations
- `SUPABASE_STORAGE_BUCKET` environment variable for configuring the storage bucket name
- MIT License (`LICENSE` file)

### Changed
- `multer.js`: switched from `diskStorage` to `memoryStorage` — no disk writes, works on ephemeral filesystems (Vercel)
- `portfolioController.js`: images now uploaded to Supabase Storage under `portfolio/` folder
- `blogController.js`: featured images now uploaded to Supabase Storage under `blog/` folder
- `servicesController.js`: icons now uploaded to Supabase Storage under `services/` folder
- `settingsController.js`: logo, favicon, hero_image now uploaded to Supabase Storage under `settings/` folder
- `vercel.json`: added static file route for `src/public/` and `build:css` step so `output.css` is generated at deploy time
- `package.json`: updated `license` field from `UNLICENSED` to `MIT`
- `README.md`: updated license section, added `SUPABASE_STORAGE_BUCKET` to environment variables table

### Removed
- Disk-based file cleanup helpers (`deleteUploadedFile`, `fs.unlink`) from controllers — no longer needed with Supabase Storage

---

## [1.0.0] - 2025-05-20

### Added
- Full MVC project structure with `src/` as application root
- `src/app.js` — Express entry point with helmet, rate limiting, session, body-parser, static files
- `src/config/session.js` — express-session configuration
- `src/config/database.js` — Supabase client initialization with env validation
- `src/config/multer.js` — multer configuration with MIME type and file size validation
- `src/database/migrations.sql` — DDL for all 9 tables: `users`, `settings`, `portfolios`, `blog_posts`, `services`, `skills`, `experiences`, `social_links`, `contact_messages`
- `src/database/migrate.js` — idempotent auto-migration runner using `pg` + `DATABASE_URL`
- `src/database/seed.js` — idempotent seeder for admin user and 15 default settings keys
- `src/middlewares/auth.js` — `requireAuth` middleware blocking unauthenticated admin access
- `src/middlewares/rateLimiter.js` — `loginLimiter` (5 req/15 min) and `contactLimiter` (3 req/10 min)
- `src/middlewares/errorHandler.js` — centralized error handler, no stack traces in production
- `src/utils/slugGenerator.js` — `generateSlug()` and `ensureUniqueSlug()` with Unicode normalization
- `src/utils/seoHelper.js` — `buildSeoMeta()` with title/description truncation and settings fallback
- `src/utils/settingsManager.js` — in-memory cache with `injectSettings` Express middleware
- `src/utils/mediaHandler.js` — `processImage()` using sharp (quality 80, max-width 1200px)
- `src/models/` — 9 model files: `User`, `Setting`, `Portfolio`, `BlogPost`, `Service`, `Skill`, `Experience`, `SocialLink`, `ContactMessage`
- `src/controllers/authController.js` — login, logout with bcrypt + express-session
- `src/controllers/dashboardController.js` — admin dashboard with stats and recent items
- `src/controllers/settingsController.js` — settings CRUD with file upload support
- `src/controllers/portfolioController.js` — portfolio CRUD with slug generation and image upload
- `src/controllers/blogController.js` — blog CRUD with slug generation and featured image upload
- `src/controllers/servicesController.js` — services CRUD with slug generation and icon upload
- `src/controllers/skillsController.js` — skills CRUD with level 0–100 validation
- `src/controllers/experienceController.js` — work experience CRUD
- `src/controllers/socialLinksController.js` — social links CRUD
- `src/controllers/contactController.js` — contact messages list, detail (auto-mark read), delete
- `src/controllers/apiController.js` — `GET /api/unread-count` JSON endpoint for badge polling
- `src/controllers/publicController.js` — all public page handlers with SEO meta injection
- `src/routes/` — 4 route files: `public.js`, `auth.js`, `admin.js`, `api.js`
- `src/views/layouts/` — `main.ejs` (public) and `admin.ejs` (Tabler)
- `src/views/partials/` — `head.ejs`, `navbar.ejs`, `footer.ejs`, `sidebar.ejs`, `alerts.ejs`, `scripts.ejs`
- `src/views/pages/` — 11 public pages: index, about, portfolio, portfolio-detail, services, service-detail, blog, blog-detail, contact, 404, 500
- `src/views/admin/` — login, dashboard, and CRUD views for all 8 CMS modules
- `src/public/js/theme.js` — Theme_Controller with anti-flicker, dark default, localStorage persistence
- `src/public/js/app.js` — hamburger menu, IntersectionObserver animations, smooth scroll, theme toggle
- `src/public/js/admin.js` — unread badge polling (30s), delete confirmation, theme toggle
- `src/public/css/app.css` — Tailwind directives with custom skill progress bar utilities
- `tailwind.config.js` — `darkMode: 'class'`, content paths for EJS and JS files
- `vercel.json` — Vercel serverless deployment configuration
- `package.json` — all scripts: `dev`, `start`, `test`, `test:unit`, `test:integration`, `build:css`
- `.env.example` — all required environment variables documented
- `.gitignore` — excludes `node_modules/`, `.env`, `src/public/uploads/`, `src/public/css/output.css`, logs
- `README.md` — installation, environment setup, dev server, testing, Vercel/PM2/Nginx deployment guides
- `PLAN.md` — 15-phase development plan
- 13 property-based tests using fast-check (100 runs each): slug format, slug uniqueness, skill level, media upload, settings round-trip, contact form length, contact status, auth middleware, password storage, SEO fallback, sort order, portfolio filter, unread count
- Integration tests: public page rendering (HTTP 200), rate limiter (429 on 4th request), DB connection and migration idempotency

[Unreleased]: https://github.com/tupski/artupski.com/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/tupski/artupski.com/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tupski/artupski.com/releases/tag/v1.0.0

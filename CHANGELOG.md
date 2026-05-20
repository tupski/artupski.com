# Changelog

All notable changes to **artupski-portfolio-cms** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial project documentation: `PLAN.md`, `CHANGELOG.md`, `README.md`
- Project configuration files: `package.json`, `.env.example`, `.gitignore`, `vercel.json`

---

## [1.0.0] - TBD

### Added
- Full MVC project structure with `src/` as application root
- Express.js application with helmet, rate limiting, session management
- Supabase (PostgreSQL) database integration with auto-migration
- Admin authentication with bcrypt password hashing and express-session
- Admin panel using Tabler UI framework
- CMS modules: Portfolio, Blog, Services, Skills, Experience, Social Links, Settings, Contact Messages
- Public pages: Homepage, About, Portfolio, Services, Blog, Contact
- Dark/light mode theme system with localStorage persistence (dark default)
- SEO meta tags and Open Graph support for all pages
- Media upload and compression via multer + sharp
- Responsive mobile-first design with TailwindCSS
- Property-based tests using fast-check
- Integration tests using Jest + supertest
- Vercel serverless deployment configuration
- PM2 production process management support
- Nginx reverse proxy configuration example

[Unreleased]: https://github.com/tupski/artupski.com/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tupski/artupski.com/releases/tag/v1.0.0

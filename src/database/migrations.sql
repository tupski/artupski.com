-- =============================================================================
-- artupski-portfolio-cms — Database Migrations
-- All statements use CREATE TABLE IF NOT EXISTS for idempotency.
-- Run this file once on a fresh database, or re-run safely on an existing one.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: users
-- Stores admin user accounts. Passwords are stored as bcrypt hashes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(254) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  name       VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -----------------------------------------------------------------------------
-- Table: settings
-- Key-value store for all dynamic website configuration.
-- Default keys: site_name, tagline, logo, favicon, hero_title, hero_subtitle,
--   hero_description, hero_image, about_content, contact_email,
--   whatsapp_number, address, footer_text, seo_title_default,
--   seo_description_default
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(100) NOT NULL UNIQUE,
  value      TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- -----------------------------------------------------------------------------
-- Table: portfolios
-- Portfolio project items managed via admin CMS.
-- status: 'draft' | 'published'
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portfolios (
  id                SERIAL PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  slug              VARCHAR(100) NOT NULL UNIQUE,
  short_description TEXT,
  full_description  TEXT,
  tech_stack        TEXT,
  image             VARCHAR(500),
  category          VARCHAR(100),
  client_name       VARCHAR(255),
  demo_link         VARCHAR(500),
  github_link       VARCHAR(500),
  status            VARCHAR(20) DEFAULT 'draft',
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_slug   ON portfolios(slug);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status);

-- -----------------------------------------------------------------------------
-- Table: blog_posts
-- Blog articles managed via admin CMS.
-- status: 'draft' | 'published'
-- Only posts with status='published' AND published_at <= NOW() are public.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  slug             VARCHAR(100) NOT NULL UNIQUE,
  excerpt          TEXT,
  content          TEXT,
  featured_image   VARCHAR(500),
  meta_title       VARCHAR(60),
  meta_description VARCHAR(160),
  status           VARCHAR(20) DEFAULT 'draft',
  published_at     TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug         ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status       ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);

-- -----------------------------------------------------------------------------
-- Table: services
-- Service offerings managed via admin CMS.
-- status: 'active' | 'inactive'
-- Ordered by sort_order ASC for public display.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id                SERIAL PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  slug              VARCHAR(100) NOT NULL UNIQUE,
  short_description TEXT,
  full_description  TEXT,
  icon_image        VARCHAR(500),
  price_label       VARCHAR(100),
  sort_order        INTEGER DEFAULT 0,
  status            VARCHAR(20) DEFAULT 'active',
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_slug       ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_status     ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services(sort_order);

-- -----------------------------------------------------------------------------
-- Table: skills
-- Skills/competencies displayed on the About page.
-- level: integer 0–100 (percentage)
-- Ordered by sort_order ASC for public display.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  level      INTEGER NOT NULL CHECK (level >= 0 AND level <= 100),
  category   VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_sort_order ON skills(sort_order);

-- -----------------------------------------------------------------------------
-- Table: experiences
-- Work experience entries displayed on the About page.
-- Ordered by start_date DESC for public display.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experiences (
  id           SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  position     VARCHAR(255) NOT NULL,
  description  TEXT,
  start_date   DATE NOT NULL,
  end_date     DATE,
  is_current   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Table: social_links
-- Social media profile links displayed in footer and About page.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_links (
  id         SERIAL PRIMARY KEY,
  platform   VARCHAR(100) NOT NULL,
  url        VARCHAR(500) NOT NULL,
  icon       VARCHAR(100),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Table: contact_messages
-- Incoming messages from the public contact form.
-- status: 'unread' | 'read'
-- New messages are always created with status='unread'.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(254) NOT NULL,
  subject    VARCHAR(150) NOT NULL,
  message    TEXT NOT NULL,
  status     VARCHAR(20) DEFAULT 'unread',
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

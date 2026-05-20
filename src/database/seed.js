/**
 * Database Seeder
 * Seeds the admin user and default settings on application startup.
 * This seeder is idempotent — safe to run multiple times without creating duplicates.
 *
 * Requirements: 2.8, 3.4
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { supabase } = require('../config/database');

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Seed the admin user into the `users` table.
 * Checks for existing email before inserting — no duplicate will be created.
 */
async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('[seed] WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin user seed.');
    return;
  }

  // Check if admin user already exists
  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (findError) {
    throw new Error(`[seed] Failed to check existing admin user: ${findError.message}`);
  }

  if (existing) {
    console.log(`[seed] Admin user already exists (${email}). Skipping.`);
    return;
  }

  // Hash password with bcrypt salt rounds 12
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const { error: insertError } = await supabase
    .from('users')
    .insert({
      email,
      password: hashedPassword,
      name: 'Angga Dwy Saputra',
    });

  if (insertError) {
    throw new Error(`[seed] Failed to insert admin user: ${insertError.message}`);
  }

  console.log(`[seed] Admin user created successfully (${email}).`);
}

/**
 * Default settings for the portfolio site.
 * All 15 required keys are included.
 */
function getDefaultSettings() {
  const contactEmail = process.env.ADMIN_EMAIL || '';

  return [
    { key: 'site_name',              value: 'Angga Dwy Saputra' },
    { key: 'tagline',                value: 'Web Developer & SEO Specialist' },
    { key: 'logo',                   value: '' },
    { key: 'favicon',                value: '' },
    { key: 'hero_title',             value: "Hi, I'm Angga Dwy Saputra" },
    { key: 'hero_subtitle',          value: 'Web Developer & SEO Specialist' },
    { key: 'hero_description',       value: 'I build modern, fast, and SEO-friendly websites.' },
    { key: 'hero_image',             value: '' },
    { key: 'about_content',          value: '' },
    { key: 'contact_email',          value: contactEmail },
    { key: 'whatsapp_number',        value: '' },
    { key: 'address',                value: '' },
    { key: 'footer_text',            value: '© 2025 Angga Dwy Saputra. All rights reserved.' },
    { key: 'seo_title_default',      value: 'Angga Dwy Saputra — Web Developer & SEO Specialist' },
    { key: 'seo_description_default', value: 'Portfolio website of Angga Dwy Saputra, Web Developer & SEO Specialist.' },
  ];
}

/**
 * Seed default settings into the `settings` table.
 * Uses upsert with ignoreDuplicates so existing values are preserved.
 */
async function seedSettings() {
  const defaults = getDefaultSettings();

  // Upsert: insert if key doesn't exist, do nothing if it does (preserves admin edits)
  const { error } = await supabase
    .from('settings')
    .upsert(defaults, { onConflict: 'key', ignoreDuplicates: true });

  if (error) {
    throw new Error(`[seed] Failed to upsert default settings: ${error.message}`);
  }

  console.log(`[seed] Default settings seeded successfully (${defaults.length} keys).`);
}

/**
 * Main seed runner.
 * Called from app.js on startup, or can be run standalone:
 *   node src/database/seed.js
 */
async function runSeed() {
  console.log('[seed] Starting database seed...');

  try {
    await seedAdminUser();
    await seedSettings();
    console.log('[seed] Database seed completed.');
  } catch (err) {
    console.error('[seed] Seed failed:', err.message);
    throw err;
  }
}

module.exports = { runSeed };

// Allow standalone execution: node src/database/seed.js
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

/**
 * Database configuration
 * Initializes Supabase client for application queries.
 *
 * Uses the SERVICE ROLE key (not anon key) so that Row Level Security (RLS)
 * does not block server-side queries. The service role key is only used
 * server-side and is never exposed to the browser.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Fallback to anon key for backward compatibility
const SUPABASE_KEY     = SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('[database] ERROR: Environment variable SUPABASE_URL is not set.');
  process.exit(1);
}

if (!SUPABASE_KEY) {
  console.error('[database] ERROR: Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set.');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[database] WARNING: SUPABASE_SERVICE_ROLE_KEY not set. Falling back to SUPABASE_ANON_KEY.');
  console.warn('[database] RLS policies may block queries. Set SUPABASE_SERVICE_ROLE_KEY for full access.');
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabase };

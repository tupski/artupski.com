/**
 * Database configuration
 * Initializes Supabase client for application queries
 * and exports pg Pool for migration runner
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('[database] ERROR: Environment variable SUPABASE_URL is not set.');
  console.error('[database] Please add SUPABASE_URL to your .env file.');
  console.error('[database] Example: SUPABASE_URL=https://your-project-ref.supabase.co');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('[database] ERROR: Environment variable SUPABASE_ANON_KEY is not set.');
  console.error('[database] Please add SUPABASE_ANON_KEY to your .env file.');
  console.error('[database] You can find it in: Supabase Dashboard → Settings → API → anon/public key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = { supabase };

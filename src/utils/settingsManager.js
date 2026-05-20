/**
 * Settings Manager
 * In-memory cache layer for website settings stored in the `settings` table.
 * Provides fast reads via cache and reliable writes with retry logic.
 */

const { supabase } = require('../config/database');

// In-memory cache: { key: value }
const cache = {};

/**
 * Load all settings from DB into the in-memory cache.
 * Overwrites any existing cache entries.
 */
async function loadSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error) {
    throw new Error(`[settingsManager] Failed to load settings: ${error.message}`);
  }

  // Clear existing cache entries
  Object.keys(cache).forEach((k) => delete cache[k]);

  // Populate cache from DB rows
  if (data && data.length > 0) {
    data.forEach(({ key, value }) => {
      cache[key] = value;
    });
  }
}

/**
 * Get a single setting value from cache.
 * @param {string} key - The setting key
 * @returns {string|null} The setting value, or null if not found
 */
async function getSetting(key) {
  return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null;
}

/**
 * Get the full settings object (for use in EJS templates).
 * If the cache is empty, loads from DB first.
 * @returns {object} A copy of the full cache object
 */
async function getAllSettings() {
  if (Object.keys(cache).length === 0) {
    await loadSettings();
  }
  return { ...cache };
}

/**
 * Update a setting in the DB and refresh the cache.
 * Retries once on failure before throwing.
 * @param {string} key - The setting key to update
 * @param {string} value - The new value
 */
async function updateSetting(key, value) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value })
        .eq('key', key);

      if (error) {
        throw new Error(`[settingsManager] DB update failed: ${error.message}`);
      }

      await refreshCache();
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      // First attempt failed — will retry
    }
  }
}

/**
 * Force a full reload of settings from DB into cache.
 */
async function refreshCache() {
  await loadSettings();
}

/**
 * Express middleware that injects all settings into res.locals.settings
 * on every request. Falls back to an empty object if loading fails.
 * Always calls next() so the request pipeline is never blocked.
 */
async function injectSettings(req, res, next) {
  try {
    res.locals.settings = await getAllSettings();
  } catch (err) {
    console.error('[settingsManager] injectSettings error:', err.message);
    res.locals.settings = {};
  }
  next();
}

module.exports = {
  loadSettings,
  getSetting,
  getAllSettings,
  updateSetting,
  refreshCache,
  injectSettings,
};

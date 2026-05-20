/**
 * Setting model
 * Handles all database operations for the settings table
 */

const { supabase } = require('../config/database');

/**
 * Retrieve all settings rows
 * @returns {Array} array of { id, key, value, updated_at }
 */
async function findAll() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) throw error;

  return data;
}

/**
 * Find a single setting by key
 * @param {string} key
 * @returns {Object|null} setting row or null if not found
 */
async function findByKey(key) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    // PGRST116 = no rows returned — not a real error
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Insert or update a setting by key (upsert)
 * @param {string} key
 * @param {string} value
 * @returns {Object} upserted setting row
 */
async function upsert(key, value) {
  const { data, error } = await supabase
    .from('settings')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update multiple settings at once
 * @param {Array<{key: string, value: string}>} pairs
 * @returns {Array} array of upserted setting rows
 */
async function updateMany(pairs) {
  if (!pairs || pairs.length === 0) return [];

  const rows = pairs.map(({ key, value }) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('settings')
    .upsert(rows, { onConflict: 'key' })
    .select();

  if (error) throw error;

  return data;
}

module.exports = { findAll, findByKey, upsert, updateMany };

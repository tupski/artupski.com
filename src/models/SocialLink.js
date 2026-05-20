/**
 * SocialLink model
 * Handles all database operations for the `social_links` table.
 */

const { supabase } = require('../config/database');

/**
 * Retrieve all social links, optionally filtered by active status.
 * @param {Object} [options={}]
 * @param {boolean} [options.isActive] - Filter by is_active flag
 * @returns {Promise<Array>} Array of social link rows
 */
async function findAll({ isActive } = {}) {
  let query = supabase
    .from('social_links')
    .select('*');

  if (typeof isActive === 'boolean') {
    query = query.eq('is_active', isActive);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Find a single social link by its ID.
 * @param {number} id
 * @returns {Promise<Object|null>} Social link row or null if not found
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new social link.
 * @param {Object} data - Social link fields
 * @returns {Promise<Object>} Created social link row
 */
async function create(data) {
  const { data: created, error } = await supabase
    .from('social_links')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return created;
}

/**
 * Update an existing social link by ID.
 * @param {number} id
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated social link row
 */
async function update(id, data) {
  const { data: updated, error } = await supabase
    .from('social_links')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Delete a social link by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function remove(id) {
  const { error } = await supabase
    .from('social_links')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

module.exports = { findAll, findById, create, update, remove };

/**
 * Experience model
 * Handles all database operations for the `experiences` table.
 * Experiences are ordered by start_date DESC (most recent first).
 */

const { supabase } = require('../config/database');

/**
 * Retrieve all work experience entries, ordered by start_date DESC.
 * @returns {Promise<Array>} Array of experience rows
 */
async function findAll() {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Find a single experience entry by its ID.
 * @param {number} id
 * @returns {Promise<Object|null>} Experience row or null if not found
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new experience entry.
 * @param {Object} data - Experience fields
 * @returns {Promise<Object>} Created experience row
 */
async function create(data) {
  const { data: created, error } = await supabase
    .from('experiences')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return created;
}

/**
 * Update an existing experience entry by ID.
 * @param {number} id
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated experience row
 */
async function update(id, data) {
  const { data: updated, error } = await supabase
    .from('experiences')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Delete an experience entry by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function remove(id) {
  const { error } = await supabase
    .from('experiences')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

module.exports = { findAll, findById, create, update, remove };

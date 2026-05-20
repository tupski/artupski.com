/**
 * Skill model
 * Handles all database operations for the `skills` table.
 * Skills are ordered by sort_order ASC.
 * level: integer 0–100 (percentage)
 */

const { supabase } = require('../config/database');

/**
 * Retrieve all skills, optionally filtered by category.
 * @param {Object} [options={}]
 * @param {string} [options.category] - Filter by category
 * @returns {Promise<Array>} Array of skill rows
 */
async function findAll({ category } = {}) {
  let query = supabase
    .from('skills')
    .select('*')
    .order('sort_order', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Find a single skill by its ID.
 * @param {number} id
 * @returns {Promise<Object|null>} Skill row or null if not found
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new skill.
 * @param {Object} data - Skill fields
 * @returns {Promise<Object>} Created skill row
 */
async function create(data) {
  const { data: created, error } = await supabase
    .from('skills')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return created;
}

/**
 * Update an existing skill by ID.
 * @param {number} id
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated skill row
 */
async function update(id, data) {
  const { data: updated, error } = await supabase
    .from('skills')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Delete a skill by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function remove(id) {
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Return the total count of skills.
 * @returns {Promise<number>}
 */
async function countAll() {
  const { count, error } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count;
}

module.exports = { findAll, findById, create, update, remove, countAll };

/**
 * Service model
 * Handles all database operations for the `services` table.
 * Services are ordered by sort_order ASC.
 * status: 'active' | 'inactive'
 */

const { supabase } = require('../config/database');

/**
 * Retrieve all services, optionally filtered by status.
 * @param {Object} [options={}]
 * @param {string} [options.status] - Filter by status ('active' | 'inactive')
 * @returns {Promise<Array>} Array of service rows
 */
async function findAll({ status } = {}) {
  let query = supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Find a single service by its slug.
 * @param {string} slug
 * @returns {Promise<Object|null>} Service row or null if not found
 */
async function findBySlug(slug) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Find a single service by its ID.
 * @param {number} id
 * @returns {Promise<Object|null>} Service row or null if not found
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new service.
 * @param {Object} data - Service fields
 * @returns {Promise<Object>} Created service row
 */
async function create(data) {
  const { data: created, error } = await supabase
    .from('services')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return created;
}

/**
 * Update an existing service by ID.
 * @param {number} id
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated service row
 */
async function update(id, data) {
  const { data: updated, error } = await supabase
    .from('services')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Delete a service by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function remove(id) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Check whether a slug already exists in the services table.
 * Optionally exclude a specific service ID (for update operations).
 * @param {string} slug
 * @param {number|null} [excludeId=null]
 * @returns {Promise<boolean>} True if slug exists
 */
async function slugExists(slug, excludeId = null) {
  let query = supabase
    .from('services')
    .select('id')
    .eq('slug', slug);

  if (excludeId !== null) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data.length > 0;
}

/**
 * Return the total count of services.
 * @returns {Promise<number>}
 */
async function countAll() {
  const { count, error } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count;
}

module.exports = { findAll, findBySlug, findById, create, update, remove, slugExists, countAll };

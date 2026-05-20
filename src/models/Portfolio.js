/**
 * Portfolio Model
 * Handles all database operations for the portfolios table via Supabase client.
 *
 * Requirements: 7.1, 7.5, 7.8, 7.10
 */

const { supabase } = require('../config/database');

/**
 * Retrieve all portfolio items with optional filters and pagination.
 * Results are ordered by created_at DESC (newest first).
 *
 * @param {Object} [options={}]
 * @param {string} [options.status]   - Filter by status ('draft' | 'published')
 * @param {string} [options.category] - Filter by category
 * @param {number} [options.limit]    - Maximum number of records to return
 * @param {number} [options.offset]   - Number of records to skip (for pagination)
 * @returns {Promise<Array>} Array of portfolio items
 */
async function findAll({ status, category, limit, offset } = {}) {
  let query = supabase
    .from('portfolios')
    .select('*')
    .order('created_at', { ascending: false });

  if (status !== undefined && status !== null && status !== '') {
    query = query.eq('status', status);
  }

  if (category !== undefined && category !== null && category !== '') {
    query = query.eq('category', category);
  }

  if (limit !== undefined && limit !== null) {
    query = query.limit(limit);
  }

  if (offset !== undefined && offset !== null) {
    query = query.range(offset, offset + (limit ?? 1000) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Portfolio.findAll failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Find a single portfolio item by its slug.
 *
 * @param {string} slug - The URL slug of the portfolio item
 * @returns {Promise<Object|null>} Portfolio item or null if not found
 */
async function findBySlug(slug) {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    // PostgREST returns PGRST116 when no rows found — treat as null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Portfolio.findBySlug failed: ${error.message}`);
  }

  return data || null;
}

/**
 * Find a single portfolio item by its ID.
 *
 * @param {number|string} id - The primary key of the portfolio item
 * @returns {Promise<Object|null>} Portfolio item or null if not found
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Portfolio.findById failed: ${error.message}`);
  }

  return data || null;
}

/**
 * Create a new portfolio item.
 *
 * @param {Object} data - Portfolio item fields
 * @returns {Promise<Object>} The newly created portfolio item
 */
async function create(data) {
  const { data: created, error } = await supabase
    .from('portfolios')
    .insert([data])
    .select()
    .single();

  if (error) {
    throw new Error(`Portfolio.create failed: ${error.message}`);
  }

  return created;
}

/**
 * Update an existing portfolio item by ID.
 *
 * @param {number|string} id   - The primary key of the portfolio item to update
 * @param {Object}        data - Fields to update
 * @returns {Promise<Object>} The updated portfolio item
 */
async function update(id, data) {
  const { data: updated, error } = await supabase
    .from('portfolios')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Portfolio.update failed: ${error.message}`);
  }

  return updated;
}

/**
 * Delete a portfolio item by ID.
 *
 * @param {number|string} id - The primary key of the portfolio item to delete
 * @returns {Promise<void>}
 */
async function remove(id) {
  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Portfolio.remove failed: ${error.message}`);
  }
}

/**
 * Check whether a slug already exists in the portfolios table.
 * Optionally excludes a specific record (used during updates to allow
 * keeping the same slug on the same item).
 *
 * @param {string}           slug      - The slug to check
 * @param {number|string|null} [excludeId=null] - ID to exclude from the check
 * @returns {Promise<boolean>} true if the slug is already taken, false otherwise
 */
async function slugExists(slug, excludeId = null) {
  let query = supabase
    .from('portfolios')
    .select('id')
    .eq('slug', slug);

  if (excludeId !== null && excludeId !== undefined) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Portfolio.slugExists failed: ${error.message}`);
  }

  return data !== null && data.length > 0;
}

/**
 * Return the total count of all portfolio items (used by admin dashboard).
 *
 * @returns {Promise<number>} Total number of portfolio items
 */
async function countAll() {
  const { count, error } = await supabase
    .from('portfolios')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Portfolio.countAll failed: ${error.message}`);
  }

  return count ?? 0;
}

module.exports = {
  findAll,
  findBySlug,
  findById,
  create,
  update,
  remove,
  slugExists,
  countAll,
};

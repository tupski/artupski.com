/**
 * BlogPost model
 * Wraps all Supabase queries for the blog_posts table.
 *
 * Public display rule:
 *   status = 'published' AND published_at <= NOW()
 *   ordered by published_at DESC
 */

const { supabase } = require('../config/database');

/**
 * Retrieve blog posts with optional filters.
 *
 * @param {object} [options={}]
 * @param {string} [options.status]  - Filter by status ('draft' | 'published').
 *                                     When 'published', also filters published_at <= NOW().
 * @param {number} [options.limit]   - Max number of rows to return.
 * @param {number} [options.offset]  - Number of rows to skip (for pagination).
 * @returns {Promise<Array>} Array of blog post rows.
 */
async function findAll({ status, limit, offset } = {}) {
  let query = supabase
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);

    // For public display: only posts whose publish date has passed
    if (status === 'published') {
      query = query.lte('published_at', new Date().toISOString());
    }
  }

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  if (typeof offset === 'number') {
    query = query.range(offset, offset + (limit ?? 1000) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Find a single blog post by its slug.
 *
 * @param {string} slug
 * @returns {Promise<object|null>} Blog post row or null if not found.
 */
async function findBySlug(slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Find a single blog post by its primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>} Blog post row or null if not found.
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Insert a new blog post.
 *
 * @param {object} data - Column values to insert.
 * @returns {Promise<object>} The newly created blog post row.
 */
async function create(data) {
  const { data: created, error } = await supabase
    .from('blog_posts')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return created;
}

/**
 * Update an existing blog post by id.
 *
 * @param {number} id
 * @param {object} data - Column values to update.
 * @returns {Promise<object>} The updated blog post row.
 */
async function update(id, data) {
  const { data: updated, error } = await supabase
    .from('blog_posts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Delete a blog post by id.
 *
 * @param {number} id
 * @returns {Promise<void>}
 */
async function remove(id) {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Check whether a slug is already in use, optionally excluding one record.
 * Useful for uniqueness validation on create and update.
 *
 * @param {string} slug
 * @param {number|null} [excludeId=null] - ID of the record to exclude (for updates).
 * @returns {Promise<boolean>} True if the slug exists (conflict), false otherwise.
 */
async function slugExists(slug, excludeId = null) {
  let query = supabase
    .from('blog_posts')
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
 * Return the total count of all blog posts (regardless of status).
 *
 * @returns {Promise<number>} Total row count.
 */
async function countAll() {
  const { count, error } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count;
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

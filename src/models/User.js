/**
 * User model
 * Handles all database operations for the users table
 */

const { supabase } = require('../config/database');

/**
 * Find a user by email address
 * @param {string} email
 * @returns {Object|null} user row or null if not found
 */
async function findByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    // PGRST116 = no rows returned — not a real error
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Find a user by ID
 * @param {number} id
 * @returns {Object|null} user row or null if not found
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Create a new user
 * @param {Object} data - { email, password, name }
 * @returns {Object} created user row
 */
async function create(data) {
  const { data: created, error } = await supabase
    .from('users')
    .insert([data])
    .select()
    .single();

  if (error) throw error;

  return created;
}

/**
 * Update a user's password hash
 * @param {number} id
 * @param {string} hash - bcrypt hash
 * @returns {Object} updated user row
 */
async function updatePassword(id, hash) {
  const { data, error } = await supabase
    .from('users')
    .update({ password: hash, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

module.exports = { findByEmail, findById, create, updatePassword };

/**
 * ContactMessage model
 * Handles all database operations for the contact_messages table
 */

const { supabase } = require('../config/database');

/**
 * Find all contact messages with optional filtering and pagination
 * @param {Object} options
 * @param {string} [options.status] - Filter by status ('unread' | 'read')
 * @param {number} [options.limit]  - Max number of records to return
 * @param {number} [options.offset] - Number of records to skip
 * @returns {Object[]} array of contact_message rows
 */
async function findAll({ status, limit, offset } = {}) {
  let query = supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (status !== undefined && status !== null) {
    query = query.eq('status', status);
  }

  if (limit !== undefined && limit !== null) {
    query = query.limit(limit);
  }

  if (offset !== undefined && offset !== null) {
    query = query.range(offset, offset + (limit ?? 1000) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Find a single contact message by ID
 * @param {number} id
 * @returns {Object|null} contact_message row or null if not found
 */
async function findById(id) {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 = no rows returned — not a real error
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Create a new contact message
 * Status is always forced to 'unread' regardless of what data.status says
 * @param {Object} data - { name, email, subject, message, ip_address? }
 * @returns {Object} created contact_message row
 */
async function create(data) {
  const payload = {
    ...data,
    status: 'unread', // always override — never trust caller-supplied status
  };

  const { data: created, error } = await supabase
    .from('contact_messages')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return created;
}

/**
 * Mark a contact message as read
 * @param {number} id
 * @returns {Object} updated contact_message row
 */
async function markAsRead(id) {
  const { data, error } = await supabase
    .from('contact_messages')
    .update({ status: 'read' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Delete a contact message by ID
 * @param {number} id
 * @returns {void}
 */
async function remove(id) {
  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Count the number of unread contact messages
 * @returns {number} count of records with status = 'unread'
 */
async function countUnread() {
  const { count, error } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');

  if (error) throw error;

  return count ?? 0;
}

module.exports = { findAll, findById, create, markAsRead, remove, countUnread };

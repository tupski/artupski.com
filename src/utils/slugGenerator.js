'use strict';

/**
 * Slug_Generator utility
 * Converts titles to URL-friendly slugs and ensures uniqueness in the database.
 */

/**
 * Normalize Unicode characters to their ASCII equivalents where possible.
 * Uses NFD decomposition to separate base characters from diacritics, then
 * strips the combining diacritical marks (U+0300–U+036F).
 *
 * @param {string} str
 * @returns {string}
 */
function normalizeUnicode(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip combining diacritical marks
}

/**
 * Convert a title string into a URL-friendly slug.
 *
 * Rules (in order):
 *  1. Normalize Unicode (decompose + strip diacritics)
 *  2. Lowercase
 *  3. Replace spaces and special characters with hyphens
 *  4. Strip any character that is not [a-z0-9-]
 *  5. Collapse consecutive hyphens into one
 *  6. Trim leading/trailing hyphens
 *  7. Truncate to 100 characters (then trim trailing hyphens again)
 *  8. If the result is empty, return 'untitled'
 *
 * @param {string} title - The raw title to slugify
 * @returns {string} A valid slug string
 */
function generateSlug(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    return 'untitled';
  }

  let slug = title;

  // Step 1: Normalize Unicode (é → e, ñ → n, etc.)
  slug = normalizeUnicode(slug);

  // Step 2: Lowercase
  slug = slug.toLowerCase();

  // Step 3: Replace spaces and common special characters with hyphens
  // This covers whitespace, &, +, /, \, |, @, #, $, %, ^, *, (, ), [, ], {, }, <, >, ?, !, =, ~, `, ;, :, ', ", ,, .
  slug = slug.replace(/[\s&+/\\|@#$%^*()[\]{}<>?!=~`;:'",.]+/g, '-');

  // Step 4: Strip any remaining characters that are not [a-z0-9-]
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // Step 5: Collapse consecutive hyphens
  slug = slug.replace(/-{2,}/g, '-');

  // Step 6: Trim leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  // Step 7: Truncate to 100 characters
  if (slug.length > 100) {
    slug = slug.substring(0, 100);
    // After truncation, trim any trailing hyphen that may have been introduced
    slug = slug.replace(/-+$/, '');
  }

  // Step 8: Fallback for empty result (e.g. all-special-chars input)
  if (slug === '') {
    return 'untitled';
  }

  return slug;
}

/**
 * Ensure a slug is unique within a given model's table.
 *
 * If the slug already exists (excluding the record identified by `excludeId`),
 * this function appends a numeric suffix (-2, -3, …) until a unique slug is found.
 *
 * @param {string} slug - The base slug to check
 * @param {object} model - A model object that exposes `slugExists(slug, excludeId)`
 * @param {number|string|null} [excludeId=null] - ID of the record to exclude from the check (for updates)
 * @returns {Promise<string>} A unique slug
 */
async function ensureUniqueSlug(slug, model, excludeId = null) {
  let candidate = slug;
  let counter = 2;

  while (await model.slugExists(candidate, excludeId)) {
    candidate = `${slug}-${counter}`;
    counter++;
  }

  return candidate;
}

module.exports = { generateSlug, ensureUniqueSlug };

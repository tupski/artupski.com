/**
 * SEO_Helper — Utility untuk menghasilkan meta tag, Open Graph tag, dan canonical URL.
 *
 * Requirements: 13.1, 13.2, 13.5
 */

/**
 * Truncate a string to a maximum number of characters.
 * Tries not to cut in the middle of a word when possible.
 *
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum character length
 * @returns {string}
 */
function truncate(str, maxLength) {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;

  // Try to cut at the last space before maxLength to avoid mid-word cuts
  const truncated = str.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  // Only use word-boundary cut if there's a reasonable space (not too far back)
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace).trimEnd();
  }

  return truncated.trimEnd();
}

/**
 * Check if a value is null, undefined, or an empty/whitespace-only string.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

/**
 * Build SEO meta object for a page.
 *
 * @param {Object} params
 * @param {string|null} params.title       - Page-specific title (truncated to 60 chars)
 * @param {string|null} params.description - Page-specific description (truncated to 160 chars)
 * @param {string|null} params.image       - Page-specific og:image URL
 * @param {string|null} params.url         - Canonical URL for the page
 * @param {string|null} params.type        - og:type (default: 'website')
 * @param {Object|null} params.settings    - Settings object from Settings_Manager
 *
 * @returns {{
 *   metaTitle: string,
 *   metaDescription: string,
 *   canonical: string,
 *   og: {
 *     title: string,
 *     description: string,
 *     image: string,
 *     url: string,
 *     type: string
 *   }
 * }}
 */
function buildSeoMeta({ title, description, image, url, type, settings } = {}) {
  // Safely access settings fields with empty string fallbacks
  const safeSettings = settings && typeof settings === 'object' ? settings : {};
  const defaultTitle = safeSettings.seo_title_default || '';
  const defaultDescription = safeSettings.seo_description_default || '';
  const defaultImage = safeSettings.hero_image || '';

  // Resolve title: use provided value if non-empty, else fall back to settings default
  const resolvedTitle = isEmpty(title) ? defaultTitle : String(title).trim();

  // Resolve description: use provided value if non-empty, else fall back to settings default
  const resolvedDescription = isEmpty(description) ? defaultDescription : String(description).trim();

  // Truncate to SEO-safe lengths
  const metaTitle = truncate(resolvedTitle, 60);
  const metaDescription = truncate(resolvedDescription, 160);

  // Resolve og:image — use page-specific image or fall back to hero_image from settings
  const ogImage = isEmpty(image) ? defaultImage : String(image).trim();

  // Canonical URL
  const canonical = isEmpty(url) ? '' : String(url).trim();

  // og:type defaults to 'website'
  const ogType = isEmpty(type) ? 'website' : String(type).trim();

  return {
    metaTitle,
    metaDescription,
    canonical,
    og: {
      title: metaTitle,
      description: metaDescription,
      image: ogImage,
      url: canonical,
      type: ogType,
    },
  };
}

module.exports = { buildSeoMeta };

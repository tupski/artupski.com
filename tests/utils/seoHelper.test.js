/**
 * Tests for src/utils/seoHelper.js
 *
 * Covers:
 * - Unit tests for buildSeoMeta (Requirements 13.1, 13.2, 13.5)
 * - Property 10: SEO Fallback to Settings Defaults (Requirements 13.5)
 */

const fc = require('fast-check');
const { buildSeoMeta } = require('../../src/utils/seoHelper');

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

describe('buildSeoMeta — unit tests', () => {
  const baseSettings = {
    seo_title_default: 'Default SEO Title',
    seo_description_default: 'Default SEO description for the website.',
    hero_image: '/uploads/hero.jpg',
  };

  // --- Return shape ---

  test('returns all required fields', () => {
    const result = buildSeoMeta({
      title: 'My Page',
      description: 'My description',
      image: '/img/page.jpg',
      url: 'https://example.com/page',
      type: 'article',
      settings: baseSettings,
    });

    expect(result).toHaveProperty('metaTitle');
    expect(result).toHaveProperty('metaDescription');
    expect(result).toHaveProperty('canonical');
    expect(result).toHaveProperty('og');
    expect(result.og).toHaveProperty('title');
    expect(result.og).toHaveProperty('description');
    expect(result.og).toHaveProperty('image');
    expect(result.og).toHaveProperty('url');
    expect(result.og).toHaveProperty('type');
  });

  // --- Title truncation (Requirement 13.1) ---

  test('truncates title to 60 characters', () => {
    const longTitle = 'A'.repeat(80);
    const result = buildSeoMeta({ title: longTitle, settings: baseSettings });
    expect(result.metaTitle.length).toBeLessThanOrEqual(60);
  });

  test('does not truncate title shorter than 60 characters', () => {
    const shortTitle = 'Short Title';
    const result = buildSeoMeta({ title: shortTitle, settings: baseSettings });
    expect(result.metaTitle).toBe('Short Title');
  });

  test('title exactly 60 characters is not truncated', () => {
    const exactTitle = 'A'.repeat(60);
    const result = buildSeoMeta({ title: exactTitle, settings: baseSettings });
    expect(result.metaTitle).toBe(exactTitle);
  });

  // --- Description truncation (Requirement 13.1) ---

  test('truncates description to 160 characters', () => {
    const longDesc = 'B'.repeat(200);
    const result = buildSeoMeta({ description: longDesc, settings: baseSettings });
    expect(result.metaDescription.length).toBeLessThanOrEqual(160);
  });

  test('does not truncate description shorter than 160 characters', () => {
    const shortDesc = 'Short description.';
    const result = buildSeoMeta({ description: shortDesc, settings: baseSettings });
    expect(result.metaDescription).toBe('Short description.');
  });

  test('description exactly 160 characters is not truncated', () => {
    const exactDesc = 'C'.repeat(160);
    const result = buildSeoMeta({ description: exactDesc, settings: baseSettings });
    expect(result.metaDescription).toBe(exactDesc);
  });

  // --- Fallback to settings defaults (Requirement 13.5) ---

  test('falls back to seo_title_default when title is null', () => {
    const result = buildSeoMeta({ title: null, settings: baseSettings });
    expect(result.metaTitle).toBe('Default SEO Title');
  });

  test('falls back to seo_title_default when title is empty string', () => {
    const result = buildSeoMeta({ title: '', settings: baseSettings });
    expect(result.metaTitle).toBe('Default SEO Title');
  });

  test('falls back to seo_title_default when title is whitespace only', () => {
    const result = buildSeoMeta({ title: '   ', settings: baseSettings });
    expect(result.metaTitle).toBe('Default SEO Title');
  });

  test('falls back to seo_title_default when title is undefined', () => {
    const result = buildSeoMeta({ settings: baseSettings });
    expect(result.metaTitle).toBe('Default SEO Title');
  });

  test('falls back to seo_description_default when description is null', () => {
    const result = buildSeoMeta({ description: null, settings: baseSettings });
    expect(result.metaDescription).toBe('Default SEO description for the website.');
  });

  test('falls back to seo_description_default when description is empty string', () => {
    const result = buildSeoMeta({ description: '', settings: baseSettings });
    expect(result.metaDescription).toBe('Default SEO description for the website.');
  });

  test('uses provided title over settings default when title is non-empty', () => {
    const result = buildSeoMeta({ title: 'Custom Title', settings: baseSettings });
    expect(result.metaTitle).toBe('Custom Title');
  });

  test('uses provided description over settings default when description is non-empty', () => {
    const result = buildSeoMeta({ description: 'Custom description.', settings: baseSettings });
    expect(result.metaDescription).toBe('Custom description.');
  });

  // --- og:image fallback to hero_image (Requirement 13.2) ---

  test('uses provided image as og:image', () => {
    const result = buildSeoMeta({ image: '/uploads/custom.jpg', settings: baseSettings });
    expect(result.og.image).toBe('/uploads/custom.jpg');
  });

  test('falls back to hero_image when image is null', () => {
    const result = buildSeoMeta({ image: null, settings: baseSettings });
    expect(result.og.image).toBe('/uploads/hero.jpg');
  });

  test('falls back to hero_image when image is empty string', () => {
    const result = buildSeoMeta({ image: '', settings: baseSettings });
    expect(result.og.image).toBe('/uploads/hero.jpg');
  });

  // --- canonical URL ---

  test('sets canonical from url param', () => {
    const result = buildSeoMeta({ url: 'https://example.com/about', settings: baseSettings });
    expect(result.canonical).toBe('https://example.com/about');
    expect(result.og.url).toBe('https://example.com/about');
  });

  test('canonical is empty string when url is null', () => {
    const result = buildSeoMeta({ url: null, settings: baseSettings });
    expect(result.canonical).toBe('');
  });

  // --- og:type ---

  test('defaults og:type to "website" when type is not provided', () => {
    const result = buildSeoMeta({ settings: baseSettings });
    expect(result.og.type).toBe('website');
  });

  test('uses provided og:type', () => {
    const result = buildSeoMeta({ type: 'article', settings: baseSettings });
    expect(result.og.type).toBe('article');
  });

  // --- og fields mirror meta fields ---

  test('og.title matches metaTitle', () => {
    const result = buildSeoMeta({ title: 'Test Title', settings: baseSettings });
    expect(result.og.title).toBe(result.metaTitle);
  });

  test('og.description matches metaDescription', () => {
    const result = buildSeoMeta({ description: 'Test desc', settings: baseSettings });
    expect(result.og.description).toBe(result.metaDescription);
  });

  // --- Null/missing settings ---

  test('handles null settings gracefully', () => {
    const result = buildSeoMeta({ title: 'Title', description: 'Desc', settings: null });
    expect(result.metaTitle).toBe('Title');
    expect(result.metaDescription).toBe('Desc');
    expect(result.og.image).toBe('');
  });

  test('handles undefined settings gracefully', () => {
    const result = buildSeoMeta({ title: 'Title', description: 'Desc' });
    expect(result.metaTitle).toBe('Title');
    expect(result.metaDescription).toBe('Desc');
    expect(result.og.image).toBe('');
  });

  test('handles empty settings object gracefully', () => {
    const result = buildSeoMeta({ title: 'Title', description: 'Desc', settings: {} });
    expect(result.metaTitle).toBe('Title');
    expect(result.metaDescription).toBe('Desc');
    expect(result.og.image).toBe('');
  });

  test('handles no arguments gracefully', () => {
    const result = buildSeoMeta();
    expect(result.metaTitle).toBe('');
    expect(result.metaDescription).toBe('');
    expect(result.canonical).toBe('');
    expect(result.og.type).toBe('website');
  });
});

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

// Feature: artupski-portfolio-cms, Property 10: SEO Fallback to Settings Defaults
describe('buildSeoMeta — Property 10: SEO Fallback to Settings Defaults', () => {
  /**
   * Validates: Requirements 13.5
   *
   * For any content item with null/empty meta_title and meta_description,
   * buildSeoMeta must use settings.seo_title_default and settings.seo_description_default.
   */
  test('P10: always uses settings defaults when title and description are null/empty', () => {
    fc.assert(
      fc.property(
        // Generate null or empty/whitespace-only title
        fc.option(fc.constantFrom('', '   ', '\t', '\n'), { nil: null }),
        // Generate null or empty/whitespace-only description
        fc.option(fc.constantFrom('', '   ', '\t', '\n'), { nil: null }),
        // Generate non-empty settings defaults
        fc.record({
          seo_title_default: fc.string({ minLength: 1, maxLength: 60 }),
          seo_description_default: fc.string({ minLength: 1, maxLength: 160 }),
          hero_image: fc.string(),
        }),
        (emptyTitle, emptyDesc, settings) => {
          const result = buildSeoMeta({
            title: emptyTitle,
            description: emptyDesc,
            settings,
          });

          // metaTitle must come from settings default (truncated if needed)
          const expectedTitle = settings.seo_title_default.length <= 60
            ? settings.seo_title_default
            : settings.seo_title_default.slice(0, 60).trimEnd();

          expect(result.metaTitle.length).toBeGreaterThan(0);
          expect(settings.seo_title_default).toContain(result.metaTitle.replace(/\s+$/, ''));

          // metaDescription must come from settings default (truncated if needed)
          expect(result.metaDescription.length).toBeGreaterThan(0);
          expect(settings.seo_description_default).toContain(result.metaDescription.replace(/\s+$/, ''));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P10: metaTitle never exceeds 60 characters for any input', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        fc.record({
          seo_title_default: fc.string(),
          seo_description_default: fc.string(),
          hero_image: fc.string(),
        }),
        (title, settings) => {
          const result = buildSeoMeta({ title, settings });
          expect(result.metaTitle.length).toBeLessThanOrEqual(60);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P10: metaDescription never exceeds 160 characters for any input', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        fc.record({
          seo_title_default: fc.string(),
          seo_description_default: fc.string(),
          hero_image: fc.string(),
        }),
        (description, settings) => {
          const result = buildSeoMeta({ description, settings });
          expect(result.metaDescription.length).toBeLessThanOrEqual(160);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P10: og.image falls back to hero_image when image is null/empty', () => {
    fc.assert(
      fc.property(
        fc.option(fc.constantFrom('', '   '), { nil: null }),
        fc.record({
          seo_title_default: fc.string(),
          seo_description_default: fc.string(),
          hero_image: fc.string({ minLength: 1 }),
        }),
        (emptyImage, settings) => {
          const result = buildSeoMeta({ image: emptyImage, settings });
          expect(result.og.image).toBe(settings.hero_image);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P10: og.type defaults to "website" when type is null/empty', () => {
    fc.assert(
      fc.property(
        fc.option(fc.constantFrom('', '   '), { nil: null }),
        fc.record({
          seo_title_default: fc.string(),
          seo_description_default: fc.string(),
          hero_image: fc.string(),
        }),
        (emptyType, settings) => {
          const result = buildSeoMeta({ type: emptyType, settings });
          expect(result.og.type).toBe('website');
        }
      ),
      { numRuns: 100 }
    );
  });
});

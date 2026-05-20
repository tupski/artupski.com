'use strict';

// Feature: artupski-portfolio-cms, Property 1: Slug Format Invariant

const fc = require('fast-check');
const { generateSlug, ensureUniqueSlug } = require('../../src/utils/slugGenerator');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Regex that a valid slug must fully match */
const VALID_SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

/**
 * Assert all structural invariants of a generated slug.
 * Returns true if valid, throws a descriptive error otherwise.
 */
function assertSlugInvariants(slug) {
  // Must only contain [a-z0-9-]
  expect(slug).toMatch(/^[a-z0-9-]+$/);
  // Max 100 characters
  expect(slug.length).toBeLessThanOrEqual(100);
  // No leading hyphen
  expect(slug).not.toMatch(/^-/);
  // No trailing hyphen
  expect(slug).not.toMatch(/-$/);
  // No consecutive hyphens
  expect(slug).not.toMatch(/--/);
  // Must not be empty
  expect(slug.length).toBeGreaterThan(0);
}

// ---------------------------------------------------------------------------
// Unit tests — generateSlug
// ---------------------------------------------------------------------------

describe('generateSlug — unit tests', () => {
  test('converts basic title to lowercase hyphenated slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  test('handles multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world');
  });

  test('strips leading and trailing spaces', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });

  test('strips leading and trailing hyphens', () => {
    expect(generateSlug('--Hello--')).toBe('hello');
  });

  test('collapses consecutive hyphens', () => {
    expect(generateSlug('Hello---World')).toBe('hello-world');
  });

  test('handles mixed leading/trailing hyphens and spaces', () => {
    expect(generateSlug('  --Hello--  ')).toBe('hello');
  });

  test('strips special characters', () => {
    expect(generateSlug('Hello & World!')).toBe('hello-world');
  });

  test('handles ampersand and other punctuation', () => {
    const slug = generateSlug('Café & Restaurant');
    assertSlugInvariants(slug);
    // 'é' → 'e' after NFD normalization, so 'cafe' is expected
    expect(slug).toContain('cafe');
    expect(slug).toContain('restaurant');
  });

  test('handles accented characters via Unicode normalization', () => {
    expect(generateSlug('Résumé')).toBe('resume');
  });

  test('handles all-uppercase input', () => {
    expect(generateSlug('MY PORTFOLIO PROJECT')).toBe('my-portfolio-project');
  });

  test('handles numeric characters', () => {
    expect(generateSlug('Project 2024')).toBe('project-2024');
  });

  test('handles title with only numbers', () => {
    const slug = generateSlug('12345');
    expect(slug).toBe('12345');
    assertSlugInvariants(slug);
  });

  test('truncates to 100 characters', () => {
    const longTitle = 'a'.repeat(200);
    const slug = generateSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(100);
  });

  test('truncates long title and removes trailing hyphen after truncation', () => {
    // Construct a title that would produce a hyphen exactly at position 100
    // "word-" repeated — after truncation at 100 chars the trailing hyphen must be stripped
    const title = ('abcdefghi-').repeat(11); // 110 chars → truncated to 100 → may end with '-'
    const slug = generateSlug(title);
    expect(slug.length).toBeLessThanOrEqual(100);
    expect(slug).not.toMatch(/-$/);
  });

  test('returns "untitled" for empty string', () => {
    expect(generateSlug('')).toBe('untitled');
  });

  test('returns "untitled" for whitespace-only string', () => {
    expect(generateSlug('   ')).toBe('untitled');
  });

  test('returns "untitled" for all-special-chars input', () => {
    expect(generateSlug('!@#$%^&*()')).toBe('untitled');
  });

  test('returns "untitled" for non-string input (null)', () => {
    expect(generateSlug(null)).toBe('untitled');
  });

  test('returns "untitled" for non-string input (undefined)', () => {
    expect(generateSlug(undefined)).toBe('untitled');
  });

  test('returns "untitled" for non-string input (number)', () => {
    expect(generateSlug(42)).toBe('untitled');
  });

  test('handles slash and backslash', () => {
    const slug = generateSlug('path/to\\file');
    assertSlugInvariants(slug);
    expect(slug).toBe('path-to-file');
  });

  test('handles colon and semicolon', () => {
    const slug = generateSlug('Title: Subtitle; Part 2');
    assertSlugInvariants(slug);
    expect(slug).toBe('title-subtitle-part-2');
  });

  test('handles Japanese/CJK characters (stripped, fallback untitled)', () => {
    // CJK characters are not [a-z0-9-] and will be stripped
    const slug = generateSlug('日本語タイトル');
    // After stripping non-ASCII, result is empty → 'untitled'
    expect(slug).toBe('untitled');
  });

  test('handles mixed ASCII and CJK', () => {
    const slug = generateSlug('My Project 日本語');
    assertSlugInvariants(slug);
    expect(slug).toBe('my-project');
  });

  test('single character title', () => {
    const slug = generateSlug('a');
    expect(slug).toBe('a');
    assertSlugInvariants(slug);
  });

  test('title with only hyphens returns untitled', () => {
    expect(generateSlug('---')).toBe('untitled');
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 1: Slug Format Invariant
// Validates: Requirements 7.2, 13.4
// ---------------------------------------------------------------------------

describe('generateSlug — Property 1: Slug Format Invariant', () => {
  test('arbitrary ASCII strings produce valid slugs', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const slug = generateSlug(input);
        // Must only contain [a-z0-9-]
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        // Max 100 characters
        expect(slug.length).toBeLessThanOrEqual(100);
        // No leading hyphen
        expect(slug).not.toMatch(/^-/);
        // No trailing hyphen
        expect(slug).not.toMatch(/-$/);
        // No consecutive hyphens
        expect(slug).not.toMatch(/--/);
        // Must not be empty
        expect(slug.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  test('arbitrary Unicode strings produce valid slugs', () => {
    fc.assert(
      fc.property(fc.unicodeString(), (input) => {
        const slug = generateSlug(input);
        // Must only contain [a-z0-9-]
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        // Max 100 characters
        expect(slug.length).toBeLessThanOrEqual(100);
        // No leading hyphen
        expect(slug).not.toMatch(/^-/);
        // No trailing hyphen
        expect(slug).not.toMatch(/-$/);
        // No consecutive hyphens
        expect(slug).not.toMatch(/--/);
        // Must not be empty
        expect(slug.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests — ensureUniqueSlug
// ---------------------------------------------------------------------------

describe('ensureUniqueSlug — unit tests', () => {
  /**
   * Build a mock model that reports a slug as taken if it is in the `takenSlugs` set.
   * Optionally, `excludeId` is passed through but ignored in this simple mock.
   */
  function makeMockModel(takenSlugs = new Set()) {
    return {
      slugExists: jest.fn(async (slug, excludeId) => takenSlugs.has(slug)),
    };
  }

  test('returns the slug unchanged when no conflict exists', async () => {
    const model = makeMockModel(new Set());
    const result = await ensureUniqueSlug('hello-world', model);
    expect(result).toBe('hello-world');
    expect(model.slugExists).toHaveBeenCalledTimes(1);
  });

  test('appends -2 when base slug is taken', async () => {
    const model = makeMockModel(new Set(['hello-world']));
    const result = await ensureUniqueSlug('hello-world', model);
    expect(result).toBe('hello-world-2');
  });

  test('appends -3 when base and -2 are taken', async () => {
    const model = makeMockModel(new Set(['hello-world', 'hello-world-2']));
    const result = await ensureUniqueSlug('hello-world', model);
    expect(result).toBe('hello-world-3');
  });

  test('increments suffix until a unique slug is found', async () => {
    const taken = new Set(['slug', 'slug-2', 'slug-3', 'slug-4']);
    const model = makeMockModel(taken);
    const result = await ensureUniqueSlug('slug', model);
    expect(result).toBe('slug-5');
  });

  test('passes excludeId to model.slugExists', async () => {
    const model = makeMockModel(new Set());
    await ensureUniqueSlug('my-slug', model, 42);
    expect(model.slugExists).toHaveBeenCalledWith('my-slug', 42);
  });

  test('excludeId defaults to null when not provided', async () => {
    const model = makeMockModel(new Set());
    await ensureUniqueSlug('my-slug', model);
    expect(model.slugExists).toHaveBeenCalledWith('my-slug', null);
  });

  test('works correctly when excludeId causes the base slug to be considered free', async () => {
    // Simulate an update scenario: the record being edited owns 'my-slug',
    // so slugExists returns false for it (model excludes that ID).
    const model = {
      slugExists: jest.fn(async (slug, excludeId) => {
        // Pretend 'my-slug' is taken by record 99, but we're editing record 99
        if (slug === 'my-slug' && excludeId === 99) return false;
        return false;
      }),
    };
    const result = await ensureUniqueSlug('my-slug', model, 99);
    expect(result).toBe('my-slug');
  });
});

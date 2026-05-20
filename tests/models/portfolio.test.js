'use strict';

// Feature: artupski-portfolio-cms, Property 2: Slug Uniqueness Constraint
// Feature: artupski-portfolio-cms, Property 12: Portfolio Category Filter

/**
 * Tests for src/models/Portfolio.js
 *
 * Covers:
 * - Unit tests for slugExists() — slug conflict detection
 * - Unit tests for findAll() with category filter
 * - Property 2: Slug Uniqueness Constraint (Requirements 7.3, 7.7)
 * - Property 12: Portfolio Category Filter (Requirements 7.7)
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Mock Supabase client BEFORE requiring the module under test
// ---------------------------------------------------------------------------

jest.mock('../../src/config/database', () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  return {
    supabase: {
      from: jest.fn(() => mockQuery),
      _mockQuery: mockQuery,
    },
  };
});

// ---------------------------------------------------------------------------
// Helpers to access the mock query chain
// ---------------------------------------------------------------------------

function getMockQuery() {
  const { supabase } = require('../../src/config/database');
  return supabase._mockQuery;
}

// ---------------------------------------------------------------------------
// Re-require fresh module before each test
// ---------------------------------------------------------------------------

let Portfolio;

beforeEach(() => {
  jest.resetModules();

  // Re-apply mock after resetModules
  jest.mock('../../src/config/database', () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    return {
      supabase: {
        from: jest.fn(() => mockQuery),
        _mockQuery: mockQuery,
      },
    };
  });

  Portfolio = require('../../src/models/Portfolio');
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Unit Tests — slugExists()
// ---------------------------------------------------------------------------

describe('Portfolio.slugExists — unit tests', () => {
  test('returns true when slug exists in DB', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    // Simulate Supabase returning one matching row
    q.eq.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });

    const result = await Portfolio.slugExists('my-project');
    expect(result).toBe(true);
  });

  test('returns false when slug does not exist in DB', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    // Simulate Supabase returning no rows
    q.eq.mockResolvedValueOnce({ data: [], error: null });

    const result = await Portfolio.slugExists('nonexistent-slug');
    expect(result).toBe(false);
  });

  test('returns false when the only match is the excluded ID', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    // When excludeId is provided, neq() is called and the final result
    // (after excluding the record) returns empty — slug is free for this item
    q.neq.mockResolvedValueOnce({ data: [], error: null });

    const result = await Portfolio.slugExists('my-project', 42);
    expect(result).toBe(false);
  });

  test('returns true when slug exists and excludeId does not match the owner', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    // Another record (id: 99) owns this slug; we're editing record 42
    q.neq.mockResolvedValueOnce({ data: [{ id: 99 }], error: null });

    const result = await Portfolio.slugExists('taken-slug', 42);
    expect(result).toBe(true);
  });

  test('throws when Supabase returns an error', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    q.eq.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    await expect(Portfolio.slugExists('any-slug')).rejects.toThrow('Portfolio.slugExists failed');
  });

  test('calls supabase.from with "portfolios" table', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    q.eq.mockResolvedValueOnce({ data: [], error: null });

    await Portfolio.slugExists('test-slug');
    expect(supabase.from).toHaveBeenCalledWith('portfolios');
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — findAll() with category filter
// ---------------------------------------------------------------------------

describe('Portfolio.findAll — unit tests', () => {
  test('returns all items when no filters are provided', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    const items = [
      { id: 1, title: 'Project A', category: 'web', status: 'published' },
      { id: 2, title: 'Project B', category: 'mobile', status: 'published' },
    ];
    q.order.mockResolvedValueOnce({ data: items, error: null });

    const result = await Portfolio.findAll();
    expect(result).toEqual(items);
  });

  test('applies category filter when category is provided', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    const webItems = [
      { id: 1, title: 'Project A', category: 'web', status: 'published' },
    ];
    // eq() is called for category filter; the final awaited call returns data
    q.eq.mockResolvedValueOnce({ data: webItems, error: null });

    const result = await Portfolio.findAll({ category: 'web' });
    expect(result).toEqual(webItems);
    // Verify eq was called with category filter
    expect(q.eq).toHaveBeenCalledWith('category', 'web');
  });

  test('applies status filter when status is provided', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    const publishedItems = [
      { id: 1, title: 'Project A', category: 'web', status: 'published' },
    ];
    q.eq.mockResolvedValueOnce({ data: publishedItems, error: null });

    const result = await Portfolio.findAll({ status: 'published' });
    expect(result).toEqual(publishedItems);
    expect(q.eq).toHaveBeenCalledWith('status', 'published');
  });

  test('returns empty array when no items match', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    q.eq.mockResolvedValueOnce({ data: [], error: null });

    const result = await Portfolio.findAll({ category: 'nonexistent' });
    expect(result).toEqual([]);
  });

  test('throws when Supabase returns an error', async () => {
    const { supabase } = require('../../src/config/database');
    const q = supabase._mockQuery;

    q.order.mockResolvedValueOnce({ data: null, error: { message: 'Query failed' } });

    await expect(Portfolio.findAll()).rejects.toThrow('Portfolio.findAll failed');
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 2: Slug Uniqueness Constraint
// Validates: Requirements 7.3, 7.7
// ---------------------------------------------------------------------------

describe('Portfolio.slugExists — Property 2: Slug Uniqueness Constraint', () => {
  /**
   * For any slug string:
   * - slugExists(slug) returns true when the slug is present in the DB
   * - slugExists(slug) returns false when the slug is absent from the DB
   * - slugExists(slug, excludeId) returns false when the only match is the excluded ID
   *
   * Validates: Requirements 7.3, 7.7
   */
  test('P2a: slugExists returns true for any slug that exists in the DB', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (slug) => {
          jest.resetModules();
          jest.mock('../../src/config/database', () => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            };
            return {
              supabase: {
                from: jest.fn(() => mockQuery),
                _mockQuery: mockQuery,
              },
            };
          });

          const { supabase } = require('../../src/config/database');
          const q = supabase._mockQuery;
          const { slugExists } = require('../../src/models/Portfolio');

          // Simulate: slug exists in DB (one matching row returned)
          q.eq.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });

          const result = await slugExists(slug);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P2b: slugExists returns false for any slug that does not exist in the DB', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (slug) => {
          jest.resetModules();
          jest.mock('../../src/config/database', () => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            };
            return {
              supabase: {
                from: jest.fn(() => mockQuery),
                _mockQuery: mockQuery,
              },
            };
          });

          const { supabase } = require('../../src/config/database');
          const q = supabase._mockQuery;
          const { slugExists } = require('../../src/models/Portfolio');

          // Simulate: slug does not exist in DB (empty array returned)
          q.eq.mockResolvedValueOnce({ data: [], error: null });

          const result = await slugExists(slug);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P2c: slugExists returns false when the only match is the excluded ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 100000 }),
        async (slug, excludeId) => {
          jest.resetModules();
          jest.mock('../../src/config/database', () => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            };
            return {
              supabase: {
                from: jest.fn(() => mockQuery),
                _mockQuery: mockQuery,
              },
            };
          });

          const { supabase } = require('../../src/config/database');
          const q = supabase._mockQuery;
          const { slugExists } = require('../../src/models/Portfolio');

          // Simulate: after excluding the record, no rows remain → slug is free
          q.neq.mockResolvedValueOnce({ data: [], error: null });

          const result = await slugExists(slug, excludeId);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 12: Portfolio Category Filter
// Validates: Requirements 7.7
// ---------------------------------------------------------------------------

describe('Portfolio.findAll — Property 12: Portfolio Category Filter', () => {
  /**
   * For any category value used as a filter, every item in the returned result
   * set SHALL have `category` equal to the filter value.
   *
   * Since filtering is performed by Supabase, the test verifies:
   * 1. The model passes the correct category filter to Supabase (.eq('category', value))
   * 2. The returned items all have the correct category (model does not alter the data)
   *
   * Validates: Requirements 7.7
   */
  test('P12: all returned items have category equal to the filter value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.constant('__PLACEHOLDER__'), // will be replaced below
            status: fc.constantFrom('draft', 'published'),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (category, rawItems) => {
          jest.resetModules();
          jest.mock('../../src/config/database', () => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            };
            return {
              supabase: {
                from: jest.fn(() => mockQuery),
                _mockQuery: mockQuery,
              },
            };
          });

          const { supabase } = require('../../src/config/database');
          const q = supabase._mockQuery;
          const { findAll } = require('../../src/models/Portfolio');

          // Build items that all have the target category (simulating DB-side filtering)
          const filteredItems = rawItems.map((item) => ({
            ...item,
            category,
          }));

          // Mock Supabase to return only items matching the category
          q.eq.mockResolvedValueOnce({ data: filteredItems, error: null });

          const result = await findAll({ category });

          // Verify the model passed the correct filter to Supabase
          expect(q.eq).toHaveBeenCalledWith('category', category);

          // Verify every returned item has the correct category
          for (const item of result) {
            expect(item.category).toBe(category);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P12: empty result is valid when no items match the category filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (category) => {
          jest.resetModules();
          jest.mock('../../src/config/database', () => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            };
            return {
              supabase: {
                from: jest.fn(() => mockQuery),
                _mockQuery: mockQuery,
              },
            };
          });

          const { supabase } = require('../../src/config/database');
          const q = supabase._mockQuery;
          const { findAll } = require('../../src/models/Portfolio');

          // Simulate no matching items
          q.eq.mockResolvedValueOnce({ data: [], error: null });

          const result = await findAll({ category });

          // Empty result is valid — no items means no items with wrong category
          expect(result).toEqual([]);
          expect(q.eq).toHaveBeenCalledWith('category', category);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P12: mixed-category collection — model returns only items matching filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            status: fc.constantFrom('draft', 'published'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (targetCategory, otherCategory, baseItems) => {
          // Skip when both categories happen to be the same
          fc.pre(targetCategory !== otherCategory);

          jest.resetModules();
          jest.mock('../../src/config/database', () => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              neq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            };
            return {
              supabase: {
                from: jest.fn(() => mockQuery),
                _mockQuery: mockQuery,
              },
            };
          });

          const { supabase } = require('../../src/config/database');
          const q = supabase._mockQuery;
          const { findAll } = require('../../src/models/Portfolio');

          // Supabase performs the filtering — it returns only items with targetCategory
          const matchingItems = baseItems.map((item) => ({
            ...item,
            category: targetCategory,
          }));

          q.eq.mockResolvedValueOnce({ data: matchingItems, error: null });

          const result = await findAll({ category: targetCategory });

          // Every item in the result must have the target category
          for (const item of result) {
            expect(item.category).toBe(targetCategory);
          }

          // No item should have the other category
          const wrongItems = result.filter((item) => item.category === otherCategory);
          expect(wrongItems).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

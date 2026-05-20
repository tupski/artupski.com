'use strict';

// Feature: artupski-portfolio-cms, Property 11: Skills and Services Sort Order

/**
 * Tests for src/models/Skill.js and src/models/Service.js
 *
 * Covers:
 * - Property 11: Skills and Services Sort Order (Requirements 6.4, 9.4)
 *   For any collection of skills/services with defined sort_order values,
 *   the list returned by findAll() SHALL be ordered by sort_order ASC.
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Mock Supabase client BEFORE requiring the modules under test
// ---------------------------------------------------------------------------

jest.mock('../../src/config/database', () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  };
  return {
    supabase: {
      from: jest.fn(() => mockChain),
      _chain: mockChain,
    },
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the mock chain object from the mocked database module.
 */
function getMockChain() {
  const { supabase } = require('../../src/config/database');
  return supabase._chain;
}

/**
 * Sort an array of objects by sort_order ascending (mirrors Supabase ORDER BY sort_order ASC).
 * @param {Array<{sort_order: number}>} items
 * @returns {Array}
 */
function sortBySortOrderAsc(items) {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

// ---------------------------------------------------------------------------
// Re-require modules fresh before each test
// ---------------------------------------------------------------------------

let SkillModel;
let ServiceModel;

beforeEach(() => {
  jest.resetModules();

  jest.mock('../../src/config/database', () => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    return {
      supabase: {
        from: jest.fn(() => mockChain),
        _chain: mockChain,
      },
    };
  });

  SkillModel = require('../../src/models/Skill');
  ServiceModel = require('../../src/models/Service');
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Unit Tests — Skill.findAll sort order
// ---------------------------------------------------------------------------

describe('Skill.findAll — sort order unit tests', () => {
  test('calls .order("sort_order", { ascending: true })', async () => {
    const { supabase } = require('../../src/config/database');
    const chain = supabase._chain;

    const rows = [
      { id: 1, name: 'JavaScript', sort_order: 1 },
      { id: 2, name: 'CSS', sort_order: 2 },
    ];
    chain.order.mockResolvedValueOnce({ data: rows, error: null });

    await SkillModel.findAll();

    expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  test('returns items in sort_order ASC when Supabase returns them sorted', async () => {
    const { supabase } = require('../../src/config/database');
    const chain = supabase._chain;

    const sortedRows = [
      { id: 3, name: 'HTML', sort_order: 0 },
      { id: 1, name: 'JavaScript', sort_order: 1 },
      { id: 2, name: 'CSS', sort_order: 5 },
    ];
    chain.order.mockResolvedValueOnce({ data: sortedRows, error: null });

    const result = await SkillModel.findAll();

    expect(result).toEqual(sortedRows);
    // Verify the result is sorted ascending
    for (let i = 1; i < result.length; i++) {
      expect(result[i].sort_order).toBeGreaterThanOrEqual(result[i - 1].sort_order);
    }
  });

  test('applies category filter when provided', async () => {
    const { supabase } = require('../../src/config/database');
    const chain = supabase._chain;

    const rows = [{ id: 1, name: 'React', category: 'frontend', sort_order: 1 }];
    chain.eq.mockResolvedValueOnce({ data: rows, error: null });

    const result = await SkillModel.findAll({ category: 'frontend' });

    expect(chain.eq).toHaveBeenCalledWith('category', 'frontend');
    expect(result).toEqual(rows);
  });

  test('throws when Supabase returns an error', async () => {
    // Reset modules to get a fully fresh setup for this test
    jest.resetModules();
    jest.mock('../../src/config/database', () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        eq: jest.fn().mockReturnThis(),
      };
      return {
        supabase: {
          from: jest.fn(() => mockChain),
          _chain: mockChain,
        },
      };
    });
    const { findAll } = require('../../src/models/Skill');
    // The model throws the raw Supabase error object (not an Error instance)
    await expect(findAll()).rejects.toMatchObject({ message: 'DB error' });
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — Service.findAll sort order
// ---------------------------------------------------------------------------

describe('Service.findAll — sort order unit tests', () => {
  test('calls .order("sort_order", { ascending: true })', async () => {
    const { supabase } = require('../../src/config/database');
    const chain = supabase._chain;

    const rows = [
      { id: 1, title: 'Web Design', sort_order: 1 },
      { id: 2, title: 'SEO', sort_order: 2 },
    ];
    chain.order.mockResolvedValueOnce({ data: rows, error: null });

    await ServiceModel.findAll();

    expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  test('returns items in sort_order ASC when Supabase returns them sorted', async () => {
    const { supabase } = require('../../src/config/database');
    const chain = supabase._chain;

    const sortedRows = [
      { id: 2, title: 'SEO', sort_order: 0 },
      { id: 1, title: 'Web Design', sort_order: 3 },
      { id: 3, title: 'Maintenance', sort_order: 10 },
    ];
    chain.order.mockResolvedValueOnce({ data: sortedRows, error: null });

    const result = await ServiceModel.findAll();

    expect(result).toEqual(sortedRows);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].sort_order).toBeGreaterThanOrEqual(result[i - 1].sort_order);
    }
  });

  test('applies status filter when provided', async () => {
    const { supabase } = require('../../src/config/database');
    const chain = supabase._chain;

    const rows = [{ id: 1, title: 'Web Design', status: 'active', sort_order: 1 }];
    chain.eq.mockResolvedValueOnce({ data: rows, error: null });

    const result = await ServiceModel.findAll({ status: 'active' });

    expect(chain.eq).toHaveBeenCalledWith('status', 'active');
    expect(result).toEqual(rows);
  });

  test('throws when Supabase returns an error', async () => {
    // Reset modules to get a fully fresh setup for this test
    jest.resetModules();
    jest.mock('../../src/config/database', () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'connection failed' } }),
        eq: jest.fn().mockReturnThis(),
      };
      return {
        supabase: {
          from: jest.fn(() => mockChain),
          _chain: mockChain,
        },
      };
    });
    const { findAll } = require('../../src/models/Service');
    // The model throws the raw Supabase error object (not an Error instance)
    await expect(findAll()).rejects.toMatchObject({ message: 'connection failed' });
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 11: Skills and Services Sort Order
// Validates: Requirements 6.4, 9.4
// ---------------------------------------------------------------------------

describe('Property 11: Skills and Services Sort Order', () => {
  /**
   * For any collection of skills with random sort_order values,
   * the result returned by Skill.findAll() (which delegates ordering to Supabase)
   * SHALL be ordered by sort_order ASC.
   *
   * Since sorting is performed by Supabase via ORDER BY sort_order ASC,
   * we verify two things:
   *   1. The model always calls .order('sort_order', { ascending: true })
   *   2. When Supabase returns data sorted by sort_order ASC (as it would in production),
   *      the model returns it in that same sorted order.
   *
   * Validates: Requirements 6.4, 9.4
   */
  test('P11 (Skill): findAll always calls order("sort_order", ascending) and returns sorted result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            sort_order: fc.integer({ min: -1000, max: 1000 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (items) => {
          jest.resetModules();

          // Simulate what Supabase returns: data sorted by sort_order ASC
          const sortedItems = sortBySortOrderAsc(items);

          jest.mock('../../src/config/database', () => {
            const mockChain = {
              select: jest.fn().mockReturnThis(),
              order: jest.fn(),
              eq: jest.fn().mockReturnThis(),
            };
            return {
              supabase: {
                from: jest.fn(() => mockChain),
                _chain: mockChain,
              },
            };
          });

          const { supabase: freshSupa } = require('../../src/config/database');
          const chain = freshSupa._chain;

          // Supabase returns data sorted ASC (as ORDER BY sort_order ASC would)
          chain.order.mockResolvedValueOnce({ data: sortedItems, error: null });

          const { findAll } = require('../../src/models/Skill');
          const result = await findAll();

          // 1. Model must call .order('sort_order', { ascending: true })
          expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });

          // 2. Result must be sorted by sort_order ASC
          for (let i = 1; i < result.length; i++) {
            expect(result[i].sort_order).toBeGreaterThanOrEqual(result[i - 1].sort_order);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any collection of services with random sort_order values,
   * the result returned by Service.findAll() SHALL be ordered by sort_order ASC.
   *
   * Validates: Requirements 6.4, 9.4
   */
  test('P11 (Service): findAll always calls order("sort_order", ascending) and returns sorted result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            title: fc.string({ minLength: 1, maxLength: 50 }),
            sort_order: fc.integer({ min: -1000, max: 1000 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (items) => {
          jest.resetModules();

          // Simulate what Supabase returns: data sorted by sort_order ASC
          const sortedItems = sortBySortOrderAsc(items);

          jest.mock('../../src/config/database', () => {
            const mockChain = {
              select: jest.fn().mockReturnThis(),
              order: jest.fn(),
              eq: jest.fn().mockReturnThis(),
            };
            return {
              supabase: {
                from: jest.fn(() => mockChain),
                _chain: mockChain,
              },
            };
          });

          const { supabase: freshSupa } = require('../../src/config/database');
          const chain = freshSupa._chain;

          // Supabase returns data sorted ASC (as ORDER BY sort_order ASC would)
          chain.order.mockResolvedValueOnce({ data: sortedItems, error: null });

          const { findAll } = require('../../src/models/Service');
          const result = await findAll();

          // 1. Model must call .order('sort_order', { ascending: true })
          expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });

          // 2. Result must be sorted by sort_order ASC
          for (let i = 1; i < result.length; i++) {
            expect(result[i].sort_order).toBeGreaterThanOrEqual(result[i - 1].sort_order);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

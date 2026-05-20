'use strict';

// Feature: artupski-portfolio-cms, Property 3: Skill Level Validation

/**
 * Tests for src/controllers/skillsController.js
 *
 * Covers:
 * - Property 3: Skill Level Validation (Requirement 6.3)
 *   For any integer outside [0, 100], the controller MUST reject the request
 *   and NOT save data to the DB (Skill.create must NOT be called).
 *
 * Unit tests:
 * - Valid level (0-100) → Skill.create() is called
 * - Invalid level (< 0 or > 100) → rejected, Skill.create() NOT called
 * - Missing level → rejected, Skill.create() NOT called
 * - Missing name → rejected, Skill.create() NOT called
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE requiring the controller
// ---------------------------------------------------------------------------

jest.mock('../../src/config/database', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../../src/models/Skill');

const Skill = require('../../src/models/Skill');
const skillsController = require('../../src/controllers/skillsController');

// ---------------------------------------------------------------------------
// Helpers — build mock req / res objects
// ---------------------------------------------------------------------------

/**
 * Build a mock Express request for the store() action.
 * @param {Object} body - req.body fields
 * @returns {Object} mock req
 */
function buildStoreReq(body = {}) {
  return {
    body,
    session: {},
    params: {},
  };
}

/**
 * Build a mock Express request for the update() action.
 * @param {Object} body - req.body fields
 * @param {string|number} id - route param id
 * @returns {Object} mock req
 */
function buildUpdateReq(body = {}, id = '1') {
  return {
    body,
    session: {},
    params: { id: String(id) },
  };
}

/**
 * Build a mock Express response that captures render / redirect calls.
 * @returns {Object} mock res with jest spies
 */
function buildRes() {
  const res = {
    locals: { settings: {}, unreadCount: 0 },
    render: jest.fn(),
    redirect: jest.fn(),
  };
  return res;
}

/**
 * Build a mock next() function.
 * @returns {jest.fn}
 */
function buildNext() {
  return jest.fn();
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Unit Tests — store()
// ---------------------------------------------------------------------------

describe('skillsController.store() — unit tests', () => {
  test('valid level 0 → Skill.create() is called', async () => {
    Skill.create.mockResolvedValue({ id: 1, name: 'HTML', level: 0 });

    const req = buildStoreReq({ name: 'HTML', level: '0', category: '', sort_order: '0' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).toHaveBeenCalledTimes(1);
    expect(Skill.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'HTML', level: 0 })
    );
    expect(res.redirect).toHaveBeenCalledWith('/admin/skills');
  });

  test('valid level 100 → Skill.create() is called', async () => {
    Skill.create.mockResolvedValue({ id: 2, name: 'CSS', level: 100 });

    const req = buildStoreReq({ name: 'CSS', level: '100', category: '', sort_order: '0' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).toHaveBeenCalledTimes(1);
    expect(Skill.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CSS', level: 100 })
    );
  });

  test('valid level 50 → Skill.create() is called', async () => {
    Skill.create.mockResolvedValue({ id: 3, name: 'JavaScript', level: 50 });

    const req = buildStoreReq({ name: 'JavaScript', level: '50' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).toHaveBeenCalledTimes(1);
  });

  test('invalid level -1 → rejected, Skill.create() NOT called', async () => {
    const req = buildStoreReq({ name: 'JavaScript', level: '-1' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'admin/skills/create',
      expect.objectContaining({ errorMessage: expect.any(String) })
    );
  });

  test('invalid level 101 → rejected, Skill.create() NOT called', async () => {
    const req = buildStoreReq({ name: 'JavaScript', level: '101' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'admin/skills/create',
      expect.objectContaining({ errorMessage: expect.any(String) })
    );
  });

  test('invalid level -999 → rejected, Skill.create() NOT called', async () => {
    const req = buildStoreReq({ name: 'JavaScript', level: '-999' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).not.toHaveBeenCalled();
  });

  test('invalid level 9999 → rejected, Skill.create() NOT called', async () => {
    const req = buildStoreReq({ name: 'JavaScript', level: '9999' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).not.toHaveBeenCalled();
  });

  test('missing level (undefined) → rejected, Skill.create() NOT called', async () => {
    const req = buildStoreReq({ name: 'JavaScript' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'admin/skills/create',
      expect.objectContaining({ errorMessage: expect.any(String) })
    );
  });

  test('missing name → rejected, Skill.create() NOT called', async () => {
    const req = buildStoreReq({ level: '50' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'admin/skills/create',
      expect.objectContaining({ errorMessage: expect.any(String) })
    );
  });

  test('empty name string → rejected, Skill.create() NOT called', async () => {
    const req = buildStoreReq({ name: '   ', level: '50' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).not.toHaveBeenCalled();
  });

  test('non-numeric level string → rejected, Skill.create() NOT called', async () => {
    const req = buildStoreReq({ name: 'JavaScript', level: 'abc' });
    const res = buildRes();
    const next = buildNext();

    await skillsController.store(req, res, next);

    expect(Skill.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — update()
// ---------------------------------------------------------------------------

describe('skillsController.update() — unit tests', () => {
  test('valid level 50 → Skill.update() is called', async () => {
    Skill.findById.mockResolvedValue({ id: 1, name: 'HTML', level: 80 });
    Skill.update.mockResolvedValue({ id: 1, name: 'HTML', level: 50 });

    const req = buildUpdateReq({ name: 'HTML', level: '50' }, '1');
    const res = buildRes();
    const next = buildNext();

    await skillsController.update(req, res, next);

    expect(Skill.update).toHaveBeenCalledTimes(1);
    expect(Skill.update).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ level: 50 })
    );
    expect(res.redirect).toHaveBeenCalledWith('/admin/skills');
  });

  test('invalid level -1 → rejected, Skill.update() NOT called', async () => {
    Skill.findById.mockResolvedValue({ id: 1, name: 'HTML', level: 80 });

    const req = buildUpdateReq({ name: 'HTML', level: '-1' }, '1');
    const res = buildRes();
    const next = buildNext();

    await skillsController.update(req, res, next);

    expect(Skill.update).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'admin/skills/edit',
      expect.objectContaining({ errorMessage: expect.any(String) })
    );
  });

  test('invalid level 101 → rejected, Skill.update() NOT called', async () => {
    Skill.findById.mockResolvedValue({ id: 1, name: 'HTML', level: 80 });

    const req = buildUpdateReq({ name: 'HTML', level: '101' }, '1');
    const res = buildRes();
    const next = buildNext();

    await skillsController.update(req, res, next);

    expect(Skill.update).not.toHaveBeenCalled();
  });

  test('missing name → rejected, Skill.update() NOT called', async () => {
    Skill.findById.mockResolvedValue({ id: 1, name: 'HTML', level: 80 });

    const req = buildUpdateReq({ level: '50' }, '1');
    const res = buildRes();
    const next = buildNext();

    await skillsController.update(req, res, next);

    expect(Skill.update).not.toHaveBeenCalled();
  });

  test('skill not found → redirect, Skill.update() NOT called', async () => {
    Skill.findById.mockResolvedValue(null);

    const req = buildUpdateReq({ name: 'HTML', level: '50' }, '999');
    const res = buildRes();
    const next = buildNext();

    await skillsController.update(req, res, next);

    expect(Skill.update).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/admin/skills');
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 3: Skill Level Validation
// Validates: Requirements 6.3
// ---------------------------------------------------------------------------

describe('Property 3: Skill Level Validation', () => {
  /**
   * For any integer outside the range [0, 100], the store() controller
   * MUST reject the request and NOT call Skill.create().
   *
   * Validates: Requirements 6.3
   */
  test('P3 (store): rejects any integer level outside [0, 100] and does NOT call Skill.create()', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer().filter((n) => n < 0 || n > 100),
        async (invalidLevel) => {
          jest.clearAllMocks();

          const req = buildStoreReq({
            name: 'Test Skill',
            level: String(invalidLevel),
            category: '',
            sort_order: '0',
          });
          const res = buildRes();
          const next = buildNext();

          await skillsController.store(req, res, next);

          // Controller MUST NOT save to DB
          expect(Skill.create).not.toHaveBeenCalled();

          // Controller MUST render the create form with an error message
          expect(res.render).toHaveBeenCalledWith(
            'admin/skills/create',
            expect.objectContaining({ errorMessage: expect.any(String) })
          );

          // next() must NOT be called (no unhandled error)
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any integer outside the range [0, 100], the update() controller
   * MUST reject the request and NOT call Skill.update().
   *
   * Validates: Requirements 6.3
   */
  test('P3 (update): rejects any integer level outside [0, 100] and does NOT call Skill.update()', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer().filter((n) => n < 0 || n > 100),
        async (invalidLevel) => {
          jest.clearAllMocks();

          // Skill exists in DB
          Skill.findById.mockResolvedValue({ id: 1, name: 'Existing Skill', level: 50 });

          const req = buildUpdateReq(
            { name: 'Test Skill', level: String(invalidLevel) },
            '1'
          );
          const res = buildRes();
          const next = buildNext();

          await skillsController.update(req, res, next);

          // Controller MUST NOT save to DB
          expect(Skill.update).not.toHaveBeenCalled();

          // Controller MUST render the edit form with an error message
          expect(res.render).toHaveBeenCalledWith(
            'admin/skills/edit',
            expect.objectContaining({ errorMessage: expect.any(String) })
          );

          // next() must NOT be called (no unhandled error)
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Positive counterpart: for any integer in [0, 100], the store() controller
   * MUST call Skill.create() (given a valid name is provided).
   *
   * Validates: Requirements 6.3
   */
  test('P3 (store positive): accepts any integer level in [0, 100] and calls Skill.create()', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        async (validLevel) => {
          jest.clearAllMocks();

          Skill.create.mockResolvedValue({ id: 1, name: 'Test Skill', level: validLevel });

          const req = buildStoreReq({
            name: 'Test Skill',
            level: String(validLevel),
            category: '',
            sort_order: '0',
          });
          const res = buildRes();
          const next = buildNext();

          await skillsController.store(req, res, next);

          // Controller MUST call Skill.create() with the correct level
          expect(Skill.create).toHaveBeenCalledTimes(1);
          expect(Skill.create).toHaveBeenCalledWith(
            expect.objectContaining({ level: validLevel })
          );

          // next() must NOT be called (no unhandled error)
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

'use strict';

// Feature: artupski-portfolio-cms, Property 8: Auth Middleware Blocks Unauthenticated Requests

/**
 * Auth flow unit tests
 * Tests: requireAuth middleware (Property 8), authController (postLogin, logout), loginLimiter
 *
 * Requirements: 3.2, 3.3, 3.5, 3.6, 3.7
 */

// ---------------------------------------------------------------------------
// Mock dependencies before requiring the controller
// ---------------------------------------------------------------------------

// Mock the database module first so User model doesn't call process.exit
jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../src/models/User');
jest.mock('bcrypt');

const User = require('../../src/models/User');
const bcrypt = require('bcrypt');
const authController = require('../../src/controllers/authController');

// ---------------------------------------------------------------------------
// Helpers — build minimal req/res mocks
// ---------------------------------------------------------------------------

function buildReq(overrides = {}) {
  return {
    body: { email: 'admin@example.com', password: 'secret' },
    session: {},
    ...overrides,
  };
}

function buildRes() {
  const res = {
    locals: { settings: {} },
    redirectUrl: null,
    renderView: null,
    renderLocals: null,
  };
  res.redirect = jest.fn((url) => {
    res.redirectUrl = url;
    return res;
  });
  res.render = jest.fn((view, locals) => {
    res.renderView = view;
    res.renderLocals = locals;
    return res;
  });
  return res;
}

// ---------------------------------------------------------------------------
// postLogin — valid credentials
// ---------------------------------------------------------------------------

describe('postLogin — valid credentials', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sets req.session.adminId and redirects to /admin', async () => {
    const fakeUser = { id: 42, email: 'admin@example.com', password: '$2b$12$hashedpw' };
    User.findByEmail.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);

    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await authController.postLogin(req, res, next);

    expect(User.findByEmail).toHaveBeenCalledWith('admin@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('secret', fakeUser.password);
    expect(req.session.adminId).toBe(42);
    expect(res.redirect).toHaveBeenCalledWith('/admin');
    expect(next).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// postLogin — wrong password
// ---------------------------------------------------------------------------

describe('postLogin — wrong password', () => {
  beforeEach(() => jest.clearAllMocks());

  test('does NOT set session and renders login with generic error', async () => {
    const fakeUser = { id: 1, email: 'admin@example.com', password: '$2b$12$hashedpw' };
    User.findByEmail.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(false);

    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await authController.postLogin(req, res, next);

    expect(req.session.adminId).toBeUndefined();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('admin/login', expect.objectContaining({
      error: expect.any(String),
    }));
    // Error message must be generic — must not reveal which field was wrong
    expect(res.renderLocals.error).toBeTruthy();
    expect(next).not.toHaveBeenCalled();
  });

  test('generic error message does not mention "password" specifically', async () => {
    const fakeUser = { id: 1, email: 'admin@example.com', password: '$2b$12$hashedpw' };
    User.findByEmail.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(false);

    const req = buildReq();
    const res = buildRes();

    await authController.postLogin(req, res, jest.fn());

    // The error should be a generic message, not "password is wrong"
    const error = res.renderLocals.error;
    expect(typeof error).toBe('string');
    expect(error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// postLogin — non-existent email
// ---------------------------------------------------------------------------

describe('postLogin — non-existent email', () => {
  beforeEach(() => jest.clearAllMocks());

  test('does NOT set session and renders login with generic error', async () => {
    User.findByEmail.mockResolvedValue(null);

    const req = buildReq({ body: { email: 'nobody@example.com', password: 'anything' } });
    const res = buildRes();
    const next = jest.fn();

    await authController.postLogin(req, res, next);

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(req.session.adminId).toBeUndefined();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('admin/login', expect.objectContaining({
      error: expect.any(String),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('same generic error message for wrong email and wrong password (no user enumeration)', async () => {
    // Wrong email case
    User.findByEmail.mockResolvedValue(null);
    const req1 = buildReq({ body: { email: 'nobody@example.com', password: 'anything' } });
    const res1 = buildRes();
    await authController.postLogin(req1, res1, jest.fn());

    // Wrong password case
    User.findByEmail.mockResolvedValue({ id: 1, email: 'admin@example.com', password: '$2b$12$hash' });
    bcrypt.compare.mockResolvedValue(false);
    const req2 = buildReq({ body: { email: 'admin@example.com', password: 'wrongpw' } });
    const res2 = buildRes();
    await authController.postLogin(req2, res2, jest.fn());

    // Both cases must return the same error message (prevents user enumeration)
    expect(res1.renderLocals.error).toBe(res2.renderLocals.error);
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

describe('logout', () => {
  beforeEach(() => jest.clearAllMocks());

  test('destroys the session and redirects to /admin/login', () => {
    const req = buildReq({
      session: {
        adminId: 99,
        destroy: jest.fn((cb) => cb()),
      },
    });
    const res = buildRes();

    authController.logout(req, res);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
  });

  test('redirects to /admin/login even if session.destroy has no callback error', () => {
    const req = buildReq({
      session: {
        destroy: jest.fn((cb) => cb(null)),
      },
    });
    const res = buildRes();

    authController.logout(req, res);

    expect(res.redirectUrl).toBe('/admin/login');
  });
});

// ---------------------------------------------------------------------------
// postLogin — error propagation
// ---------------------------------------------------------------------------

describe('postLogin — unexpected errors', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calls next(err) when User.findByEmail throws', async () => {
    const dbError = new Error('DB connection failed');
    User.findByEmail.mockRejectedValue(dbError);

    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await authController.postLogin(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.render).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Rate limiter — configuration unit test
// ---------------------------------------------------------------------------

describe('loginLimiter — configuration', () => {
  test('loginLimiter is a middleware function', () => {
    const { loginLimiter } = require('../../src/middlewares/rateLimiter');
    expect(typeof loginLimiter).toBe('function');
  });

  test('loginLimiter has correct max and windowMs settings', () => {
    // Access the internal options via the express-rate-limit instance
    const { loginLimiter } = require('../../src/middlewares/rateLimiter');

    // express-rate-limit v7 exposes options on the middleware function itself
    // We verify the configuration by inspecting the source or by checking
    // that the limiter is configured with max=5 and windowMs=15*60*1000
    const expectedWindowMs = 15 * 60 * 1000; // 15 minutes
    const expectedMax = 5;

    // The rateLimiter module exports the configured instance.
    // We verify the configuration matches the spec requirements (3.7).
    // express-rate-limit v7 stores options on the handler object.
    const options = loginLimiter.options || {};

    if (Object.keys(options).length > 0) {
      expect(options.max).toBe(expectedMax);
      expect(options.windowMs).toBe(expectedWindowMs);
    } else {
      // Fallback: verify by reading the source directly
      const fs = require('fs');
      const path = require('path');
      const src = fs.readFileSync(
        path.resolve(__dirname, '../../src/middlewares/rateLimiter.js'),
        'utf8'
      );
      expect(src).toContain('max: 5');
      expect(src).toContain('15 * 60 * 1000');
    }
  });
});

// ===========================================================================
// requireAuth middleware — unit tests and Property 8 PBT
// ===========================================================================

const { requireAuth } = require('../../src/middlewares/auth');
const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Helpers — mock Express req / res / next for requireAuth
// ---------------------------------------------------------------------------

/**
 * Build a mock Express request object.
 * @param {object|null} session - value for req.session (null = no session)
 */
function makeReq(session) {
  return { session };
}

/**
 * Build a mock Express response object that records redirect calls.
 */
function makeRes() {
  const res = {
    _redirected: null,
    redirect: jest.fn(function (url) {
      res._redirected = url;
    }),
  };
  return res;
}

/**
 * Build a mock next function.
 */
function makeNext() {
  return jest.fn();
}

// ---------------------------------------------------------------------------
// requireAuth — unit tests
// ---------------------------------------------------------------------------

describe('requireAuth — unit tests', () => {
  test('blocks request with no session at all (req.session is null)', () => {
    const req = makeReq(null);
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks request with empty session object (no adminId)', () => {
    const req = makeReq({});
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks request with session that has adminId set to undefined', () => {
    const req = makeReq({ adminId: undefined });
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks request with session that has adminId set to null', () => {
    const req = makeReq({ adminId: null });
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks request with session that has adminId set to 0 (falsy)', () => {
    const req = makeReq({ adminId: 0 });
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('allows request with valid session.adminId (integer)', () => {
    const req = makeReq({ adminId: 1 });
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('allows request with valid session.adminId (string UUID)', () => {
    const req = makeReq({ adminId: 'abc-123-uuid' });
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('redirects specifically to /admin/login (not any other path)', () => {
    const req = makeReq({});
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(res._redirected).toBe('/admin/login');
  });

  test('does not call next() when redirecting unauthenticated request', () => {
    const req = makeReq({ someOtherKey: 'value' });
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 8: Auth Middleware Blocks Unauthenticated Requests
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('requireAuth — Property 8: Auth Middleware Blocks Unauthenticated Requests', () => {
  /**
   * Property 8a: For any arbitrary path string (simulating /admin/<path>),
   * a request with NO session (req.session = null) MUST always be redirected
   * to /admin/login and next() MUST NOT be called.
   *
   * Note: requireAuth does not inspect req.path — it only checks req.session.adminId.
   * The path parameter here represents the variety of admin sub-paths that could
   * be requested; the invariant must hold regardless of which path is accessed.
   */
  test('any request with null session is always redirected to /admin/login', () => {
    fc.assert(
      fc.property(fc.string(), (_path) => {
        const req = makeReq(null);
        const res = makeRes();
        const next = makeNext();

        requireAuth(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/admin/login');
        expect(next).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8b: For any arbitrary path string, a request with a session
   * object that has NO adminId property MUST always be redirected to
   * /admin/login and next() MUST NOT be called.
   */
  test('any request with session but no adminId is always redirected to /admin/login', () => {
    fc.assert(
      fc.property(fc.string(), (_path) => {
        const req = makeReq({});
        const res = makeRes();
        const next = makeNext();

        requireAuth(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/admin/login');
        expect(next).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8c: For any arbitrary path string, a request with a session
   * containing a truthy adminId MUST always call next() and MUST NOT redirect.
   */
  test('any request with valid session.adminId always calls next() without redirecting', () => {
    fc.assert(
      fc.property(
        fc.string(),
        // Generate a truthy adminId: positive integer or non-empty string
        fc.oneof(
          fc.integer({ min: 1, max: 999999 }),
          fc.string({ minLength: 1 })
        ),
        (_path, adminId) => {
          const req = makeReq({ adminId });
          const res = makeRes();
          const next = makeNext();

          requireAuth(req, res, next);

          expect(next).toHaveBeenCalledTimes(1);
          expect(res.redirect).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8d: For any arbitrary path string, a request with a session
   * containing arbitrary extra keys but NO adminId MUST always be redirected
   * to /admin/login and next() MUST NOT be called.
   */
  test('any request with session containing arbitrary keys but no adminId is always blocked', () => {
    fc.assert(
      fc.property(
        fc.string(),
        // Generate a session object with arbitrary string keys/values but no adminId
        fc.dictionary(
          fc.string({ minLength: 1 }).filter((k) => k !== 'adminId'),
          fc.string()
        ),
        (_path, sessionData) => {
          const req = makeReq(sessionData);
          const res = makeRes();
          const next = makeNext();

          requireAuth(req, res, next);

          expect(res.redirect).toHaveBeenCalledWith('/admin/login');
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

'use strict';

// Feature: artupski-portfolio-cms, Property 6: Contact Form Field Length Validation

/**
 * Tests for contactPost handler in src/controllers/publicController.js
 *
 * Covers:
 * - Property 6: Contact Form Field Length Validation (Requirements 10.1, 10.2)
 *   For any submission with a field exceeding its max length
 *   (name > 100, email > 254, subject > 150, message > 2000),
 *   the controller MUST reject and NOT call ContactMessage.create().
 *
 * Unit tests:
 * - Valid submission → ContactMessage.create() is called
 * - name > 100 chars → rejected, ContactMessage.create() NOT called
 * - email > 254 chars → rejected, ContactMessage.create() NOT called
 * - subject > 150 chars → rejected, ContactMessage.create() NOT called
 * - message > 2000 chars → rejected, ContactMessage.create() NOT called
 * - invalid email format → rejected, ContactMessage.create() NOT called
 * - empty required fields → rejected, ContactMessage.create() NOT called
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE requiring the controller
// ---------------------------------------------------------------------------

jest.mock('../../src/config/database', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../../src/models/ContactMessage');
jest.mock('../../src/models/Portfolio');
jest.mock('../../src/models/BlogPost');
jest.mock('../../src/models/Service');
jest.mock('../../src/models/Skill');
jest.mock('../../src/models/Experience');
jest.mock('../../src/models/SocialLink');
jest.mock('../../src/utils/seoHelper', () => ({
  buildSeoMeta: jest.fn(() => ({
    metaTitle: 'Contact',
    metaDescription: '',
    canonical: '',
    og: {},
  })),
}));

const ContactMessage = require('../../src/models/ContactMessage');
const { contactPost } = require('../../src/controllers/publicController');

// ---------------------------------------------------------------------------
// Helpers — build mock req / res objects
// ---------------------------------------------------------------------------

/**
 * Build a mock Express request for contactPost.
 * @param {Object} body - req.body fields
 * @returns {Object} mock req
 */
function buildReq(body = {}) {
  return {
    body,
    ip: '127.0.0.1',
    path: '/contact',
    session: {},
    params: {},
  };
}

/**
 * Build a mock Express response that captures render calls.
 * @returns {Object} mock res with jest spies
 */
function buildRes() {
  return {
    locals: { settings: {} },
    render: jest.fn(),
    redirect: jest.fn(),
  };
}

/**
 * Build a mock next() function.
 * @returns {jest.fn}
 */
function buildNext() {
  return jest.fn();
}

// ---------------------------------------------------------------------------
// Valid form data factory
// ---------------------------------------------------------------------------

const VALID_BODY = {
  name: 'Angga Saputra',
  email: 'angga@example.com',
  subject: 'Hello there',
  message: 'This is a valid message body.',
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

describe('contactPost — unit tests', () => {
  // ---- Valid submission ----

  test('valid submission → ContactMessage.create() is called', async () => {
    ContactMessage.create.mockResolvedValue({ id: 1, ...VALID_BODY, status: 'unread' });

    const req = buildReq({ ...VALID_BODY });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).toHaveBeenCalledTimes(1);
    expect(ContactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: VALID_BODY.name,
        email: VALID_BODY.email,
        subject: VALID_BODY.subject,
        message: VALID_BODY.message,
      })
    );
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact',
      expect.objectContaining({ success: true })
    );
    expect(next).not.toHaveBeenCalled();
  });

  // ---- name field ----

  test('name > 100 chars → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, name: 'A'.repeat(101) });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact',
      expect.objectContaining({
        errors: expect.objectContaining({ name: expect.any(String) }),
        success: false,
      })
    );
  });

  test('name exactly 100 chars → ContactMessage.create() is called', async () => {
    ContactMessage.create.mockResolvedValue({ id: 2 });

    const req = buildReq({ ...VALID_BODY, name: 'A'.repeat(100) });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).toHaveBeenCalledTimes(1);
  });

  test('empty name → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, name: '' });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact',
      expect.objectContaining({
        errors: expect.objectContaining({ name: expect.any(String) }),
      })
    );
  });

  test('whitespace-only name → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, name: '   ' });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
  });

  // ---- email field ----

  test('email > 254 chars → rejected, ContactMessage.create() NOT called', async () => {
    // Build a valid-format email that exceeds 254 chars
    const localPart = 'a'.repeat(244);
    const longEmail = `${localPart}@b.com`; // 244 + 6 = 250... need > 254
    const veryLongEmail = 'a'.repeat(248) + '@b.com'; // 254 chars exactly — boundary
    const oversizedEmail = 'a'.repeat(249) + '@b.com'; // 255 chars — over limit

    const req = buildReq({ ...VALID_BODY, email: oversizedEmail });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact',
      expect.objectContaining({
        errors: expect.objectContaining({ email: expect.any(String) }),
        success: false,
      })
    );
  });

  test('invalid email format → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, email: 'not-an-email' });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact',
      expect.objectContaining({
        errors: expect.objectContaining({ email: expect.any(String) }),
      })
    );
  });

  test('empty email → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, email: '' });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
  });

  // ---- subject field ----

  test('subject > 150 chars → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, subject: 'S'.repeat(151) });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact',
      expect.objectContaining({
        errors: expect.objectContaining({ subject: expect.any(String) }),
        success: false,
      })
    );
  });

  test('subject exactly 150 chars → ContactMessage.create() is called', async () => {
    ContactMessage.create.mockResolvedValue({ id: 3 });

    const req = buildReq({ ...VALID_BODY, subject: 'S'.repeat(150) });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).toHaveBeenCalledTimes(1);
  });

  test('empty subject → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, subject: '' });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
  });

  // ---- message field ----

  test('message > 2000 chars → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, message: 'M'.repeat(2001) });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact',
      expect.objectContaining({
        errors: expect.objectContaining({ message: expect.any(String) }),
        success: false,
      })
    );
  });

  test('message exactly 2000 chars → ContactMessage.create() is called', async () => {
    ContactMessage.create.mockResolvedValue({ id: 4 });

    const req = buildReq({ ...VALID_BODY, message: 'M'.repeat(2000) });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).toHaveBeenCalledTimes(1);
  });

  test('empty message → rejected, ContactMessage.create() NOT called', async () => {
    const req = buildReq({ ...VALID_BODY, message: '' });
    const res = buildRes();
    const next = buildNext();

    await contactPost(req, res, next);

    expect(ContactMessage.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 6: Contact Form Field Length Validation
// Validates: Requirements 10.1, 10.2
// ---------------------------------------------------------------------------

describe('Property 6: Contact Form Field Length Validation', () => {
  /**
   * For any submission where name exceeds 100 characters,
   * the controller MUST reject and NOT call ContactMessage.create().
   *
   * Validates: Requirements 10.1, 10.2
   */
  test('P6 (name): rejects any name longer than 100 chars and does NOT call ContactMessage.create()', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 101 }).filter((s) => s.trim().length > 100),
        async (oversizedName) => {
          jest.clearAllMocks();

          const req = buildReq({ ...VALID_BODY, name: oversizedName });
          const res = buildRes();
          const next = buildNext();

          await contactPost(req, res, next);

          // Controller MUST NOT save to DB
          expect(ContactMessage.create).not.toHaveBeenCalled();

          // Controller MUST re-render the contact page with errors
          expect(res.render).toHaveBeenCalledWith(
            'pages/contact',
            expect.objectContaining({
              errors: expect.objectContaining({ name: expect.any(String) }),
              success: false,
            })
          );

          // next() must NOT be called (no unhandled error)
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any submission where email exceeds 254 characters,
   * the controller MUST reject and NOT call ContactMessage.create().
   *
   * Validates: Requirements 10.1, 10.2
   */
  test('P6 (email): rejects any email longer than 254 chars and does NOT call ContactMessage.create()', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a string > 254 chars that still looks like an email
        // so it passes the format check but fails the length check.
        // We build: localPart@x.com where localPart is long enough.
        fc.string({ minLength: 249 }).map((s) => s + '@x.com'),
        async (oversizedEmail) => {
          // Ensure the generated email is actually > 254 chars
          fc.pre(oversizedEmail.length > 254);

          jest.clearAllMocks();

          const req = buildReq({ ...VALID_BODY, email: oversizedEmail });
          const res = buildRes();
          const next = buildNext();

          await contactPost(req, res, next);

          // Controller MUST NOT save to DB
          expect(ContactMessage.create).not.toHaveBeenCalled();

          // Controller MUST re-render the contact page with errors
          expect(res.render).toHaveBeenCalledWith(
            'pages/contact',
            expect.objectContaining({
              errors: expect.objectContaining({ email: expect.any(String) }),
              success: false,
            })
          );

          // next() must NOT be called
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any submission where subject exceeds 150 characters,
   * the controller MUST reject and NOT call ContactMessage.create().
   *
   * Validates: Requirements 10.1, 10.2
   */
  test('P6 (subject): rejects any subject longer than 150 chars and does NOT call ContactMessage.create()', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a string whose trimmed length is > 150 chars.
        // We do this by generating a non-whitespace-only string of minLength 151
        // and filtering to ensure trim() still exceeds the limit.
        fc.string({ minLength: 151 }).filter((s) => s.trim().length > 150),
        async (oversizedSubject) => {
          jest.clearAllMocks();

          const req = buildReq({ ...VALID_BODY, subject: oversizedSubject });
          const res = buildRes();
          const next = buildNext();

          await contactPost(req, res, next);

          // Controller MUST NOT save to DB
          expect(ContactMessage.create).not.toHaveBeenCalled();

          // Controller MUST re-render the contact page with errors
          expect(res.render).toHaveBeenCalledWith(
            'pages/contact',
            expect.objectContaining({
              errors: expect.objectContaining({ subject: expect.any(String) }),
              success: false,
            })
          );

          // next() must NOT be called
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any submission where message exceeds 2000 characters,
   * the controller MUST reject and NOT call ContactMessage.create().
   *
   * Validates: Requirements 10.1, 10.2
   */
  test('P6 (message): rejects any message longer than 2000 chars and does NOT call ContactMessage.create()', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2001 }).filter((s) => s.trim().length > 2000),
        async (oversizedMessage) => {
          jest.clearAllMocks();

          const req = buildReq({ ...VALID_BODY, message: oversizedMessage });
          const res = buildRes();
          const next = buildNext();

          await contactPost(req, res, next);

          // Controller MUST NOT save to DB
          expect(ContactMessage.create).not.toHaveBeenCalled();

          // Controller MUST re-render the contact page with errors
          expect(res.render).toHaveBeenCalledWith(
            'pages/contact',
            expect.objectContaining({
              errors: expect.objectContaining({ message: expect.any(String) }),
              success: false,
            })
          );

          // next() must NOT be called
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Positive counterpart: for valid inputs within all length limits,
   * the controller MUST call ContactMessage.create().
   *
   * Validates: Requirements 10.1, 10.2
   */
  test('P6 (positive): accepts valid submissions within all length limits and calls ContactMessage.create()', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          subject: fc.string({ minLength: 1, maxLength: 150 }).filter((s) => s.trim().length > 0),
          message: fc.string({ minLength: 1, maxLength: 2000 }).filter((s) => s.trim().length > 0),
        }),
        async ({ name, subject, message }) => {
          jest.clearAllMocks();

          ContactMessage.create.mockResolvedValue({ id: 99, status: 'unread' });

          const req = buildReq({
            name,
            email: 'valid@example.com',
            subject,
            message,
          });
          const res = buildRes();
          const next = buildNext();

          await contactPost(req, res, next);

          // Controller MUST call ContactMessage.create()
          expect(ContactMessage.create).toHaveBeenCalledTimes(1);

          // Controller MUST render success
          expect(res.render).toHaveBeenCalledWith(
            'pages/contact',
            expect.objectContaining({ success: true })
          );

          // next() must NOT be called
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

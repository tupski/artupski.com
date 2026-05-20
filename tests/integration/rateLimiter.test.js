'use strict';

/**
 * Integration tests — Rate limiter for the contact form
 *
 * Requirements: 10.6
 *
 * Uses supertest with the real Express app.
 * DB/model dependencies are mocked so the app can start without a live database.
 *
 * contactLimiter: max 3 requests per IP per 10 minutes.
 * → The 4th POST /contact within the window must return HTTP 429.
 */

// ---------------------------------------------------------------------------
// Mock all modules that call process.exit() or require live DB credentials
// before the app is loaded.
// ---------------------------------------------------------------------------

// Mock database config — prevents process.exit() when env vars are absent
jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// Mock migrate.js — prevents process.exit() when DATABASE_URL is absent
jest.mock('../../src/database/migrate', () => ({
  runMigrations: jest.fn().mockResolvedValue(undefined),
}));

// Mock seed.js — prevents process.exit() when DB credentials are absent
jest.mock('../../src/database/seed', () => ({
  runSeed: jest.fn().mockResolvedValue(undefined),
}));

// Mock all models used by publicController so no real DB calls are made
jest.mock('../../src/models/Portfolio', () => ({
  findAll: jest.fn().mockResolvedValue([]),
  findBySlug: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/models/BlogPost', () => ({
  findAll: jest.fn().mockResolvedValue([]),
  findBySlug: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/models/Service', () => ({
  findAll: jest.fn().mockResolvedValue([]),
  findBySlug: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/models/Skill', () => ({
  findAll: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/models/Experience', () => ({
  findAll: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/models/SocialLink', () => ({
  findAll: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/models/ContactMessage', () => ({
  create: jest.fn().mockResolvedValue({ id: 1, status: 'unread' }),
  findAll: jest.fn().mockResolvedValue([]),
  countUnread: jest.fn().mockResolvedValue(0),
}));

// Mock settingsManager to avoid DB calls from injectSettings middleware
jest.mock('../../src/utils/settingsManager', () => ({
  loadSettings: jest.fn().mockResolvedValue({}),
  getSetting: jest.fn().mockReturnValue(null),
  getAllSettings: jest.fn().mockReturnValue({}),
  updateSetting: jest.fn().mockResolvedValue(undefined),
  refreshCache: jest.fn().mockResolvedValue(undefined),
  injectSettings: jest.fn((req, res, next) => {
    res.locals.settings = {};
    next();
  }),
}));

// Mock seoHelper to avoid any settings lookups
jest.mock('../../src/utils/seoHelper', () => ({
  buildSeoMeta: jest.fn(() => ({
    metaTitle: 'Test',
    metaDescription: '',
    canonical: '',
    og: {},
  })),
}));

// ---------------------------------------------------------------------------
// Load supertest and the app AFTER all mocks are in place
// ---------------------------------------------------------------------------

const request = require('supertest');
const app = require('../../src/app');

// ---------------------------------------------------------------------------
// Valid contact form body — passes all validation rules
// ---------------------------------------------------------------------------

const VALID_CONTACT_BODY = {
  name: 'Test User',
  email: 'test@example.com',
  subject: 'Integration test subject',
  message: 'This is a valid integration test message body.',
};

// ---------------------------------------------------------------------------
// Helper: POST /contact with the given body
// ---------------------------------------------------------------------------

function postContact(body = VALID_CONTACT_BODY) {
  // Do NOT set X-Forwarded-For — trust proxy is disabled in the app,
  // so express-rate-limit uses req.ip (127.0.0.1 from supertest) directly.
  return request(app)
    .post('/contact')
    .send(body)
    .type('form');
}

// ---------------------------------------------------------------------------
// Rate limiter integration tests
// ---------------------------------------------------------------------------

describe('Contact form rate limiter (contactLimiter)', () => {
  /**
   * Test: The first 3 POST /contact requests within the window succeed (not 429).
   *
   * contactLimiter allows max 3 requests per IP per 10 minutes.
   * Requests 1–3 must return 200 (rendered page) or 302 (redirect), never 429.
   *
   * Requirements: 10.6
   */
  test('first 3 requests within the window are not rate-limited', async () => {
    for (let i = 1; i <= 3; i++) {
      const res = await postContact();
      expect(res.status).not.toBe(429);
    }
  });

  /**
   * Test: The 4th POST /contact within 10 minutes returns HTTP 429.
   *
   * After 3 allowed requests the rate limiter must block the next one.
   *
   * Requirements: 10.6
   */
  test('4th request within the window returns HTTP 429', async () => {
    // Requests 1–3 consume the quota (may already be consumed by the previous test
    // since express-rate-limit state is in-memory and shared within the same process).
    // We send up to 3 more to ensure the bucket is definitely exhausted, then check
    // that the next one is blocked.
    for (let i = 0; i < 3; i++) {
      await postContact();
    }

    // This request must be blocked
    const res = await postContact();
    expect(res.status).toBe(429);
  });

  /**
   * Test: The 429 response body contains the expected rate-limit message.
   *
   * Requirements: 10.6
   */
  test('429 response includes the rate-limit message', async () => {
    // Exhaust the quota
    for (let i = 0; i < 3; i++) {
      await postContact();
    }

    const res = await postContact();
    expect(res.status).toBe(429);

    // express-rate-limit v7 sends the message as plain text in res.text
    // The message is set in rateLimiter.js: 'Terlalu banyak pesan dikirim...'
    expect(res.text).toMatch(/terlalu banyak/i);
  });
});

// ---------------------------------------------------------------------------
// Sanity check: rate limiter does NOT affect non-contact routes
// ---------------------------------------------------------------------------

describe('Rate limiter scope', () => {
  /**
   * Test: GET /contact is not affected by the contactLimiter.
   *
   * The contactLimiter is only applied to POST /contact.
   * GET requests must always succeed regardless of POST quota.
   *
   * Requirements: 10.6
   */
  test('GET /contact is never rate-limited by contactLimiter', async () => {
    // Make many GET requests — none should be blocked by contactLimiter
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/contact');
      // Should render the page (200) — not 429
      expect(res.status).not.toBe(429);
    }
  });
});

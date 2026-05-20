'use strict';

// Feature: artupski-portfolio-cms, Property 7: Contact Message Status on Creation
// Feature: artupski-portfolio-cms, Property 13: Unread Badge Count Accuracy

/**
 * Tests for src/models/ContactMessage.js
 *
 * Covers:
 * - Property 7: Contact Message Status on Creation (Requirements 10.3)
 * - Property 13: Unread Badge Count Accuracy (Requirements 10.10, 10.11, 10.12)
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Mock Supabase client BEFORE requiring the module under test
// ---------------------------------------------------------------------------

jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Re-require fresh module before each test to avoid state leakage
// ---------------------------------------------------------------------------

let ContactMessage;
let mockSupabase;

beforeEach(() => {
  jest.resetModules();

  jest.mock('../../src/config/database', () => ({
    supabase: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    },
  }));

  mockSupabase = require('../../src/config/database').supabase;
  ContactMessage = require('../../src/models/ContactMessage');
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Unit Tests — create()
// ---------------------------------------------------------------------------

describe('ContactMessage.create — unit tests', () => {
  test('stores status as "unread" when no status is provided', async () => {
    const inputData = {
      name: 'Budi Santoso',
      email: 'budi@example.com',
      subject: 'Pertanyaan',
      message: 'Halo, saya ingin bertanya.',
    };

    const expectedRecord = { id: 1, ...inputData, status: 'unread' };
    mockSupabase.single.mockResolvedValueOnce({ data: expectedRecord, error: null });

    const result = await ContactMessage.create(inputData);

    // Verify insert was called with status = 'unread'
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ status: 'unread' }),
    ]);
    expect(result.status).toBe('unread');
  });

  test('overrides caller-supplied status = "read" with "unread"', async () => {
    const inputData = {
      name: 'Siti Rahayu',
      email: 'siti@example.com',
      subject: 'Test',
      message: 'Test message',
      status: 'read', // caller tries to set read — must be overridden
    };

    const expectedRecord = { id: 2, ...inputData, status: 'unread' };
    mockSupabase.single.mockResolvedValueOnce({ data: expectedRecord, error: null });

    await ContactMessage.create(inputData);

    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ status: 'unread' }),
    ]);
  });

  test('throws when Supabase returns an error', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'insert failed' },
    });

    await expect(
      ContactMessage.create({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Subject',
        message: 'Message',
      })
    ).rejects.toMatchObject({ message: 'insert failed' });
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — countUnread()
// ---------------------------------------------------------------------------

describe('ContactMessage.countUnread — unit tests', () => {
  test('returns the count from Supabase', async () => {
    // countUnread uses select with head:true — the chain ends without .single()
    // We need to mock the final .eq() call to return { count, error }
    mockSupabase.eq.mockResolvedValueOnce({ count: 5, error: null });

    const result = await ContactMessage.countUnread();

    expect(result).toBe(5);
  });

  test('returns 0 when count is null', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ count: null, error: null });

    const result = await ContactMessage.countUnread();

    expect(result).toBe(0);
  });

  test('returns 0 when there are no unread messages', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ count: 0, error: null });

    const result = await ContactMessage.countUnread();

    expect(result).toBe(0);
  });

  test('throws when Supabase returns an error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({
      count: null,
      error: { message: 'query failed' },
    });

    await expect(ContactMessage.countUnread()).rejects.toMatchObject({ message: 'query failed' });
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 7: Contact Message Status on Creation
// Validates: Requirements 10.3
// ---------------------------------------------------------------------------

describe('ContactMessage.create — Property 7: Contact Message Status on Creation', () => {
  /**
   * For any valid contact form data (name, email, subject, message),
   * regardless of what data.status is, the insert payload must always
   * have status = 'unread'.
   *
   * Validates: Requirements 10.3
   */
  test('P7: create() always inserts with status = "unread" regardless of input status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          email: fc.string({ minLength: 1, maxLength: 254 }),
          subject: fc.string({ minLength: 1, maxLength: 150 }),
          message: fc.string({ minLength: 1, maxLength: 2000 }),
          // status can be anything the caller might supply — must always be overridden
          status: fc.constantFrom('read', 'unread', undefined, null),
        }),
        async (contactData) => {
          jest.resetModules();

          jest.mock('../../src/config/database', () => ({
            supabase: {
              from: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnThis(),
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            },
          }));

          const { supabase: freshSupa } = require('../../src/config/database');
          const { create } = require('../../src/models/ContactMessage');

          // Mock successful insert — return the data with status forced to 'unread'
          const returnedRecord = { id: 1, ...contactData, status: 'unread' };
          freshSupa.single.mockResolvedValueOnce({ data: returnedRecord, error: null });

          await create(contactData);

          // The insert call must always receive a payload with status = 'unread'
          expect(freshSupa.insert).toHaveBeenCalledWith([
            expect.objectContaining({ status: 'unread' }),
          ]);

          // The insert payload must NOT contain any other status value
          const insertCallArgs = freshSupa.insert.mock.calls[0][0];
          expect(insertCallArgs[0].status).toBe('unread');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 13: Unread Badge Count Accuracy
// Validates: Requirements 10.10, 10.11, 10.12
// ---------------------------------------------------------------------------

describe('ContactMessage.countUnread — Property 13: Unread Badge Count Accuracy', () => {
  /**
   * For any state of the contact_messages table, countUnread() must return
   * the exact count of records with status = 'unread'.
   *
   * We mock Supabase's count query to return a specific count value and verify
   * that countUnread() returns that exact value unchanged.
   *
   * Validates: Requirements 10.10, 10.11, 10.12
   */
  test('P13: countUnread() returns the exact count provided by Supabase', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        async (unreadCount) => {
          jest.resetModules();

          jest.mock('../../src/config/database', () => ({
            supabase: {
              from: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnThis(),
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            },
          }));

          const { supabase: freshSupa } = require('../../src/config/database');
          const { countUnread } = require('../../src/models/ContactMessage');

          // Mock Supabase count query: .select('*', { count: 'exact', head: true }).eq('status', 'unread')
          // The final .eq() call resolves with { count, error }
          freshSupa.eq.mockResolvedValueOnce({ count: unreadCount, error: null });

          const result = await countUnread();

          // countUnread() must return the exact count from Supabase
          expect(result).toBe(unreadCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('P13: countUnread() returns 0 (not null/undefined) when Supabase count is 0', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(0),
        async (zeroCount) => {
          jest.resetModules();

          jest.mock('../../src/config/database', () => ({
            supabase: {
              from: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnThis(),
              delete: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              single: jest.fn(),
            },
          }));

          const { supabase: freshSupa } = require('../../src/config/database');
          const { countUnread } = require('../../src/models/ContactMessage');

          freshSupa.eq.mockResolvedValueOnce({ count: zeroCount, error: null });

          const result = await countUnread();

          // When count is 0, badge should be hidden — result must be exactly 0
          expect(result).toBe(0);
          expect(typeof result).toBe('number');
        }
      ),
      { numRuns: 10 }
    );
  });
});

'use strict';

// Feature: artupski-portfolio-cms, Property 5: Settings Round-Trip

/**
 * Tests for src/utils/settingsManager.js
 *
 * Covers:
 * - Unit tests for loadSettings, getSetting, getAllSettings, refreshCache, injectSettings
 * - Property 5: Settings Round-Trip (Requirements 5.1, 5.3)
 */

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Mock Supabase client BEFORE requiring the module under test
// ---------------------------------------------------------------------------

jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn(),
    upsert: jest.fn(),
  },
}));

const { supabase } = require('../../src/config/database');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Configure the mock so that supabase.from('settings').select('key, value')
 * resolves with the given rows array.
 */
function mockSelectReturns(rows) {
  supabase.select.mockResolvedValueOnce({ data: rows, error: null });
}

/**
 * Configure the mock so that supabase.from('settings').select('key, value')
 * resolves with an error.
 */
function mockSelectFails(message = 'DB error') {
  supabase.select.mockResolvedValueOnce({ data: null, error: { message } });
}

/**
 * Configure the mock so that supabase.from('settings').update({value}).eq('key', key)
 * resolves successfully (no error).
 */
function mockUpdateSucceeds() {
  supabase.eq.mockResolvedValueOnce({ error: null });
}

/**
 * Configure the mock so that supabase.from('settings').update({value}).eq('key', key)
 * resolves with an error.
 */
function mockUpdateFails(message = 'Update error') {
  supabase.eq.mockResolvedValueOnce({ error: { message } });
}

// ---------------------------------------------------------------------------
// Re-require the module fresh before each test to reset the module-level cache
// ---------------------------------------------------------------------------

let loadSettings;
let getSetting;
let getAllSettings;
let updateSetting;
let refreshCache;
let injectSettings;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  // Re-apply the mock after resetModules
  jest.mock('../../src/config/database', () => ({
    supabase: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn(),
      upsert: jest.fn(),
    },
  }));

  // Re-require fresh instances
  const db = require('../../src/config/database');
  // Reassign mock helpers to the fresh supabase mock
  supabase.from = db.supabase.from;
  supabase.select = db.supabase.select;
  supabase.update = db.supabase.update;
  supabase.eq = db.supabase.eq;
  supabase.upsert = db.supabase.upsert;

  const sm = require('../../src/utils/settingsManager');
  loadSettings = sm.loadSettings;
  getSetting = sm.getSetting;
  getAllSettings = sm.getAllSettings;
  updateSetting = sm.updateSetting;
  refreshCache = sm.refreshCache;
  injectSettings = sm.injectSettings;
});

// ---------------------------------------------------------------------------
// Unit Tests — loadSettings
// ---------------------------------------------------------------------------

describe('loadSettings — unit tests', () => {
  test('populates cache from DB rows', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({
      data: [
        { key: 'site_name', value: 'Artupski' },
        { key: 'tagline', value: 'Web Developer' },
      ],
      error: null,
    });

    await loadSettings();

    expect(await getSetting('site_name')).toBe('Artupski');
    expect(await getSetting('tagline')).toBe('Web Developer');
  });

  test('clears existing cache entries before loading', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');

    // First load
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'old_key', value: 'old_value' }],
      error: null,
    });
    await loadSettings();
    expect(await getSetting('old_key')).toBe('old_value');

    // Second load with different data — old_key should be gone
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'new_key', value: 'new_value' }],
      error: null,
    });
    await loadSettings();

    expect(await getSetting('old_key')).toBeNull();
    expect(await getSetting('new_key')).toBe('new_value');
  });

  test('handles empty data array without error', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({ data: [], error: null });

    await expect(loadSettings()).resolves.toBeUndefined();
  });

  test('throws when DB returns an error', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({
      data: null,
      error: { message: 'connection refused' },
    });

    await expect(loadSettings()).rejects.toThrow('connection refused');
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — getSetting
// ---------------------------------------------------------------------------

describe('getSetting — unit tests', () => {
  test('returns null for a key not in cache', async () => {
    expect(await getSetting('nonexistent_key')).toBeNull();
  });

  test('returns the correct value for a cached key', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'contact_email', value: 'hello@artupski.com' }],
      error: null,
    });
    await loadSettings();

    expect(await getSetting('contact_email')).toBe('hello@artupski.com');
  });

  test('returns null for a key that was not in the loaded data', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'Artupski' }],
      error: null,
    });
    await loadSettings();

    expect(await getSetting('missing_key')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — getAllSettings
// ---------------------------------------------------------------------------

describe('getAllSettings — unit tests', () => {
  test('returns a copy of the full cache', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({
      data: [
        { key: 'site_name', value: 'Artupski' },
        { key: 'tagline', value: 'Web Dev' },
      ],
      error: null,
    });
    await loadSettings();

    const all = await getAllSettings();
    expect(all).toEqual({ site_name: 'Artupski', tagline: 'Web Dev' });
  });

  test('returns a shallow copy — mutating result does not affect cache', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'Artupski' }],
      error: null,
    });
    await loadSettings();

    const all = await getAllSettings();
    all.site_name = 'MUTATED';

    // Original cache should be unaffected
    expect(await getSetting('site_name')).toBe('Artupski');
  });

  test('auto-loads from DB when cache is empty', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'footer_text', value: '© 2024 Artupski' }],
      error: null,
    });

    // Cache is empty at this point — getAllSettings should trigger loadSettings
    const all = await getAllSettings();
    expect(all).toEqual({ footer_text: '© 2024 Artupski' });
    expect(mockSupa.select).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — refreshCache
// ---------------------------------------------------------------------------

describe('refreshCache — unit tests', () => {
  test('reloads settings from DB', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');

    // Initial load
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'Old Name' }],
      error: null,
    });
    await loadSettings();
    expect(await getSetting('site_name')).toBe('Old Name');

    // Refresh with updated data
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'New Name' }],
      error: null,
    });
    await refreshCache();
    expect(await getSetting('site_name')).toBe('New Name');
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — updateSetting
// ---------------------------------------------------------------------------

describe('updateSetting — unit tests', () => {
  test('updates DB and refreshes cache on success', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');

    // Initial load
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'Old Name' }],
      error: null,
    });
    await loadSettings();

    // Mock update success + cache refresh
    mockSupa.eq.mockResolvedValueOnce({ error: null });
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'New Name' }],
      error: null,
    });

    await updateSetting('site_name', 'New Name');
    expect(await getSetting('site_name')).toBe('New Name');
  });

  test('retries once on first failure and succeeds on second attempt', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');

    // Initial load
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'Old' }],
      error: null,
    });
    await loadSettings();

    // First attempt fails, second succeeds
    mockSupa.eq
      .mockResolvedValueOnce({ error: { message: 'transient error' } })
      .mockResolvedValueOnce({ error: null });

    // Cache refresh after successful second attempt
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'Retried' }],
      error: null,
    });

    await expect(updateSetting('site_name', 'Retried')).resolves.toBeUndefined();
    expect(await getSetting('site_name')).toBe('Retried');
  });

  test('throws after two consecutive failures', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');

    mockSupa.select.mockResolvedValueOnce({ data: [], error: null });
    await loadSettings();

    mockSupa.eq
      .mockResolvedValueOnce({ error: { message: 'fail 1' } })
      .mockResolvedValueOnce({ error: { message: 'fail 2' } });

    await expect(updateSetting('site_name', 'value')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — injectSettings middleware
// ---------------------------------------------------------------------------

describe('injectSettings — unit tests', () => {
  test('injects settings into res.locals.settings and calls next()', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');
    mockSupa.select.mockResolvedValueOnce({
      data: [{ key: 'site_name', value: 'Artupski' }],
      error: null,
    });
    await loadSettings();

    // getAllSettings will use the already-populated cache (no extra select call)
    const req = {};
    const res = { locals: {} };
    const next = jest.fn();

    await injectSettings(req, res, next);

    expect(res.locals.settings).toEqual({ site_name: 'Artupski' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // called with no arguments (no error)
  });

  test('falls back to empty object and still calls next() when getAllSettings throws', async () => {
    const { supabase: mockSupa } = require('../../src/config/database');

    // getAllSettings will try to loadSettings (cache is empty), which will fail
    mockSupa.select.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB unavailable' },
    });

    const req = {};
    const res = { locals: {} };
    const next = jest.fn();

    await injectSettings(req, res, next);

    expect(res.locals.settings).toEqual({});
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // must not pass error to next
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 5: Settings Round-Trip
// Validates: Requirements 5.1, 5.3
// ---------------------------------------------------------------------------

describe('updateSetting / getSetting — Property 5: Settings Round-Trip', () => {
  /**
   * For any key and value, updateSetting(key, val) followed by getSetting(key)
   * must return exactly the same value that was saved.
   *
   * Validates: Requirements 5.1, 5.3
   */
  test('P5: getSetting returns the exact value saved by updateSetting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }), // key — non-empty string
        fc.string(),                  // value — any string
        async (key, value) => {
          // Reset modules to get a fresh cache for each run
          jest.resetModules();
          jest.mock('../../src/config/database', () => ({
            supabase: {
              from: jest.fn().mockReturnThis(),
              select: jest.fn(),
              update: jest.fn().mockReturnThis(),
              eq: jest.fn(),
              upsert: jest.fn(),
            },
          }));

          const { supabase: freshSupa } = require('../../src/config/database');
          const {
            loadSettings: freshLoad,
            getSetting: freshGet,
            updateSetting: freshUpdate,
          } = require('../../src/utils/settingsManager');

          // Seed the cache with the key so refreshCache can return the updated value
          freshSupa.select.mockResolvedValueOnce({
            data: [{ key, value: 'initial' }],
            error: null,
          });
          await freshLoad();

          // Mock: update succeeds
          freshSupa.eq.mockResolvedValueOnce({ error: null });

          // Mock: refreshCache (called inside updateSetting) returns the new value
          freshSupa.select.mockResolvedValueOnce({
            data: [{ key, value }],
            error: null,
          });

          await freshUpdate(key, value);

          const retrieved = await freshGet(key);
          expect(retrieved).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });
});

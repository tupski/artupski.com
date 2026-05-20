'use strict';

// Feature: artupski-portfolio-cms, Property 9: Password Storage Security

const fc = require('fast-check');
const bcrypt = require('bcrypt');

// ---------------------------------------------------------------------------
// Mock Supabase client before requiring User model
// ---------------------------------------------------------------------------

const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock('../../src/config/database', () => ({
  supabase: {
    from: mockFrom,
  },
}));

const User = require('../../src/models/User');

// Use low salt rounds in tests for speed — the security properties hold regardless of rounds.
// Production uses 12 rounds (see src/database/seed.js).
const BCRYPT_SALT_ROUNDS = 4;

// ---------------------------------------------------------------------------
// Unit tests — bcrypt hashing behavior
// ---------------------------------------------------------------------------

describe('bcrypt hashing — unit tests', () => {
  test('hash starts with $2b$ (bcrypt identifier)', async () => {
    const hash = await bcrypt.hash('mypassword', BCRYPT_SALT_ROUNDS);
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  test('hash is not equal to the plaintext password', async () => {
    const password = 'supersecret123';
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    expect(hash).not.toBe(password);
  });

  test('bcrypt.compare returns true for correct password', async () => {
    const password = 'correcthorsebatterystaple';
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const result = await bcrypt.compare(password, hash);
    expect(result).toBe(true);
  });

  test('bcrypt.compare returns false for wrong password', async () => {
    const password = 'correctpassword';
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const result = await bcrypt.compare('wrongpassword', hash);
    expect(result).toBe(false);
  });

  test('two hashes of the same password are different (salt randomness)', async () => {
    const password = 'samepassword';
    const hash1 = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const hash2 = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    expect(hash1).not.toBe(hash2);
    // But both must verify correctly
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 9: Password Storage Security
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------

describe('bcrypt — Property 9: Password Storage Security', () => {
  /**
   * Property 9a: For any non-empty password string, the bcrypt hash
   * MUST start with '$2b$' or '$2a$' (valid bcrypt identifier).
   */
  test('hash always starts with $2b$ or $2a$ for any password', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (password) => {
        const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        expect(hash).toMatch(/^\$2[ab]\$/);
      }),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 9b: For any non-empty password string, the stored hash
   * MUST NOT equal the plaintext password.
   */
  test('hash is never equal to the plaintext password', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (password) => {
        const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        expect(hash).not.toBe(password);
      }),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 9c: For any non-empty password string, bcrypt.compare(plaintext, hash)
   * MUST return true — the hash is always verifiable against the original password.
   */
  test('hash is always verifiable with bcrypt.compare(plaintext, hash)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (password) => {
        const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const isValid = await bcrypt.compare(password, hash);
        expect(isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 9d: For any non-empty password string and any different string,
   * bcrypt.compare(wrongPassword, hash) MUST return false.
   */
  test('hash never verifies against a different password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (password, wrongPassword) => {
          // Only test when the two strings are actually different
          fc.pre(password !== wrongPassword);
          const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
          const isValid = await bcrypt.compare(wrongPassword, hash);
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});

// ---------------------------------------------------------------------------
// Unit tests — User.create() stores hash, not plaintext
// ---------------------------------------------------------------------------

describe('User.create() — password storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('User.create() stores the data passed to it (hash, not plaintext)', async () => {
    const password = 'plaintextpassword';
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const userData = {
      email: 'admin@example.com',
      password: hash,
      name: 'Admin User',
    };

    const createdUser = { id: 1, ...userData };
    mockSingle.mockResolvedValue({ data: createdUser, error: null });

    const result = await User.create(userData);

    // Verify supabase.from('users').insert([data]).select().single() was called
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockInsert).toHaveBeenCalledWith([userData]);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled();

    // The stored password must be the hash, not the plaintext
    expect(result.password).toBe(hash);
    expect(result.password).not.toBe(password);
    expect(result.password).toMatch(/^\$2[ab]\$/);
  });

  test('User.create() stored password is verifiable with bcrypt.compare', async () => {
    const password = 'securepassword456';
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const userData = {
      email: 'user@example.com',
      password: hash,
      name: 'Test User',
    };

    mockSingle.mockResolvedValue({ data: { id: 2, ...userData }, error: null });

    const result = await User.create(userData);

    // The stored hash must verify correctly against the original plaintext
    const isValid = await bcrypt.compare(password, result.password);
    expect(isValid).toBe(true);
  });

  test('User.create() throws when supabase returns an error', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'duplicate key value violates unique constraint' },
    });

    await expect(
      User.create({ email: 'dup@example.com', password: 'hash', name: 'Dup' })
    ).rejects.toMatchObject({ message: 'duplicate key value violates unique constraint' });
  });
});

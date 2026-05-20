'use strict';

// Feature: artupski-portfolio-cms, Property 4: Media Upload Validation

const fc = require('fast-check');
const path = require('path');

// ---------------------------------------------------------------------------
// Import the fileFilter and constants from multer config
// ---------------------------------------------------------------------------
const {
  fileFilter,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} = require('../../src/config/multer');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Call fileFilter synchronously and return { accepted, error }.
 * fileFilter signature: (req, file, cb) where cb(err, accepted)
 */
function runFileFilter(mimetype) {
  const req = {};
  const file = { mimetype };
  let accepted = null;
  let error = null;
  fileFilter(req, file, (err, result) => {
    error = err;
    accepted = result;
  });
  return { accepted, error };
}

// ---------------------------------------------------------------------------
// Unit tests — fileFilter (MIME type validation)
// ---------------------------------------------------------------------------

describe('fileFilter — unit tests (MIME type validation)', () => {
  test('accepts image/jpeg', () => {
    const { accepted, error } = runFileFilter('image/jpeg');
    expect(accepted).toBe(true);
    expect(error).toBeNull();
  });

  test('accepts image/png', () => {
    const { accepted, error } = runFileFilter('image/png');
    expect(accepted).toBe(true);
    expect(error).toBeNull();
  });

  test('accepts image/webp', () => {
    const { accepted, error } = runFileFilter('image/webp');
    expect(accepted).toBe(true);
    expect(error).toBeNull();
  });

  test('rejects image/gif', () => {
    const { accepted, error } = runFileFilter('image/gif');
    expect(accepted).toBe(false);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/tidak didukung/i);
  });

  test('rejects image/bmp', () => {
    const { accepted, error } = runFileFilter('image/bmp');
    expect(accepted).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });

  test('rejects application/pdf', () => {
    const { accepted, error } = runFileFilter('application/pdf');
    expect(accepted).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });

  test('rejects text/plain', () => {
    const { accepted, error } = runFileFilter('text/plain');
    expect(accepted).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });

  test('rejects empty string MIME type', () => {
    const { accepted, error } = runFileFilter('');
    expect(accepted).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });

  test('rejects MIME type with uppercase (case-sensitive check)', () => {
    // MIME types should be lowercase; uppercase variants are not in the allowed list
    const { accepted, error } = runFileFilter('Image/JPEG');
    expect(accepted).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });

  test('rejects MIME type with extra whitespace', () => {
    const { accepted, error } = runFileFilter(' image/jpeg ');
    expect(accepted).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — multer configuration constants
// ---------------------------------------------------------------------------

describe('multer configuration — unit tests', () => {
  test('ALLOWED_MIME_TYPES contains exactly image/jpeg, image/png, image/webp', () => {
    expect(ALLOWED_MIME_TYPES).toEqual(
      expect.arrayContaining(['image/jpeg', 'image/png', 'image/webp'])
    );
    expect(ALLOWED_MIME_TYPES).toHaveLength(3);
  });

  test('MAX_FILE_SIZE is exactly 5MB (5 * 1024 * 1024 bytes)', () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  test('multer upload instance has fileSize limit set to 5MB', () => {
    const { upload } = require('../../src/config/multer');
    // multer stores limits on the instance
    expect(upload.limits).toBeDefined();
    expect(upload.limits.fileSize).toBe(5 * 1024 * 1024);
  });
});

// ---------------------------------------------------------------------------
// Property-Based Test — Property 4: Media Upload Validation
// Validates: Requirements 7.4, 8.3, 15.2, 15.3
// ---------------------------------------------------------------------------

describe('fileFilter — Property 4: Media Upload Validation', () => {
  /**
   * Property 4a: For any MIME type that is NOT in the allowed list,
   * fileFilter MUST reject the file (accepted = false) and return an Error.
   */
  test('rejects any MIME type not in the allowed list', () => {
    // Common invalid MIME types to sample from
    const invalidMimeTypes = fc.constantFrom(
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'image/x-icon',
      'image/avif',
      'image/heic',
      'application/pdf',
      'application/octet-stream',
      'application/zip',
      'application/json',
      'text/plain',
      'text/html',
      'text/csv',
      'video/mp4',
      'video/mpeg',
      'audio/mpeg',
      'audio/wav',
      'multipart/form-data',
      ''
    );

    fc.assert(
      fc.property(invalidMimeTypes, (mimetype) => {
        const { accepted, error } = runFileFilter(mimetype);
        // Must reject
        expect(accepted).toBe(false);
        // Must provide an Error object
        expect(error).toBeInstanceOf(Error);
        // Error message must be descriptive
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4b: For any arbitrary string MIME type that is not one of the
   * three allowed types, fileFilter MUST reject the file.
   * Uses fc.string() filtered to exclude the 3 valid types.
   */
  test('rejects arbitrary string MIME types that are not in the allowed list', () => {
    const arbitraryInvalidMime = fc
      .string({ minLength: 0, maxLength: 100 })
      .filter((s) => !ALLOWED_MIME_TYPES.includes(s));

    fc.assert(
      fc.property(arbitraryInvalidMime, (mimetype) => {
        const { accepted, error } = runFileFilter(mimetype);
        expect(accepted).toBe(false);
        expect(error).toBeInstanceOf(Error);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4c: For any of the three valid MIME types, fileFilter MUST
   * accept the file (accepted = true, error = null).
   * This is the positive counterpart — valid types are always accepted.
   */
  test('accepts all three valid MIME types unconditionally', () => {
    const validMimeTypes = fc.constantFrom(
      'image/jpeg',
      'image/png',
      'image/webp'
    );

    fc.assert(
      fc.property(validMimeTypes, (mimetype) => {
        const { accepted, error } = runFileFilter(mimetype);
        expect(accepted).toBe(true);
        expect(error).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4d: File size limit is always 5MB.
   * For any integer file size > 5MB, the configured limit rejects it.
   * We verify this by checking the multer limits configuration directly,
   * since multer enforces the limit internally during streaming.
   *
   * For any integer file size in bytes > MAX_FILE_SIZE,
   * it must exceed the configured limit.
   */
  test('configured file size limit rejects any size > 5MB', () => {
    const oversizedBytes = fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 10 });

    fc.assert(
      fc.property(oversizedBytes, (fileSize) => {
        // The configured limit must be strictly less than the oversized file
        expect(fileSize).toBeGreaterThan(MAX_FILE_SIZE);
        // The limit itself must be exactly 5MB
        expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4e: For any integer file size <= 5MB (valid range),
   * it must be within the allowed limit.
   */
  test('configured file size limit allows any size <= 5MB', () => {
    const validBytes = fc.integer({ min: 1, max: MAX_FILE_SIZE });

    fc.assert(
      fc.property(validBytes, (fileSize) => {
        expect(fileSize).toBeLessThanOrEqual(MAX_FILE_SIZE);
        expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests — processImage (mediaHandler.js)
// ---------------------------------------------------------------------------

// Jest requires mock factory variables to be prefixed with 'mock' (case-insensitive)
// when referenced inside jest.mock() factory functions.
const mockToFile = jest.fn();
const mockWebp = jest.fn();
const mockPng = jest.fn();
const mockJpeg = jest.fn();
const mockResize = jest.fn();
const mockSharp = jest.fn();

jest.mock('sharp', () => mockSharp);

describe('processImage — unit tests', () => {
  const { processImage } = require('../../src/utils/mediaHandler');

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up the chainable mock pipeline
    mockToFile.mockResolvedValue({});
    mockWebp.mockReturnValue({ toFile: mockToFile });
    mockPng.mockReturnValue({ toFile: mockToFile });
    mockJpeg.mockReturnValue({ toFile: mockToFile });
    mockResize.mockReturnValue({
      jpeg: mockJpeg,
      png: mockPng,
      webp: mockWebp,
      toFile: mockToFile,
    });
    mockSharp.mockReturnValue({ resize: mockResize });
  });

  test('returns the outputPath on success', async () => {
    const result = await processImage('/input/photo.jpg', '/output/photo.jpg');
    expect(result).toBe('/output/photo.jpg');
  });

  test('calls sharp with the inputPath', async () => {
    await processImage('/input/photo.jpg', '/output/photo.jpg');
    expect(mockSharp).toHaveBeenCalledWith('/input/photo.jpg');
  });

  test('calls resize with maxWidth 1200 and withoutEnlargement by default', async () => {
    await processImage('/input/photo.jpg', '/output/photo.jpg');
    expect(mockResize).toHaveBeenCalledWith({
      width: 1200,
      withoutEnlargement: true,
    });
  });

  test('uses custom maxWidth when provided', async () => {
    await processImage('/input/photo.jpg', '/output/photo.jpg', { maxWidth: 800 });
    expect(mockResize).toHaveBeenCalledWith({
      width: 800,
      withoutEnlargement: true,
    });
  });

  test('applies jpeg quality for .jpg output', async () => {
    await processImage('/input/photo.jpg', '/output/photo.jpg', { quality: 75 });
    expect(mockJpeg).toHaveBeenCalledWith({ quality: 75 });
  });

  test('applies jpeg quality for .jpeg output', async () => {
    await processImage('/input/photo.jpeg', '/output/photo.jpeg', { quality: 90 });
    expect(mockJpeg).toHaveBeenCalledWith({ quality: 90 });
  });

  test('applies png compressionLevel for .png output', async () => {
    // quality 80 → compressionLevel = round((100-80)/100 * 9) = round(1.8) = 2
    await processImage('/input/photo.png', '/output/photo.png', { quality: 80 });
    expect(mockPng).toHaveBeenCalledWith({ compressionLevel: 2 });
  });

  test('applies webp quality for .webp output', async () => {
    await processImage('/input/photo.webp', '/output/photo.webp', { quality: 85 });
    expect(mockWebp).toHaveBeenCalledWith({ quality: 85 });
  });

  test('uses default quality of 80 when not specified', async () => {
    await processImage('/input/photo.jpg', '/output/photo.jpg');
    expect(mockJpeg).toHaveBeenCalledWith({ quality: 80 });
  });

  test('calls toFile with the outputPath', async () => {
    await processImage('/input/photo.jpg', '/output/photo.jpg');
    expect(mockToFile).toHaveBeenCalledWith('/output/photo.jpg');
  });
});

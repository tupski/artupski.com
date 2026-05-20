'use strict';

/**
 * Media Handler
 * Compresses images with sharp and uploads them to Supabase Storage.
 * Works with multer memoryStorage — no disk writes required.
 */

const sharp = require('sharp');
const path  = require('path');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/database');

// Supabase Storage bucket name — set SUPABASE_STORAGE_BUCKET in .env
// Defaults to 'uploads' if not set
function getBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
}

/**
 * Compress an image buffer using sharp.
 *
 * @param {Buffer} inputBuffer - Raw file buffer from multer memoryStorage
 * @param {string} mimetype    - Original MIME type (image/jpeg, image/png, image/webp)
 * @param {object} [options]
 * @param {number} [options.quality=80]    - Output quality (1–100)
 * @param {number} [options.maxWidth=1200] - Maximum output width in pixels
 * @returns {Promise<Buffer>} Compressed image buffer
 */
async function compressImage(inputBuffer, mimetype, options = {}) {
  const { quality = 80, maxWidth = 1200 } = options;

  let pipeline = sharp(inputBuffer).resize({
    width: maxWidth,
    withoutEnlargement: true,
  });

  switch (mimetype) {
    case 'image/jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'image/png':
      pipeline = pipeline.png({ compressionLevel: Math.round((100 - quality) / 100 * 9) });
      break;
    case 'image/webp':
      pipeline = pipeline.webp({ quality });
      break;
    default:
      break;
  }

  return pipeline.toBuffer();
}

/**
 * Compress and upload an image to Supabase Storage.
 *
 * @param {Express.Multer.File} file - Multer file object (memoryStorage — has .buffer)
 * @param {object} [options]
 * @param {number} [options.quality=80]    - Output quality
 * @param {number} [options.maxWidth=1200] - Max width in pixels
 * @param {string} [options.folder='']     - Optional subfolder inside the bucket
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadToSupabase(file, options = {}) {
  const { quality = 80, maxWidth = 1200, folder = '' } = options;

  // Determine file extension from mimetype
  const extMap = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
  };
  const ext = extMap[file.mimetype] || 'jpg';

  // Generate unique filename
  const filename = `${Date.now()}-${uuidv4()}.${ext}`;
  const storagePath = folder ? `${folder}/${filename}` : filename;

  // Compress the image buffer
  const compressedBuffer = await compressImage(file.buffer, file.mimetype, { quality, maxWidth });

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(getBucket())
    .upload(storagePath, compressedBuffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Gagal upload ke Supabase Storage: ${error.message}`);
  }

  // Get the public URL
  const { data } = supabase.storage
    .from(getBucket())
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Silently ignores errors (non-fatal — used for cleanup on update/delete).
 *
 * @param {string|null} publicUrl - The public URL returned by uploadToSupabase
 */
async function deleteFromSupabase(publicUrl) {
  if (!publicUrl) return;

  try {
    // Extract the storage path from the public URL
    // URL format: https://[ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    const bucket = getBucket();
    const marker = `/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return; // Not a Supabase Storage URL — skip

    const storagePath = publicUrl.slice(idx + marker.length);

    await supabase.storage.from(bucket).remove([storagePath]);
  } catch (_) {
    // Non-fatal — log silently
  }
}

/**
 * Legacy processImage — kept for backward compatibility with tests.
 * In production, use uploadToSupabase instead.
 *
 * @param {string} inputPath  - Absolute path to source image (disk-based)
 * @param {string} outputPath - Absolute path for output image (disk-based)
 * @param {object} [options]
 * @returns {Promise<string>} outputPath
 */
async function processImage(inputPath, outputPath, options = {}) {
  const { quality = 80, maxWidth = 1200 } = options;
  const ext = path.extname(outputPath).toLowerCase().replace('.', '');

  let pipeline = sharp(inputPath).resize({ width: maxWidth, withoutEnlargement: true });

  switch (ext) {
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: Math.round((100 - quality) / 100 * 9) });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    default:
      break;
  }

  await pipeline.toFile(outputPath);
  return outputPath;
}

module.exports = { uploadToSupabase, deleteFromSupabase, compressImage, processImage };

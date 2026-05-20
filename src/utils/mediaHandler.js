const sharp = require('sharp');
const path = require('path');

/**
 * Process an uploaded image using sharp.
 * - Resizes to maxWidth (default 1200px) if wider, maintaining aspect ratio
 * - Applies quality compression (default 80)
 * - Preserves original format (jpeg, png, webp)
 *
 * @param {string} inputPath  - Absolute path to the source image
 * @param {string} outputPath - Absolute path for the processed output image
 * @param {object} options    - Processing options
 * @param {number} [options.quality=80]    - Output quality (1–100)
 * @param {number} [options.maxWidth=1200] - Maximum output width in pixels
 * @returns {Promise<string>} Resolves with outputPath on success
 */
async function processImage(inputPath, outputPath, options = {}) {
  const { quality = 80, maxWidth = 1200 } = options;

  const ext = path.extname(outputPath).toLowerCase().replace('.', '');

  let pipeline = sharp(inputPath).resize({
    width: maxWidth,
    withoutEnlargement: true // only downscale, never upscale
  });

  // Preserve format and apply quality
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'png':
      // PNG quality maps to compressionLevel (0–9); scale from 0–100 to 9–0
      pipeline = pipeline.png({ compressionLevel: Math.round((100 - quality) / 100 * 9) });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    default:
      // Fallback: let sharp decide based on output extension
      break;
  }

  await pipeline.toFile(outputPath);
  return outputPath;
}

module.exports = { processImage };

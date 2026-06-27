const sharp = require('sharp');

/**
 * Convert HEIC/HEIF buffer to JPEG using sharp.
 * Sharp 0.33+ has built-in HEIC support via libheif.
 * Returns { buffer, mimetype }.
 */
async function convertHeicToJpeg(buffer) {
  const jpegBuffer = await sharp(buffer)
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();
  return { buffer: jpegBuffer, mimetype: 'image/jpeg' };
}

/**
 * Normalize image: strip EXIF, auto-orient, convert HEIC if needed.
 * Returns { buffer, mimetype, width, height }.
 */
async function normalizeImage(buffer, mimetype) {
  let workingBuffer = buffer;
  let workingMime = mimetype;

  if (mimetype === 'image/heic' || mimetype === 'image/heif') {
    const converted = await convertHeicToJpeg(buffer);
    workingBuffer = converted.buffer;
    workingMime = converted.mimetype;
  }

  // Auto-orient (fix EXIF rotation), strip metadata for privacy
  const normalized = await sharp(workingBuffer)
    .rotate() // auto-orient from EXIF
    .withMetadata({ exif: {} }) // strip EXIF but keep orientation
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: normalized.data,
    mimetype: workingMime,
    width: normalized.info.width,
    height: normalized.info.height,
  };
}

/**
 * Generate a thumbnail for preview display.
 */
async function generateThumbnail(buffer, width = 400) {
  return sharp(buffer)
    .resize(width, null, { withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

module.exports = { normalizeImage, generateThumbnail, convertHeicToJpeg };

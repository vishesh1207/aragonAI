const sharp = require('sharp');
const Image = require('../models/Image');

const MIN_WIDTH  = parseInt(process.env.MIN_IMAGE_WIDTH)   || 200;
const MIN_HEIGHT = parseInt(process.env.MIN_IMAGE_HEIGHT)  || 200;
const MIN_BYTES  = parseInt(process.env.MIN_FILE_BYTES)    || 10_000;
const BLUR_THRESHOLD       = parseFloat(process.env.BLUR_THRESHOLD)        || 500;
const SIMILARITY_THRESHOLD = parseInt(process.env.SIMILARITY_THRESHOLD)    || 10;
const MIN_FACE_RATIO       = parseFloat(process.env.MIN_FACE_SIZE_RATIO)   || 0.05;

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

/**
 * Laplacian variance — proxy for sharpness.
 * Higher = sharper. Below threshold = blurry.
 */
async function computeBlurScore(buffer) {
  const { data, info } = await sharp(buffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  let sum = 0, count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = -data[i - width] - data[i - 1] + 4 * data[i] - data[i + 1] - data[i + width];
      sum += lap * lap;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * 8×8 average perceptual hash → 64-char binary string.
 */
async function computePerceptualHash(buffer) {
  const { data } = await sharp(buffer)
    .resize(8, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const avg = data.reduce((s, v) => s + v, 0) / data.length;
  return Array.from(data).map(v => (v >= avg ? '1' : '0')).join('');
}

function hammingDistance(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

async function findSimilarImage(pHash, excludeId) {
  const images = await Image.find(
    { pHash: { $ne: null }, status: { $in: ['PENDING', 'ACCEPTED', 'PROCESSING'] },
      ...(excludeId && { _id: { $ne: excludeId } }) },
    { _id: 1, pHash: 1 }
  ).lean();

  for (const img of images) {
    if (img.pHash && hammingDistance(pHash, img.pHash) <= SIMILARITY_THRESHOLD) {
      return img._id.toString();
    }
  }
  return null;
}

const { detectFaces } = require('./faceDetector');

/**
 * Full validation pipeline. Returns { valid, reason?, meta }.
 */
async function validateImage(buffer, mimetype, fileSize, excludeId = null) {
  if (!ALLOWED_MIMES.includes(mimetype)) {
    return { valid: false, reason: 'Unsupported format. Only JPEG, PNG, and HEIC are allowed.' };
  }

  if (fileSize < MIN_BYTES) {
    return { valid: false, reason: `File too small (${fileSize} bytes). Minimum is ${MIN_BYTES} bytes.` };
  }

  const { width, height } = await sharp(buffer).metadata();

  if (!width || !height || width < MIN_WIDTH || height < MIN_HEIGHT) {
    return {
      valid: false,
      reason: `Resolution too low (${width}×${height}). Minimum is ${MIN_WIDTH}×${MIN_HEIGHT}.`,
      meta: { width, height },
    };
  }

  const blurScore = await computeBlurScore(buffer);
  if (blurScore < BLUR_THRESHOLD) {
    return {
      valid: false,
      reason: 'Blurry face detected',
      meta: { width, height, blurScore },
    };
  }

  const pHash = await computePerceptualHash(buffer);
  const similarId = await findSimilarImage(pHash, excludeId);
  if (similarId) {
    return {
      valid: false,
      reason: 'Too similar to another upload',
      meta: { width, height, blurScore, pHash },
    };
  }

  const { count: faceCount, maxFaceRatio } = await detectFaces(buffer);
  if (faceCount === 0) {
    return { valid: false, reason: 'No face detected in the image.', meta: { width, height, blurScore, pHash, faceCount } };
  }
  if (faceCount > 1) {
    return { valid: false, reason: `Multiple faces detected (${faceCount}).`, meta: { width, height, blurScore, pHash, faceCount } };
  }
  if (maxFaceRatio < MIN_FACE_RATIO) {
    return {
      valid: false,
      reason: 'Face is too far away',
      meta: { width, height, blurScore, pHash, faceCount },
    };
  }

  return { valid: true, meta: { width, height, blurScore, pHash, faceCount, maxFaceRatio } };
}

module.exports = { validateImage, computePerceptualHash };

const express = require('express');
const Image = require('../models/Image');
const { upload } = require('../middleware/upload');
const { validateImage, computePerceptualHash } = require('../services/imageValidator');
const { normalizeImage } = require('../services/imageProcessor');
const { uploadToS3, deleteFromS3 } = require('../lib/s3');

const router = express.Router();

/**
 * POST /images/upload
 * Validates synchronously (user gets immediate feedback),
 * then stores to S3 asynchronously.
 */
router.post('/upload', upload.array('images', 10), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: 'No files provided.' });
  }

  // Phase 1: create all PENDING records and pre-save pHashes so that
  // batch siblings can find each other during the similarity check
  const prepared = await Promise.all(
    req.files.map(async (file) => {
      const record = await Image.create({
        originalName: file.originalname,
        mimeType:     file.mimetype,
        sizeBytes:    file.size,
        status:       'PENDING',
      });
      const pHash = await computePerceptualHash(file.buffer).catch(() => null);
      if (pHash) await Image.findByIdAndUpdate(record._id, { pHash });
      return { file, record };
    })
  );

  // Phase 2: full validation — findSimilarImage now sees all PENDING siblings
  const results = await Promise.all(
    prepared.map(async ({ file, record }) => {
      // 2. Run full validation pipeline
      const validation = await validateImage(file.buffer, file.mimetype, file.size, record._id);

      if (!validation.valid) {
        await Image.findByIdAndUpdate(record._id, {
          status:          'REJECTED',
          rejectionReason: validation.reason,
          width:           validation.meta?.width   ?? null,
          height:          validation.meta?.height  ?? null,
          blurScore:       validation.meta?.blurScore ?? null,
          faceCount:       validation.meta?.faceCount ?? null,
          pHash:           validation.meta?.pHash    ?? null,
        });

        return {
          id:             record._id.toString(),
          originalName:   file.originalname,
          status:         'REJECTED',
          rejectionReason: validation.reason,
        };
      }

      // 3. Mark PROCESSING — async S3 upload begins
      await Image.findByIdAndUpdate(record._id, {
        status:    'PROCESSING',
        width:     validation.meta.width,
        height:    validation.meta.height,
        blurScore: validation.meta.blurScore,
        faceCount: validation.meta.faceCount,
        pHash:     validation.meta.pHash,
      });

      // 4. Non-blocking: normalize + upload to S3, then update status
      processAndStore(record._id, file.buffer, file.originalname, file.mimetype).catch((err) => {
        console.error(`[processAndStore] ${record._id}:`, err.message);
        Image.findByIdAndUpdate(record._id, {
          status:          'REJECTED',
          rejectionReason: 'Processing failed: ' + err.message,
        }).catch(console.error);
      });

      return {
        id:           record._id.toString(),
        originalName: file.originalname,
        status:       'PROCESSING',
      };
    })
  );

  res.json({ results });
});

async function processAndStore(imageId, buffer, originalName, mimetype) {
  const { buffer: normalized, mimetype: finalMime } = await normalizeImage(buffer, mimetype);
  const ext    = finalMime === 'image/jpeg' ? '.jpg' : '.png';
  const s3Name = originalName.replace(/\.[^.]+$/, ext);

  const { key, url } = await uploadToS3(normalized, s3Name, finalMime);

  await Image.findByIdAndUpdate(imageId, { status: 'ACCEPTED', s3Key: key, s3Url: url });
}

/**
 * GET /images?status=ACCEPTED&page=1&limit=20
 */
router.get('/', async (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const filter   = status ? { status: status.toUpperCase() } : {};

  const [images, total] = await Promise.all([
    Image.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-__v')
      .lean(),
    Image.countDocuments(filter),
  ]);

  // Normalize _id → id for the frontend
  const normalized = images.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));

  res.json({
    images: normalized,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

/** GET /images/:id */
router.get('/:id', async (req, res) => {
  const image = await Image.findById(req.params.id).lean();
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  const { _id, ...rest } = image;
  res.json({ id: _id.toString(), ...rest });
});

/** DELETE /images/:id */
router.delete('/:id', async (req, res) => {
  const image = await Image.findById(req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  if (image.s3Key) await deleteFromS3(image.s3Key).catch(console.error);
  await image.deleteOne();
  res.json({ message: 'Deleted.' });
});

module.exports = router;

require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./lib/db');
const imagesRouter  = require('./routes/images');
const { loadModels } = require('./services/faceDetector');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve locally-stored uploads when S3 is not configured
if (!process.env.S3_BUCKET) {
  const uploadsDir = path.join(__dirname, '../uploads');
  app.use('/local-files', express.static(uploadsDir));
}

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many uploads. Please wait before trying again.' },
});

app.use('/images', uploadLimiter, imagesRouter);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Centralised error handler
app.use((err, req, res, _next) => {
  console.error('[error]', err.message);
  if (err.code === 'INVALID_FORMAT') return res.status(400).json({ error: err.message });
  if (err.code === 'LIMIT_FILE_SIZE')  return res.status(413).json({ error: 'File too large. Maximum 25 MB.' });
  if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Max 10.' });
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

connectDB().then(() => {
  // Preload face detection models in background (avoids slow first upload)
  loadModels().catch((err) => console.error('[face-api] Model preload failed:', err.message));
  app.listen(PORT, () => console.log(`Server → http://localhost:${PORT}`));
});

const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    mimeType:     { type: String, required: true },
    sizeBytes:    { type: Number, required: true },
    width:        { type: Number, default: null },
    height:       { type: Number, default: null },
    s3Key:        { type: String, default: null },
    s3Url:        { type: String, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String, default: null },
    // Perceptual hash (64-char binary string) for similarity detection
    pHash:      { type: String, default: null, index: true },
    faceCount:  { type: Number, default: null },
    blurScore:  { type: Number, default: null },
  },
  { timestamps: true }
);

// Index for status-based queries (accepted/rejected list)
ImageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Image', ImageSchema);

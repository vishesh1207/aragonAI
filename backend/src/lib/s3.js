const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Local-disk mode when S3_BUCKET is not configured
const LOCAL_MODE = !process.env.S3_BUCKET;
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const localBaseUrl = () => `http://localhost:${process.env.PORT || 3001}/local-files`;

async function uploadToS3(buffer, originalName, mimeType) {
  if (LOCAL_MODE) {
    const ext = path.extname(originalName) || '.jpg';
    const key = `${uuidv4()}${ext}`;
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, key), buffer);
    return { key, url: `${localBaseUrl()}/${key}` };
  }

  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    ...(process.env.S3_ENDPOINT && {
      endpoint: process.env.S3_ENDPOINT,
      s3ForcePathStyle: true,
    }),
  });

  const ext = path.extname(originalName) || '.jpg';
  const key = `uploads/${uuidv4()}${ext}`;

  await s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }).promise();

  const url = s3.getSignedUrl('getObject', {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 60 * 60 * 24 * 7,
  });

  return { key, url };
}

async function deleteFromS3(key) {
  if (LOCAL_MODE) {
    const filePath = path.join(UPLOADS_DIR, key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return;
  }

  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    ...(process.env.S3_ENDPOINT && {
      endpoint: process.env.S3_ENDPOINT,
      s3ForcePathStyle: true,
    }),
  });

  await s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: key }).promise();
}

module.exports = { uploadToS3, deleteFromS3 };

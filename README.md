# Aragon · Photo Upload Challenge

Full-stack MERN image upload and validation pipeline.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Storage**: AWS S3 (or MinIO for local dev)
- **Image processing**: sharp (HEIC→JPEG, blur detection, pHash)

## Architecture

```
Left sidebar (upload)        Right panel (results)
┌─────────────────────┐      ┌──────────────────────────────┐
│ DropZone / progress │      │ Progress bar (N of 10)        │
│ Pending file list   │      │ "Hang tight…" (checking)      │
│                     │      │ Accepted Photos section        │
│                     │      │ Rejected section + tooltips    │
└─────────────────────┘      └──────────────────────────────┘
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# fill in MONGODB_URI, AWS creds, S3_BUCKET

npm install
npm run dev   # http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### 3. Local S3 with MinIO (optional)

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=password \
  quay.io/minio/minio server /data --console-address ":9001"
```

Set in `.env`:
```
S3_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=password
S3_BUCKET=aragon-uploads
```

## Validation Pipeline

1. **Format** — JPEG, PNG, HEIC/HEIF only (checked both MIME + extension)
2. **File size** — minimum 10 KB
3. **Resolution** — minimum 200×200 px
4. **Blur** — Laplacian variance < threshold → "Blurry face detected"
5. **Similarity** — perceptual hash Hamming distance ≤ 10 → "Too similar to another upload"
6. **Face detection** — count, size ratio → "Face is too far away" / "Multiple faces detected"

> Face detection uses a **stub** by default. Replace `detectFaces()` in
> `src/services/imageValidator.js` with `@vladmandic/face-api` or AWS Rekognition.
> See comments in the file for drop-in code.

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/images/upload` | Upload 1–10 images (multipart) |
| GET | `/images?status=ACCEPTED&page=1` | Paginated list |
| GET | `/images/:id` | Single image |
| DELETE | `/images/:id` | Delete + remove from S3 |

## UI States

| Phase | What user sees |
|-------|---------------|
| idle | DropZone with orange "Upload files" button |
| uploading | "Uploading…" button + file list with spinners |
| checking | "Hang tight" section with image grid |
| done | Accepted / Rejected sections + success toast |

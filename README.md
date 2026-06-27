# Aragon AI — Photo Upload & Validation

Full-stack MERN app that accepts portrait photos, validates them through a multi-stage pipeline, and stores accepted images on AWS S3 (or local disk in dev mode).

---

## Quick start (zero config)

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev        # → http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

No MongoDB install, no AWS account, no Docker needed. Both fall back automatically (see below).

---

## Architecture

### Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Vite's instant HMR vs CRA's slow dev server |
| Backend | Node.js + Express | Matches the spec; lightweight for I/O-bound work |
| Database | MongoDB + Mongoose | Flexible schema for evolving image metadata |
| Storage | AWS S3 / local disk | Presigned URLs keep files off the app server |
| Image processing | sharp (libvips) | Fast native bindings; handles HEIC, raw pixel buffers |
| Face detection | @vladmandic/face-api (WASM) | No native compile, no API key, runs anywhere |

### Zero-config local dev

- **Database**: If `MONGODB_URI` is unset, `mongodb-memory-server` auto-downloads a MongoDB binary and runs in memory. No install needed.
- **Storage**: If `S3_BUCKET` is unset, files are written to `backend/uploads/` and served as static files. No AWS account needed.

### Sync validation, async storage

Validation runs synchronously before the HTTP response returns — the user gets instant accept/reject feedback. The S3 upload happens in the background after responding. This keeps perceived latency low regardless of network conditions.

### Validation pipeline (fail-fast, cost order)

Checks run cheapest-first so expensive ops (face detection) never run on invalid input:

```
1. Format        MIME type — JPEG / PNG / HEIC only. Client-side too (never hits server).
2. File size     Minimum 10 KB.
3. Resolution    Minimum 200×200 px via sharp metadata.
4. Blur          Laplacian variance < 500 → rejected. Classical CV, no ML.
5. Similarity    Perceptual hash (8×8 average hash) + Hamming distance ≤ 10.
6. Face count    SSD MobileNet v1 — 0 faces, >1 face, or face too small → rejected.
```

### Blur detection — Laplacian variance

Convert to greyscale → apply a 5-point Laplacian kernel over every pixel → take the mean of squared values. High variance = sharp edges. Low variance = blur. Threshold: 500 (configurable via `BLUR_THRESHOLD` env var). Sharp smartphone photos score 1000+; noticeably blurry images score below 300.

### Similarity detection — perceptual hash

Resize to 8×8, greyscale, generate a 64-bit binary string (each bit = above/below average brightness). Hamming distance scan against all accepted images in the database. Two-phase batch upload: pHashes are pre-saved to PENDING records before validation runs, so same-batch duplicates also get caught (otherwise concurrent uploads race and both pass).

### Face detection — WASM backend

Uses `@vladmandic/face-api` with `@tensorflow/tfjs-backend-wasm` instead of the native `tfjs-node`. The native build requires `node-gyp` to compile C++ bindings — which breaks on directory paths containing spaces (a real issue during development). The WASM build is pure JavaScript, no compile step, no native dependencies. Trade-off: ~3–5× slower than native. Production path: swap in `tfjs-node` or AWS Rekognition.

Images are decoded to raw RGB buffers via `sharp` and fed directly as a `tf.tensor3d` — no `canvas` npm package needed.

Models (~5.5 MB) auto-download to `backend/models/` on first startup.

### Frontend upload flow

- **XHR over fetch** — `fetch` has no upload progress API. XHR's `onprogress` drives the per-file progress indicator.
- **Immediate previews** — Blob URLs created from the local file on drop, before any upload. Stored in a `useRef` so they survive React state replacements.
- **PROCESSING → polling** — Server responds with `PROCESSING` immediately; S3 upload continues in the background. Client polls `/images?status=PROCESSING` every 2 s and transitions items when they settle. Simple, zero infra. At scale: Server-Sent Events.

---

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/images/upload` | Upload 1–10 images (multipart/form-data) |
| `GET` | `/images?status=ACCEPTED&page=1` | Paginated list |
| `GET` | `/images/:id` | Single image record |
| `DELETE` | `/images/:id` | Delete record + S3 object |

---

## Environment variables

See `backend/.env.example`. All optional for local dev — defaults cover the zero-config path.

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | _(in-memory)_ | Atlas or local Mongo URI |
| `S3_BUCKET` | _(local disk)_ | S3 bucket name |
| `AWS_*` | — | AWS credentials + region |
| `BLUR_THRESHOLD` | `500` | Laplacian variance cutoff |
| `SIMILARITY_THRESHOLD` | `10` | Hamming distance cutoff (0–64) |
| `MIN_FACE_SIZE_RATIO` | `0.05` | Min face area as fraction of image |
| `MIN_IMAGE_WIDTH/HEIGHT` | `200` | Minimum resolution |

---

## What I'd do with more time

- **Job queue** (BullMQ) — move S3 upload + face detection off the request thread, add retries
- **SSE instead of polling** — push status updates from server to client
- **AWS Rekognition** — better face detection accuracy, horizontal scale
- **Vector index** — replace O(n) pHash scan with MongoDB Atlas Vector Search
- **User sessions** — uploads currently share a global pool

Sample Preview:
<img width="1791" height="1043" alt="image" src="https://github.com/user-attachments/assets/79158591-2c26-4cb9-a9c5-97cab6811ea0" />

require('@tensorflow/tfjs-backend-wasm');
const tf = require('@tensorflow/tfjs');
// Use the WASM-backed Node.js build — no native binaries needed
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = path.join(__dirname, '../../models');

const MODEL_FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model.bin',
];

const MODEL_BASE = 'https://github.com/vladmandic/face-api/raw/master/model';

let modelsLoaded = false;
let loadPromise = null;

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const attempt = (target) => {
      https.get(target, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return attempt(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} downloading ${target}`));
        }
        const stream = fs.createWriteStream(dest);
        res.pipe(stream);
        stream.on('finish', () => stream.close(resolve));
        stream.on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
      }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
    };
    attempt(url);
  });
}

async function ensureModels() {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  for (const file of MODEL_FILES) {
    const dest = path.join(MODELS_DIR, file);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 100) {
      console.log(`[face-api] Downloading ${file}...`);
      await downloadFile(`${MODEL_BASE}/${file}`, dest);
      console.log(`[face-api] Downloaded ${file}`);
    }
  }
}

async function loadModels() {
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await tf.setBackend('wasm');
    await tf.ready();
    await ensureModels();
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
    modelsLoaded = true;
    console.log('[face-api] Models ready');
  })();

  return loadPromise;
}

async function detectFaces(buffer) {
  await loadModels();

  // Decode image to raw RGB via sharp — no canvas dependency needed
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);

  try {
    const detections = await faceapi.detectAllFaces(
      tensor,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    );

    const imageArea = info.width * info.height;
    const maxFaceRatio =
      detections.length > 0
        ? Math.max(...detections.map((d) => (d.box.width * d.box.height) / imageArea))
        : 0;

    return { count: detections.length, maxFaceRatio };
  } finally {
    tensor.dispose();
  }
}

module.exports = { detectFaces, loadModels };

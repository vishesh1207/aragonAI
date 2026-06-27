const mongoose = require('mongoose');

let connected = false;

async function connectDB() {
  if (connected) return;

  let uri = process.env.MONGODB_URI;

  if (!uri) {
    // No URI configured — spin up an in-memory MongoDB instance (dev/demo only)
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('[db] Using in-memory MongoDB (set MONGODB_URI to use a real instance)');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  connected = true;
  console.log('[db] Connected to MongoDB');
}

module.exports = { connectDB };

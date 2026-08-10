const mongoose = require('mongoose');

let isMongoConnected = false;

async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rv_lms';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      autoIndex: true
    });
    isMongoConnected = true;
    console.log('🍃 Local MongoDB Connected Successfully at:', mongoUri);
    return true;
  } catch (err) {
    isMongoConnected = false;
    console.warn('⚠️ Local MongoDB not detected (using in-memory fallback):', err.message);
    return false;
  }
}

function getMongoStatus() {
  return isMongoConnected;
}

module.exports = { connectDB, getMongoStatus };

const mongoose = require('mongoose');

let isMongoConnected = false;

function connectDB(uri) {
  return mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 })
    .then(() => {
      isMongoConnected = true;
      console.log('🍃 Connected to MongoDB successfully at:', uri);
    })
    .catch((err) => {
      isMongoConnected = false;
      console.warn('⚠️ MongoDB connection error (using in-memory fallback):', err.message);
    });
}

function getMongoStatus() {
  return isMongoConnected;
}

module.exports = { connectDB, getMongoStatus };

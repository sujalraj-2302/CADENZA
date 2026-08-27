const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string in process.env.MONGODB_URI.
 * Kept in its own module so server.js stays clean and the connection logic
 * can be extended later (pooling options, retries) without touching anything else.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
}

module.exports = connectDB;

const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/acko-mer-ai', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

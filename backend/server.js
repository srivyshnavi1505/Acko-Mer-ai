require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const { initSocket } = require('./src/config/socket');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(
  { maxHeaderSize: 32768 },
  app
);

initSocket(server);

// Auto-handle port in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use!`);
    logger.error(`Run this to fix: netstat -ano | findstr :${PORT}`);
    logger.error(`Then run: taskkill /PID <number> /F`);
    process.exit(1);
  }
});

const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    server.listen(PORT, () => {
      logger.info(`🚀 ACKO MER AI Server running on port ${PORT}`);
      logger.info(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});

start();
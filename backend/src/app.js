const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const AppError = require('./utils/AppError');

// Routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const transcriptionRoutes = require('./routes/transcriptions');
const summaryRoutes = require('./routes/summaries');

const patientRoutes = require('./routes/patients');
const app = express();





// Trust proxy (for rate limiting behind nginx)
app.set('trust proxy', 1);
const http = require('http');
http.globalAgent.maxHeaderSize = 32768;

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Compression
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
    skip: (req) => req.url === '/health',
  }));
}

// Rate limiting
app.use('/api', generalLimiter);

// Static files (uploaded audio)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health checks
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  service: 'ACKO MER AI API',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/transcribe', transcriptionRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/patients', patientRoutes);

// 404 handler
app.use('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

// Global error handler
app.use(errorHandler);

module.exports = app;

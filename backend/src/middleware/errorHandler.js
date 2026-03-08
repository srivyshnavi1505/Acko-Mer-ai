const logger = require('../config/logger');
const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  return new AppError(`Duplicate field value: ${value}. Please use another value.`, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Invalid input data: ${errors.join('. ')}`, 400);
};
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Token expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({ status: err.status, message: err.message });
  } else {
    logger.error('UNEXPECTED ERROR:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`${err.statusCode} ${err.message}`, { url: req.url, method: req.method });

  if (process.env.NODE_ENV === 'development') return sendErrorDev(err, res);

  let error = { ...err, message: err.message };
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  sendErrorProd(error, res);
};

const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { status: 'error', message },
    standardHeaders: true,
    legacyHeaders: false,
  });

const generalLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many requests. Try again in 15 minutes.');
const authLimiter = createLimiter(15 * 60 * 1000, 10, 'Too many auth attempts. Try again in 15 minutes.');
const uploadLimiter = createLimiter(60 * 60 * 1000, 20, 'Upload limit reached. Try again in 1 hour.');

module.exports = { generalLimiter, authLimiter, uploadLimiter };

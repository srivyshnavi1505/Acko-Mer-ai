const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) return next(new AppError('Not authenticated. Please log in.', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.id).select('+isActive');
    if (!user || !user.isActive) return next(new AppError('User no longer exists or is inactive.', 401));
    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`Role '${req.user.role}' not authorized for this action.`, 403));
  }
  next();
};

// Optional auth - continues even without token
const optionalAuth = catchAsync(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      req.user = await User.findById(decoded.id);
    }
  } catch {}
  next();
});

module.exports = { protect, authorize, optionalAuth };

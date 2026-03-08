const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
  expiresIn: process.env.JWT_EXPIRE || '7d',
});

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role, specialization } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('Email already registered.', 400));

  const user = await User.create({ name, email, password, role: role || 'doctor', specialization });
  logger.info(`New user registered: ${email}`);
  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  if (!user.isActive) return next(new AppError('Account is deactivated. Contact admin.', 401));

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);
  createSendToken(user, 200, res);
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name, specialization } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, specialization },
    { new: true, runValidators: true }
  );
  res.status(200).json({ status: 'success', data: { user } });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
});

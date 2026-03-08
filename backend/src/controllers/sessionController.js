const Session = require('../models/Session');
const Transcript = require('../models/Transcript');
const Summary = require('../models/Summary');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { cache } = require('../config/redis');
const { emitToSession } = require('../config/socket');
const { CACHE_TTL, SESSION_STATUS } = require('../config/constants');
const logger = require('../config/logger');

exports.createSession = catchAsync(async (req, res, next) => {
  const session = await Session.create({
    ...req.body,
    doctorId: req.user?._id,
    startedAt: new Date(),
  });

  await cache.set(`session:${session._id}`, session, CACHE_TTL.SESSION);
  logger.info(`Session created: ${session._id}`);

  res.status(201).json({ status: 'success', data: { session } });
});

exports.getSessions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, sessionType, priority, search } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.user?.role !== 'admin') query.doctorId = req.user?._id;
  if (status) query.status = status;
  if (sessionType) query.sessionType = sessionType;
  if (priority) query.priority = priority;
  if (search) query.$or = [
    { doctorName: { $regex: search, $options: 'i' } },
    { patientName: { $regex: search, $options: 'i' } },
    { patientId: { $regex: search, $options: 'i' } },
  ];

  const [sessions, total] = await Promise.all([
    Session.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Session.countDocuments(query),
  ]);

  res.status(200).json({
    status: 'success',
    results: sessions.length,
    total,
    pages: Math.ceil(total / limit),
    page: parseInt(page),
    data: { sessions },
  });
});

exports.getSession = catchAsync(async (req, res, next) => {
  const cacheKey = `session:${req.params.id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', data: { session: cached } });

  const session = await Session.findById(req.params.id);
  if (!session) return next(new AppError('Session not found.', 404));

  await cache.set(cacheKey, session, CACHE_TTL.SESSION);
  res.status(200).json({ status: 'success', data: { session } });
});

exports.updateSession = catchAsync(async (req, res, next) => {
  const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!session) return next(new AppError('Session not found.', 404));

  await cache.del(`session:${session._id}`);
  emitToSession(session._id.toString(), 'session:updated', { session });

  res.status(200).json({ status: 'success', data: { session } });
});

exports.endSession = catchAsync(async (req, res, next) => {
  const session = await Session.findById(req.params.id);
  if (!session) return next(new AppError('Session not found.', 404));
  if (session.status === SESSION_STATUS.COMPLETED) {
    return next(new AppError('Session already completed.', 400));
  }

  session.status = SESSION_STATUS.COMPLETED;
  session.endedAt = new Date();
  session.duration = Math.round((session.endedAt - session.startedAt) / 1000);
  await session.save();

  await cache.del(`session:${session._id}`);
  emitToSession(session._id.toString(), 'session:ended', { sessionId: session._id });

  logger.info(`Session ended: ${session._id}, duration: ${session.duration}s`);
  res.status(200).json({ status: 'success', data: { session } });
});

exports.deleteSession = catchAsync(async (req, res, next) => {
  const session = await Session.findById(req.params.id);
  if (!session) return next(new AppError('Session not found.', 404));

  // Cascade delete
  await Promise.all([
    Transcript.deleteMany({ sessionId: session._id }),
    Summary.deleteOne({ sessionId: session._id }),
    session.deleteOne(),
  ]);
  await cache.del(`session:${session._id}`);

  logger.info(`Session deleted: ${session._id}`);
  res.status(204).json({ status: 'success', data: null });
});

exports.getSessionStats = catchAsync(async (req, res, next) => {
  const doctorId = req.user?.role === 'admin' ? undefined : req.user?._id;
  const matchStage = doctorId ? { doctorId } : {};

  const stats = await Session.aggregate([
    { $match: matchStage },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      avgDuration: { $avg: '$duration' },
    }},
  ]);

  res.status(200).json({ status: 'success', data: { stats } });
});

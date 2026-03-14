const Patient = require('../models/Patient');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

// Create patient
exports.createPatient = catchAsync(async (req, res, next) => {
  const patient = await Patient.create({
    ...req.body,
    createdBy: req.user._id,
    assignedDoctorId: req.user._id,
  });

  logger.info(`Patient created: ${patient.patientCode} by ${req.user._id}`);
  res.status(201).json({ status: 'success', data: { patient } });
});

// Get all patients (doctor sees only their own, admin sees all)
exports.getPatients = catchAsync(async (req, res, next) => {
  const { search, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const query = { isActive: true };
  if (req.user.role !== 'admin') query.createdBy = req.user._id;

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { patientCode: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Patient.countDocuments(query),
  ]);

  res.status(200).json({
    status: 'success',
    results: patients.length,
    total,
    pages: Math.ceil(total / limit),
    data: { patients },
  });
});

// Get single patient
exports.getPatient = catchAsync(async (req, res, next) => {
  const query = { _id: req.params.id };
  if (req.user.role !== 'admin') query.createdBy = req.user._id;

  const patient = await Patient.findOne(query);
  if (!patient) return next(new AppError('Patient not found.', 404));

  res.status(200).json({ status: 'success', data: { patient } });
});

// Get patient with full visit history
exports.getPatientWithHistory = catchAsync(async (req, res, next) => {
  const query = { _id: req.params.id };
  if (req.user.role !== 'admin') query.createdBy = req.user._id;

  const patient = await Patient.findOne(query);
  if (!patient) return next(new AppError('Patient not found.', 404));

  // Get all sessions for this patient
  const sessions = await Session.find({
    $or: [
      { patientId: patient.patientCode },
      { patientName: { $regex: `${patient.firstName} ${patient.lastName}`, $options: 'i' } },
    ],
  }).sort({ createdAt: -1 }).select('patientName sessionType status priority startedAt endedAt duration hasSummary transcriptCount doctorName');

  res.status(200).json({
    status: 'success',
    data: { patient, sessions, totalVisits: sessions.length },
  });
});

// Update patient
exports.updatePatient = catchAsync(async (req, res, next) => {
  const query = { _id: req.params.id };
  if (req.user.role !== 'admin') query.createdBy = req.user._id;

  const patient = await Patient.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
  if (!patient) return next(new AppError('Patient not found.', 404));

  logger.info(`Patient updated: ${patient.patientCode}`);
  res.status(200).json({ status: 'success', data: { patient } });
});

// Delete (soft delete)
exports.deletePatient = catchAsync(async (req, res, next) => {
  const query = { _id: req.params.id };
  if (req.user.role !== 'admin') query.createdBy = req.user._id;

  const patient = await Patient.findOneAndUpdate(query, { isActive: false }, { new: true });
  if (!patient) return next(new AppError('Patient not found.', 404));

  logger.info(`Patient deactivated: ${patient.patientCode}`);
  res.status(204).json({ status: 'success', data: null });
});

// Search patients (for quick lookup when creating sessions)
exports.searchPatients = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(200).json({ status: 'success', data: { patients: [] } });

  const query = {
    isActive: true,
    createdBy: req.user._id,
    $or: [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { patientCode: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ],
  };

  const patients = await Patient.find(query).limit(10).select('firstName lastName patientCode phone dateOfBirth gender bloodGroup');
  res.status(200).json({ status: 'success', data: { patients } });
});

// Get patient stats for dashboard
exports.getPatientStats = catchAsync(async (req, res, next) => {
  const doctorId = req.user._id;
  const total = await Patient.countDocuments({ createdBy: doctorId, isActive: true });
  const thisMonth = await Patient.countDocuments({
    createdBy: doctorId,
    isActive: true,
    createdAt: { $gte: new Date(new Date().setDate(1)) },
  });

  res.status(200).json({ status: 'success', data: { total, thisMonth } });
});

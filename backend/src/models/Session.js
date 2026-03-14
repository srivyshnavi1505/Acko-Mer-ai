const mongoose = require('mongoose');
const { SESSION_STATUS, SESSION_TYPES, PRIORITY_LEVELS } = require('../config/constants');

const SessionSchema = new mongoose.Schema({
  doctorName: { type: String, required: true, trim: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientId: { type: String, trim: true },         // legacy text ID / MRN
  patientName: { type: String, trim: true },
  patientProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // linked profile
  sessionType: { type: String, enum: SESSION_TYPES, default: 'consultation' },
  priority: { type: String, enum: PRIORITY_LEVELS, default: 'medium' },
  status: { type: String, enum: Object.values(SESSION_STATUS), default: SESSION_STATUS.ACTIVE },
  notes: { type: String, maxlength: 5000 },
  tags: [String],
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  duration: Number,         // seconds — set when session ends
  recordingDuration: Number, // total seconds of actual audio recorded
  transcriptCount: { type: Number, default: 0 },
  hasSummary: { type: Boolean, default: false },
}, { timestamps: true });

SessionSchema.index({ doctorId: 1, createdAt: -1 });
SessionSchema.index({ patientId: 1 });
SessionSchema.index({ patientProfileId: 1 });
SessionSchema.index({ status: 1 });

module.exports = mongoose.model('Session', SessionSchema);

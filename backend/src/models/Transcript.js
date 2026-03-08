const mongoose = require('mongoose');
const { TRANSCRIPT_STATUS } = require('../config/constants');

const TranscriptSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  text: { type: String, default: '' },
  language: { type: String, default: 'en' },
  status: { type: String, enum: Object.values(TRANSCRIPT_STATUS), default: TRANSCRIPT_STATUS.PENDING },
  audioFile: {
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    duration: Number,
  },
  segments: [{ start: Number, end: Number, text: String, confidence: Number }],
  versions: [{ text: String, editedAt: { type: Date, default: Date.now }, editedBy: String }],
  processingTime: Number,
  errorMessage: String,
}, { timestamps: true });

TranscriptSchema.index({ sessionId: 1, createdAt: -1 });
module.exports = mongoose.model('Transcript', TranscriptSchema);

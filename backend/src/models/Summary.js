const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
  transcriptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transcript' },
  template: { type: String, default: 'SOAP' },
  chiefComplaint: { type: String, default: '' },
  historyOfPresentIllness: { type: String, default: '' },
  pastMedicalHistory: { type: String, default: '' },
  medications: { type: String, default: '' },
  allergies: { type: String, default: '' },
  assessment: { type: String, default: '' },
  plan: { type: String, default: '' },
  prescription: { type: String, default: '' },
  followUp: { type: String, default: '' },
  icdCodes: [{ code: String, description: String, confidence: Number }],
  cptCodes: [{ code: String, description: String, confidence: Number }],
  confidenceScore: { type: Number, min: 0, max: 100 },
  versions: [{ data: mongoose.Schema.Types.Mixed, generatedAt: { type: Date, default: Date.now } }],
  isEdited: { type: Boolean, default: false },
  model: { type: String, default: 'gpt-4' },
}, { timestamps: true });

SummarySchema.index({ sessionId: 1 });
module.exports = mongoose.model('Summary', SummarySchema);

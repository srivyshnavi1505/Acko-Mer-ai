const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientCode: { type: String, unique: true }, // auto-generated PAT-0001
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'], default: 'unknown' },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },

  // Medical Info
  allergies: [{ substance: String, reaction: String, severity: { type: String, enum: ['mild', 'moderate', 'severe'] } }],
  chronicConditions: [String],
  currentMedications: [{ name: String, dosage: String, frequency: String }],
  pastSurgeries: [{ procedure: String, date: Date, notes: String }],
  familyHistory: [String],

  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },

  // Meta
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  notes: { type: String, maxlength: 2000 },
}, { timestamps: true });

// Auto-generate patientCode before save
PatientSchema.pre('save', async function (next) {
  if (!this.patientCode) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientCode = `PAT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual: full name
PatientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual: age
PatientSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - new Date(this.dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

PatientSchema.set('toJSON', { virtuals: true });
PatientSchema.set('toObject', { virtuals: true });

PatientSchema.index({ createdBy: 1 });
PatientSchema.index({ patientCode: 1 });
PatientSchema.index({ firstName: 'text', lastName: 'text', phone: 'text' });

module.exports = mongoose.model('Patient', PatientSchema);

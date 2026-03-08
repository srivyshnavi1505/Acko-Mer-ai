const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['doctor', 'admin', 'viewer'], default: 'doctor' },
  specialization: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],
  lastLogin: Date,
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);

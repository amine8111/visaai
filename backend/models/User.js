const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['applicant', 'agent', 'admin'], default: 'applicant' },
  isVerified: { type: Boolean, default: false },
  faceVerified: { type: Boolean, default: false },
  travelHistory: [{ type: mongoose.Schema.Types.Mixed }],
  nationality: String,
  dateOfBirth: String,
  passportNumber: String,
  profileImage: String,
  membership: {
    tier: { type: String, enum: ['free', 'gold', 'premium'], default: 'free' },
    startDate: { type: Date },
    expiryDate: { type: Date },
    appointmentsThisMonth: { type: Number, default: 0 },
    lastAppointmentReset: { type: Date, default: Date.now }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.isMembershipActive = function() {
  if (this.membership.tier === 'free') return true;
  if (!this.membership.expiryDate) return false;
  return new Date() < new Date(this.membership.expiryDate);
};

userSchema.methods.canBookAppointment = function() {
  const limits = { free: 2, gold: 5, premium: 999 };
  const tier = this.membership?.tier || 'free';
  const count = this.membership?.appointmentsThisMonth || 0;
  return count < (limits[tier] || 2);
};

userSchema.methods.getPriorityScore = function() {
  const scores = { free: 0, gold: 50, premium: 100 };
  return scores[this.membership?.tier] || 0;
};

userSchema.methods.resetMonthlyAppointments = function() {
  const lastReset = this.membership?.lastAppointmentReset || this.createdAt;
  const now = new Date();
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.membership.appointmentsThisMonth = 0;
    this.membership.lastAppointmentReset = now;
  }
};

module.exports = mongoose.model('User', userSchema);

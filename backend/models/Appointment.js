const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visaType: { type: String, enum: ['tourist', 'business', 'student', 'work', 'family', 'transit'], required: true },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed', 'flagged'], default: 'pending' },
  qrCode: { type: String },
  isReservedByAgent: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  documents: [{ type: mongoose.Schema.Types.Mixed }],
  fraudFlags: [{
    type: { type: String },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  priorityScore: { type: Number, default: 0 },
  confirmationSent: { type: Boolean, default: false },
  applicationData: {
    passportNumber: String,
    purpose: String,
    duration: String,
    destination: String,
    entryType: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

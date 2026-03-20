const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  meetingDate: { type: String, required: true },
  meetingTime: { type: String, required: true },
  location: { type: String, default: 'VisaAI Office' },
  meetingType: { type: String, enum: ['document_check', 'interview', 'general'], default: 'document_check' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
  notes: { type: String },
  documentsToBring: [{
    name: String,
    verified: { type: Boolean, default: false }
  }],
  verificationStatus: { type: String, enum: ['pending', 'verified', 'issues_found'], default: 'pending' },
  issuesFound: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);

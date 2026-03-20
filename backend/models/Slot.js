const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  totalSlots: { type: Number, default: 50 },
  agentReservedPercent: { type: Number, default: 70 },
  agentReservedSlots: { type: Number, default: 35 },
  publicSlots: { type: Number, default: 15 },
  agentBooked: { type: Number, default: 0 },
  publicBooked: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

slotSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);

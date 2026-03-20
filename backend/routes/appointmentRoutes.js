const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateQRCode, generateAppointmentId } = require('../utils/qrCode');
const fraudDetection = require('../utils/fraudDetection');

const router = express.Router();

router.post('/book', authMiddleware, [
  body('visaType').isIn(['tourist', 'business', 'student', 'work', 'family', 'transit']),
  body('appointmentDate').isISO8601(),
  body('appointmentTime').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.userId);

    if (!user.isMembershipActive()) {
      return res.status(403).json({ message: 'Your membership has expired. Please renew to continue booking.' });
    }

    if (!user.canBookAppointment()) {
      return res.status(403).json({ 
        message: `Monthly appointment limit reached for your ${user.membership?.tier || 'free'} plan. Upgrade for more bookings.`,
        currentTier: user.membership?.tier || 'free',
        limit: user.membership?.tier === 'free' ? 2 : user.membership?.tier === 'gold' ? 5 : 999
      });
    }

    const { visaType, appointmentDate, appointmentTime, passportNumber, purpose, duration, destination, entryType } = req.body;
    const tier = user.membership?.tier || 'free';

    const dateStr = new Date(appointmentDate).toISOString().split('T')[0];
    let slot = await Slot.findOne({ date: dateStr, time: appointmentTime, isActive: true });

    if (!slot) {
      slot = await Slot.create({
        date: dateStr,
        time: appointmentTime,
        totalSlots: 50,
        agentReservedPercent: 70,
        agentReservedSlots: 35,
        publicSlots: 15
      });
    }

    if (tier === 'free') {
      if (slot.publicBooked >= slot.publicSlots) {
        return res.status(400).json({ message: 'Public slots are fully booked. Upgrade to Gold/Premium for priority access.' });
      }
    } else {
      const totalBooked = slot.publicBooked + slot.agentBooked;
      if (totalBooked >= slot.totalSlots) {
        return res.status(400).json({ message: 'All slots are full.' });
      }
    }

    const fraudCheck = await fraudDetection.checkDuplicateBooking(passportNumber, user.email);
    if (fraudCheck.flagged) {
      return res.status(400).json({ 
        message: 'Booking blocked due to security concerns',
        reason: fraudCheck.reason 
      });
    }

    const appointmentId = generateAppointmentId();
    const qrCode = await generateQRCode(appointmentId);

    const appointment = await Appointment.create({
      appointmentId,
      userId: user._id,
      visaType,
      appointmentDate,
      appointmentTime,
      qrCode,
      isPublic: true,
      priorityScore: user.getPriorityScore(),
      processingTier: tier === 'premium' ? 'express' : tier === 'gold' ? 'priority' : 'standard',
      applicationData: {
        passportNumber,
        purpose,
        duration,
        destination,
        entryType
      }
    });

    user.membership.appointmentsThisMonth = (user.membership.appointmentsThisMonth || 0) + 1;
    await user.save();

    if (tier === 'free') {
      await Slot.updateOne({ _id: slot._id }, { $inc: { publicBooked: 1 } });
    } else {
      const field = tier === 'premium' ? 'agentBooked' : 'publicBooked';
      await Slot.updateOne({ _id: slot._id }, { $inc: { [field]: 1 } });
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
      membershipInfo: {
        tier,
        appointmentsThisMonth: user.membership.appointmentsThisMonth,
        remainingBookings: user.canBookAppointment() ? 'available' : 'limit_reached'
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my-appointments', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId })
      .sort({ appointmentDate: -1, priorityScore: -1 });
    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/cancel/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    const dateStr = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    const slot = await Slot.findOne({ date: dateStr, time: appointment.appointmentTime });
    
    if (slot) {
      const field = appointment.processingTier === 'standard' ? 'publicBooked' : 'agentBooked';
      await Slot.updateOne(
        { _id: slot._id },
        { $inc: { [field]: -1 } }
      );
    }
    
    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }
    
    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

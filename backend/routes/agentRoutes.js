const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { generateQRCode, generateAppointmentId } = require('../utils/qrCode');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('agent', 'admin'));

router.post('/bulk-book', [
  body('date').isISO8601(),
  body('time').notEmpty(),
  body('count').isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, time, count, visaType = 'tourist' } = req.body;
    const dateStr = new Date(date).toISOString().split('T')[0];

    let slot = await Slot.findOne({ date: dateStr, time, isActive: true });

    if (!slot) {
      slot = await Slot.create({
        date: dateStr,
        time,
        totalSlots: 50,
        agentReservedPercent: 70,
        agentReservedSlots: 35,
        publicSlots: 15
      });
    }

    const availableAgentSlots = slot.agentReservedSlots - slot.agentBooked;
    const actualBookCount = Math.min(count, availableAgentSlots);

    if (actualBookCount <= 0) {
      return res.status(400).json({ message: 'No agent slots available' });
    }

    const appointmentsData = [];
    for (let i = 0; i < actualBookCount; i++) {
      const appointmentId = generateAppointmentId();
      const qrCode = await generateQRCode(appointmentId);
      
      appointmentsData.push({
        appointmentId,
        userId: req.user._id,
        agentId: req.user._id,
        visaType,
        appointmentDate: date,
        appointmentTime: time,
        qrCode,
        isReservedByAgent: true,
        isPublic: false,
        status: 'confirmed'
      });
    }

    const appointments = await Appointment.insertMany(appointmentsData);
    
    await Slot.updateOne(
      { _id: slot._id },
      { $inc: { agentBooked: actualBookCount } }
    );

    res.status(201).json({
      message: `Successfully booked ${actualBookCount} appointments`,
      booked: actualBookCount,
      appointments
    });
  } catch (error) {
    console.error('Bulk booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;
    let query = { isActive: true };
    
    if (date) {
      query.date = new Date(date).toISOString().split('T')[0];
    }

    const slots = await Slot.find(query).sort({ date: 1, time: 1 });
    
    const slotsWithAvailability = slots.map(slot => ({
      ...slot.toObject(),
      availableAgentSlots: slot.agentReservedSlots - slot.agentBooked,
      availablePublicSlots: slot.publicSlots - slot.publicBooked
    }));

    res.json({ slots: slotsWithAvailability });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/assign-appointment', [
  body('appointmentId').notEmpty(),
  body('applicantEmail').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { appointmentId, applicantEmail } = req.body;

    const applicant = await User.findOne({ email: applicantEmail });
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const appointment = await Appointment.findOne({
      appointmentId,
      agentId: req.user._id,
      isReservedByAgent: true
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or not owned by agent' });
    }

    appointment.userId = applicant._id;
    appointment.isPublic = true;
    appointment.status = 'confirmed';
    await appointment.save();

    res.json({
      message: 'Appointment assigned successfully',
      appointment: appointment.toObject()
    });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = { agentId: req.user._id };
    
    if (status) query.status = status;
    if (date) {
      query.appointmentDate = date;
    }

    const appointments = await Appointment.find(query).sort({ appointmentDate: 1 });
    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching agent appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const allAppointments = await Appointment.find({ agentId: req.user._id });
    const userIds = [...new Set(allAppointments.map(apt => apt.userId.toString()))];
    
    const clients = await User.find({ _id: { $in: userIds } });

    res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

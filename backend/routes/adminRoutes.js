const express = require('express');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const Settings = require('../models/Settings');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalUsers,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      cancelledAppointments,
      flaggedAppointments,
      todayAppointments,
      recentAppointments
    ] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ status: 'flagged' }),
      Appointment.countDocuments({ appointmentDate: today }),
      Appointment.find().sort({ createdAt: -1 }).limit(10)
    ]);

    const appointmentsByStatus = [
      { status: 'pending', count: pendingAppointments },
      { status: 'confirmed', count: confirmedAppointments },
      { status: 'cancelled', count: cancelledAppointments },
      { status: 'flagged', count: flaggedAppointments }
    ];

    res.json({
      stats: {
        totalUsers,
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        cancelledAppointments,
        flaggedAppointments,
        todayAppointments
      },
      recentAppointments,
      appointmentsByStatus
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const { status, flag, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (flag === 'true') query.fraudFlags = { $exists: true, $ne: [] };
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = startDate;
      if (endDate) query.appointmentDate.$lte = endDate;
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 })
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

router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed', 'flagged'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Status updated', appointment });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/slot-allocation', async (req, res) => {
  try {
    const { date, time, agentReservedPercent } = req.body;

    if (agentReservedPercent < 0 || agentReservedPercent > 100) {
      return res.status(400).json({ message: 'Percentage must be between 0 and 100' });
    }

    const dateStr = new Date(date).toISOString().split('T')[0];
    let slot = await Slot.findOne({ date: dateStr, time });

    if (!slot) {
      slot = await Slot.create({
        date: dateStr,
        time,
        totalSlots: 50
      });
    }

    slot.agentReservedPercent = agentReservedPercent;
    slot.agentReservedSlots = Math.floor(slot.totalSlots * agentReservedPercent / 100);
    slot.publicSlots = slot.totalSlots - slot.agentReservedSlots;
    await slot.save();

    res.json({ message: 'Slot allocation updated', slot });
  } catch (error) {
    console.error('Allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/fraud-patterns', async (req, res) => {
  try {
    const allAppointments = await Appointment.find();
    const flaggedAppointments = allAppointments.filter(apt => apt.fraudFlags && apt.fraudFlags.length > 0);

    const fraudStats = {
      total: flaggedAppointments.length,
      byType: {}
    };

    flaggedAppointments.forEach(apt => {
      apt.fraudFlags.forEach(flag => {
        if (!fraudStats.byType[flag.type]) {
          fraudStats.byType[flag.type] = { count: 0, examples: [] };
        }
        fraudStats.byType[flag.type].count += 1;
        if (fraudStats.byType[flag.type].examples.length < 3) {
          fraudStats.byType[flag.type].examples.push({
            appointmentId: apt.appointmentId,
            reason: flag.reason,
            user: apt.userId
          });
        }
      });
    });

    res.json({ fraudStats, flaggedAppointments: flaggedAppointments.slice(0, 20) });
  } catch (error) {
    console.error('Fraud patterns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password');

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.find();
    res.json({ settings });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { key, value, description, category } = req.body;

    await Settings.findOneAndUpdate(
      { key },
      { $set: { value, description, category } },
      { upsert: true, new: true }
    );

    res.json({ message: 'Setting updated' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/slots/generate', async (req, res) => {
  try {
    const { startDate, endDate, slotsPerDay, timeSlots } = req.body;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    let generated = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      for (const time of timeSlots) {
        const dateStr = d.toISOString().split('T')[0];
        const existing = await Slot.findOne({ date: dateStr, time });
        
        if (!existing) {
          await Slot.create({
            date: dateStr,
            time,
            totalSlots: slotsPerDay || 50,
            agentReservedPercent: 70,
            agentReservedSlots: Math.floor((slotsPerDay || 50) * 0.7),
            publicSlots: Math.floor((slotsPerDay || 50) * 0.3)
          });
          generated++;
        }
      }
    }
    
    res.json({ 
      message: `Generated ${generated} slots`,
      generated 
    });
  } catch (error) {
    console.error('Slot generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

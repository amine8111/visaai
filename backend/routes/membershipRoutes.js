const express = require('express');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const { authMiddleware } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const MEMBERSHIP_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Basic appointment booking',
      'QR code confirmation',
      'Up to 2 appointments/month',
      'Email notifications',
      'Standard processing queue'
    ],
    appointmentLimit: 2,
    priorityScore: 0,
    hasPrioritySlots: false,
    hasFaceToFace: false,
    hasExpressProcessing: false,
    hasVipSupport: false
  },
  gold: {
    name: 'Gold',
    price: 5000,
    features: [
      'All Free features',
      'Priority appointment slots',
      'Up to 5 appointments/month',
      'Faster processing queue',
      'Dedicated support channel',
      'AI risk assessment included',
      'Travel history tracking'
    ],
    appointmentLimit: 5,
    priorityScore: 50,
    hasPrioritySlots: true,
    hasFaceToFace: false,
    hasExpressProcessing: false,
    hasVipSupport: false
  },
  premium: {
    name: 'Premium',
    price: 15000,
    features: [
      'All Gold features',
      'VIP exclusive appointment slots',
      'Unlimited appointments/month',
      'Express processing',
      'Face-to-face meeting with Visa Agent',
      'Document verification session',
      '24/7 VIP support',
      'Always-first queue priority',
      'Premium lounge access'
    ],
    appointmentLimit: 999,
    priorityScore: 100,
    hasPrioritySlots: true,
    hasFaceToFace: true,
    hasExpressProcessing: true,
    hasVipSupport: true
  }
};

router.get('/plans', (req, res) => {
  res.json({ plans: MEMBERSHIP_PLANS });
});

router.get('/my-membership', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const currentPlan = MEMBERSHIP_PLANS[user.membership?.tier || 'free'];
    const isActive = user.isMembershipActive();
    
    res.json({
      tier: user.membership?.tier || 'free',
      startDate: user.membership?.startDate,
      expiryDate: user.membership?.expiryDate,
      isActive,
      appointmentsThisMonth: user.membership?.appointmentsThisMonth || 0,
      limit: currentPlan.appointmentLimit,
      plan: currentPlan
    });
  } catch (error) {
    console.error('Error fetching membership:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/upgrade', authMiddleware, async (req, res) => {
  try {
    const { tier, durationMonths = 1 } = req.body;

    if (!['gold', 'premium'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid tier. Choose gold or premium.' });
    }

    const plan = MEMBERSHIP_PLANS[tier];
    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const user = await User.findById(req.userId);
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    user.membership = {
      tier,
      startDate: new Date(),
      expiryDate,
      appointmentsThisMonth: user.membership?.appointmentsThisMonth || 0,
      lastAppointmentReset: new Date()
    };

    await user.save();

    res.json({
      message: `Upgraded to ${plan.name} successfully`,
      membership: {
        tier: user.membership.tier,
        startDate: user.membership.startDate,
        expiryDate: user.membership.expiryDate,
        plan
      }
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/book-meeting', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.isMembershipActive()) {
      return res.status(403).json({ message: 'Your membership has expired. Please renew.' });
    }

    if (user.membership?.tier !== 'premium') {
      return res.status(403).json({ 
        message: 'Face-to-face meetings are only available for Premium members. Please upgrade to Premium.',
        requiredTier: 'premium'
      });
    }

    const { meetingDate, meetingTime, meetingType = 'document_check', notes } = req.body;

    const meetingId = `MTG-${uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase()}`;

    const documentsToBring = [
      { name: 'Valid Passport', verified: false },
      { name: 'Visa Application Form', verified: false },
      { name: 'Passport Photos', verified: false },
      { name: 'Travel Itinerary', verified: false },
      { name: 'Proof of Accommodation', verified: false },
      { name: 'Financial Documents', verified: false }
    ];

    const meeting = await Meeting.create({
      meetingId,
      userId: user._id,
      meetingDate,
      meetingTime,
      meetingType,
      notes,
      documentsToBring,
      status: 'scheduled'
    });

    res.status(201).json({
      message: 'Meeting scheduled successfully',
      meeting
    });
  } catch (error) {
    console.error('Meeting booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my-meetings', authMiddleware, async (req, res) => {
  try {
    const meetings = await Meeting.find({ userId: req.userId })
      .sort({ meetingDate: -1 });
    res.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/meeting/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json({ meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/meeting/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    if (meeting.status === 'cancelled') {
      return res.status(400).json({ message: 'Meeting already cancelled' });
    }
    meeting.status = 'cancelled';
    await meeting.save();
    res.json({ message: 'Meeting cancelled' });
  } catch (error) {
    console.error('Cancel meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').notEmpty().trim(),
  body('phone').notEmpty(),
  body('role').optional().isIn(['applicant', 'agent', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, phone, role, passportNumber, nationality, dateOfBirth } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      email,
      password,
      fullName,
      phone,
      role: role || 'applicant',
      passportNumber,
      nationality,
      dateOfBirth,
      membership: {
        tier: 'free',
        startDate: new Date(),
        appointmentsThisMonth: 0,
        lastAppointmentReset: new Date()
      }
    });

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.resetMonthlyAppointments();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  req.user.resetMonthlyAppointments();
  await req.user.save();
  res.json({ user: req.user.toJSON() });
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['fullName', 'phone', 'nationality', 'dateOfBirth', 'passportNumber', 'profileImage'];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        req.user[field] = updates[field];
      }
    });
    
    await req.user.save();
    res.json({ message: 'Profile updated', user: req.user.toJSON() });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

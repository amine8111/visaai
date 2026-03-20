const express = require('express');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/meetings', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (status) query.status = status;

    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .populate('userId', 'fullName email phone membership')
      .sort({ meetingDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      meetings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/meeting/:id/assign', async (req, res) => {
  try {
    const { agentId } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { agentId },
      { new: true }
    ).populate('userId', 'fullName email phone');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({ message: 'Agent assigned', meeting });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/meeting/:id/status', async (req, res) => {
  try {
    const { status, notes, documentsToBring, verificationStatus, issuesFound } = req.body;

    const update = { status };
    if (notes !== undefined) update.notes = notes;
    if (verificationStatus) update.verificationStatus = verificationStatus;
    if (issuesFound) update.issuesFound = issuesFound;
    if (documentsToBring) update.documentsToBring = documentsToBring;

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('userId', 'fullName email phone membership');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({ message: 'Meeting updated', meeting });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/meeting/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('userId', 'fullName email phone membership passportNumber nationality')
      .populate('agentId', 'fullName email');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({ meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/meeting/:id/reschedule', async (req, res) => {
  try {
    const { meetingDate, meetingTime } = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { 
        meetingDate, 
        meetingTime, 
        status: 'rescheduled' 
      },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({ message: 'Meeting rescheduled', meeting });
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

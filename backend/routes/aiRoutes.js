const express = require('express');
const faceVerification = require('../utils/faceVerification');
const fraudDetection = require('../utils/fraudDetection');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify-face', authMiddleware, async (req, res) => {
  try {
    const { passportImage, selfieImage } = req.body;
    
    if (!passportImage || !selfieImage) {
      return res.status(400).json({ message: 'Both passport and selfie images are required' });
    }
    
    const result = await faceVerification.verifyIdentity(passportImage, selfieImage);
    
    res.json(result);
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/check-liveness', authMiddleware, async (req, res) => {
  try {
    const { selfieImage } = req.body;
    
    if (!selfieImage) {
      return res.status(400).json({ message: 'Selfie image is required' });
    }
    
    const result = await faceVerification.detectLiveness(selfieImage);
    
    res.json(result);
  } catch (error) {
    console.error('Liveness check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/analyze-risk', authMiddleware, async (req, res) => {
  try {
    const { passportNumber, email, ipAddress } = req.body;
    
    const result = await fraudDetection.analyzeRisk({
      passportNumber,
      email,
      ipAddress
    });
    
    res.json(result);
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/smart-allocation', authMiddleware, async (req, res) => {
  try {
    const { visaType, travelHistory, urgency } = req.query;
    
    let priorityScore = 0;
    
    if (visaType === 'business') priorityScore += 20;
    if (visaType === 'work') priorityScore += 25;
    if (visaType === 'student') priorityScore += 15;
    
    if (travelHistory === 'extensive') priorityScore += 30;
    else if (travelHistory === 'moderate') priorityScore += 15;
    
    if (urgency === 'high') priorityScore += 30;
    else if (urgency === 'medium') priorityScore += 15;
    
    const allocation = {
      priorityScore,
      suggestedTimeSlot: priorityScore > 50 ? 'morning' : 'afternoon',
      processingTier: priorityScore > 70 ? 'express' : 'standard'
    };
    
    res.json(allocation);
  } catch (error) {
    console.error('Smart allocation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

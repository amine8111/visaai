const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const VISA_CRITERIA = {
  tourist: {
    minAge: 18,
    maxAge: 70,
    requiredDocs: ['passport', 'photo', 'travel_itinerary', 'accommodation_proof', 'financial_proof'],
    maxDuration: 90,
    processingDays: 15,
    baseScore: 60
  },
  business: {
    minAge: 18,
    maxAge: 65,
    requiredDocs: ['passport', 'photo', 'invitation_letter', 'company_docs', 'financial_proof'],
    maxDuration: 180,
    processingDays: 10,
    baseScore: 75
  },
  student: {
    minAge: 16,
    maxAge: 50,
    requiredDocs: ['passport', 'photo', 'enrollment_letter', 'financial_proof', 'accommodation_proof'],
    maxDuration: 365,
    processingDays: 30,
    baseScore: 70
  },
  work: {
    minAge: 21,
    maxAge: 55,
    requiredDocs: ['passport', 'photo', 'work_permit', 'contract', 'qualifications', 'financial_proof'],
    maxDuration: 365,
    processingDays: 45,
    baseScore: 80
  },
  family: {
    minAge: 0,
    maxAge: 100,
    requiredDocs: ['passport', 'photo', 'family_bond_proof', 'sponsor_docs', 'financial_proof'],
    maxDuration: 365,
    processingDays: 20,
    baseScore: 70
  },
  transit: {
    minAge: 0,
    maxAge: 100,
    requiredDocs: ['passport', 'photo', 'ticket', 'visa_dest_country'],
    maxDuration: 5,
    processingDays: 5,
    baseScore: 50
  }
};

router.post('/assess', authMiddleware, [
  body('visaType').isIn(['tourist', 'business', 'student', 'work', 'family', 'transit']),
  body('nationality').notEmpty(),
  body('age').isInt({ min: 0, max: 120 }),
  body('duration').isInt({ min: 1 }),
  body('entryType').isIn(['single', 'multiple', 'double'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { visaType, nationality, age, duration, entryType, hasTravelHistory, hasPriorVisa, financialStable, employmentStatus, purpose } = req.body;

    const criteria = VISA_CRITERIA[visaType];
    if (!criteria) {
      return res.status(400).json({ message: 'Invalid visa type' });
    }

    let score = criteria.baseScore;
    const factors = [];
    const issues = [];
    const recommendations = [];

    if (age < criteria.minAge || age > criteria.maxAge) {
      issues.push(`Age ${age} is outside the recommended range (${criteria.minAge}-${criteria.maxAge}) for ${visaType} visa`);
      score -= 30;
    }

    if (duration > criteria.maxDuration) {
      issues.push(`Duration of ${duration} days exceeds maximum ${criteria.maxDuration} days for ${visaType} visa`);
      recommendations.push(`Consider applying for a shorter duration or a different visa category`);
      score -= 20;
    }

    if (financialStable) {
      score += 15;
      factors.push({ factor: 'Financial stability verified', points: 15, positive: true });
    } else {
      issues.push('Financial stability could not be verified');
      recommendations.push('Provide strong financial proof: bank statements, payslips, or sponsorship letter');
      score -= 15;
    }

    if (employmentStatus === 'employed' || employmentStatus === 'self_employed') {
      score += 10;
      factors.push({ factor: 'Stable employment', points: 10, positive: true });
    } else if (employmentStatus === 'student') {
      score += 5;
      factors.push({ factor: 'Student status (sponsorship assumed)', points: 5, positive: true });
    } else {
      score -= 5;
      issues.push('No stable employment or student status');
      recommendations.push('Provide proof of employment, student enrollment, or sponsor documents');
    }

    if (hasPriorVisa) {
      score += 15;
      factors.push({ factor: 'Prior visa history', points: 15, positive: true });
    } else {
      score -= 5;
      recommendations.push('Build travel history with shorter trips before applying');
    }

    if (hasTravelHistory) {
      score += 10;
      factors.push({ factor: 'Travel history verified', points: 10, positive: true });
    }

    if (entryType === 'multiple') {
      score += 5;
      factors.push({ factor: 'Multiple entry requested', points: 5, positive: true });
    }

    const nationalityRisk = {
      'Algeria': { adjustment: -5, note: 'Standard processing' },
      'Morocco': { adjustment: 0, note: 'Standard processing' },
      'Tunisia': { adjustment: 0, note: 'Standard processing' },
      'Egypt': { adjustment: -5, note: 'Additional documentation may be required' },
      'France': { adjustment: 10, note: 'EU citizen privileges' },
      'Germany': { adjustment: 10, note: 'EU citizen privileges' },
      'United States': { adjustment: 10, note: 'Low risk country' },
      'United Kingdom': { adjustment: 10, note: 'Low risk country' }
    };

    const natInfo = nationalityRisk[nationality] || { adjustment: 0, note: 'Standard processing' };
    score += natInfo.adjustment;

    const riskCountries = ['Nigeria', 'Pakistan', 'Afghanistan', 'Iran', 'Iraq', 'Syria', 'Somalia'];
    if (riskCountries.includes(nationality)) {
      score -= 20;
      issues.push(`${nationality} nationals may face additional scrutiny`);
      recommendations.push('Prepare comprehensive documentation and consider consulting an immigration lawyer');
    }

    score = Math.max(0, Math.min(100, score));

    let recommendation;
    let eligibility;

    if (score >= 80) {
      recommendation = 'Strong candidate for this visa. High chance of approval.';
      eligibility = 'eligible';
    } else if (score >= 60) {
      recommendation = 'Moderate chance of approval. Address listed issues and provide complete documentation.';
      eligibility = 'likely_eligible';
    } else if (score >= 40) {
      recommendation = 'Approval is uncertain. Significant improvements needed before applying.';
      eligibility = 'review';
    } else {
      recommendation = 'Low chance of approval with current profile. Consider alternative visa types or addressing issues first.';
      eligibility = 'not_eligible';
    }

    const estimatedProcessingDays = Math.max(3, criteria.processingDays + (score < 60 ? 15 : 0));
    const suggestedTier = score >= 80 ? 'premium' : score >= 60 ? 'gold' : 'free';

    res.json({
      assessmentId: `ASM-${Date.now().toString(36).toUpperCase()}`,
      visaType,
      eligibility,
      score,
      recommendation,
      estimatedProcessingDays,
      suggestedMembershipTier: suggestedTier,
      factors,
      issues,
      recommendations,
      nationalityInfo: natInfo,
      criteria: {
        minAge: criteria.minAge,
        maxAge: criteria.maxAge,
        maxDuration: criteria.maxDuration,
        requiredDocs: criteria.requiredDocs
      }
    });
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/criteria/:visaType', (req, res) => {
  const criteria = VISA_CRITERIA[req.params.visaType];
  if (!criteria) {
    return res.status(404).json({ message: 'Visa type not found' });
  }
  res.json({ visaType: req.params.visaType, ...criteria });
});

router.get('/required-docs/:visaType', (req, res) => {
  const criteria = VISA_CRITERIA[req.params.visaType];
  if (!criteria) {
    return res.status(404).json({ message: 'Visa type not found' });
  }
  
  const docDescriptions = {
    passport: { name: 'Valid Passport', description: 'Passport valid for at least 6 months beyond travel dates', required: true },
    photo: { name: 'Passport Photo', description: 'Recent passport-sized photograph (35x45mm, white background)', required: true },
    travel_itinerary: { name: 'Travel Itinerary', description: 'Round-trip flight booking or travel plan', required: true },
    accommodation_proof: { name: 'Accommodation Proof', description: 'Hotel bookings or invitation letter with address', required: true },
    financial_proof: { name: 'Financial Proof', description: 'Bank statements (last 3 months), payslips, or sponsorship letter', required: true },
    invitation_letter: { name: 'Invitation Letter', description: 'Official invitation from host company in destination country', required: true },
    company_docs: { name: 'Company Documents', description: 'Company registration, business license, or employment contract', required: true },
    enrollment_letter: { name: 'Enrollment Letter', description: 'Official enrollment confirmation from educational institution', required: true },
    work_permit: { name: 'Work Permit', description: 'Approved work permit or LMIA from destination country', required: true },
    contract: { name: 'Employment Contract', description: 'Signed employment contract with salary details', required: true },
    qualifications: { name: 'Qualifications', description: 'Educational certificates, degrees, or professional licenses', required: true },
    family_bond_proof: { name: 'Family Bond Proof', description: 'Birth certificate, marriage certificate, or family registry', required: true },
    sponsor_docs: { name: 'Sponsor Documents', description: 'Sponsor ID, residence permit, and financial guarantee letter', required: true },
    ticket: { name: 'Travel Ticket', description: 'Confirmed onward/return travel ticket', required: true },
    visa_dest_country: { name: 'Destination Visa', description: 'Valid visa for next destination (if applicable)', required: true }
  };

  const docs = criteria.requiredDocs.map(docId => ({
    id: docId,
    ...docDescriptions[docId]
  }));

  res.json({ visaType: req.params.visaType, documents: docs });
});

module.exports = router;

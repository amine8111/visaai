const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const COUNTRY_REQUIREMENTS = {
  schengen: {
    name: 'Schengen Area',
    countries: ['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Portugal', 'Greece'],
    generalRequirements: {
      minBankBalance: 5000,
      minAccountAge: 6,
      minMonthlyIncome: 1500,
      travelInsurance: true,
      accommodationProof: true
    }
  },
  uk: {
    name: 'United Kingdom',
    countries: ['United Kingdom'],
    generalRequirements: {
      minBankBalance: 10000,
      minAccountAge: 3,
      minMonthlyIncome: 2500,
      travelInsurance: true,
      accommodationProof: true,
      englishTest: false
    }
  },
  usa: {
    name: 'United States',
    countries: ['United States'],
    generalRequirements: {
      minBankBalance: 15000,
      minAccountAge: 6,
      minMonthlyIncome: 3000,
      travelInsurance: true,
      accommodationProof: true,
      interviewRequired: true
    }
  },
  canada: {
    name: 'Canada',
    countries: ['Canada'],
    generalRequirements: {
      minBankBalance: 12000,
      minAccountAge: 6,
      minMonthlyIncome: 2500,
      travelInsurance: true,
      accommodationProof: true,
      biometricsRequired: true
    }
  },
  uae: {
    name: 'UAE / GCC',
    countries: ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman'],
    generalRequirements: {
      minBankBalance: 3000,
      minAccountAge: 3,
      minMonthlyIncome: 1000,
      travelInsurance: false,
      accommodationProof: true
    }
  },
  australia: {
    name: 'Australia',
    countries: ['Australia'],
    generalRequirements: {
      minBankBalance: 10000,
      minAccountAge: 6,
      minMonthlyIncome: 3000,
      travelInsurance: true,
      accommodationProof: true,
      healthCheck: true
    }
  }
};

router.post('/check', authMiddleware, [
  body('destination').notEmpty(),
  body('visaType').notEmpty(),
  body('nationality').notEmpty(),
  body('age').isInt({ min: 0, max: 120 }),
  body('bankBalance').isFloat({ min: 0 }),
  body('monthlyIncome').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { destination, visaType, nationality, age, bankBalance, monthlyIncome, accountAge, employmentStatus, hasTravelHistory, hasPriorRejection, passportValidity } = req.body;

    let region = null;
    for (const [key, data] of Object.entries(COUNTRY_REQUIREMENTS)) {
      if (data.countries.some(c => destination.toLowerCase().includes(c.toLowerCase()))) {
        region = key;
        break;
      }
    }

    if (!region) {
      region = 'schengen';
    }

    const reqs = COUNTRY_REQUIREMENTS[region].generalRequirements;
    let score = 0;
    let maxScore = 100;
    const checks = [];
    const missing = [];
    const suggestions = [];

    if (bankBalance >= reqs.minBankBalance) {
      score += 25;
      checks.push({ item: 'Bank Balance', status: 'pass', detail: `${bankBalance} >= ${reqs.minBankBalance} required` });
    } else {
      const deficit = reqs.minBankBalance - bankBalance;
      missing.push(`Bank balance is ${deficit} below requirement of ${reqs.minBankBalance}`);
      suggestions.push(`Save an additional ${deficit} before applying, or provide a sponsor's guarantee`);
      checks.push({ item: 'Bank Balance', status: 'fail', detail: `${bankBalance} < ${reqs.minBankBalance} required` });
    }

    if (monthlyIncome >= reqs.minMonthlyIncome) {
      score += 20;
      checks.push({ item: 'Monthly Income', status: 'pass', detail: `${monthlyIncome} >= ${reqs.minMonthlyIncome} required` });
    } else {
      missing.push(`Monthly income is below minimum of ${reqs.minMonthlyIncome}`);
      suggestions.push('Provide additional income sources or a sponsor');
      checks.push({ item: 'Monthly Income', status: 'fail', detail: `${monthlyIncome} < ${reqs.minMonthlyIncome} required` });
    }

    if (accountAge >= reqs.minAccountAge) {
      score += 15;
      checks.push({ item: 'Account Age', status: 'pass', detail: `${accountAge} months >= ${reqs.minAccountAge} required` });
    } else {
      missing.push(`Bank account is ${reqs.minAccountAge - accountAge} months too new`);
      suggestions.push(`Wait ${reqs.minAccountAge - accountAge} more months, or provide alternative financial proof`);
      score -= 10;
      checks.push({ item: 'Account Age', status: 'warn', detail: `${accountAge} months < ${reqs.minAccountAge} required` });
    }

    if (employmentStatus === 'employed' || employmentStatus === 'self_employed') {
      score += 20;
      checks.push({ item: 'Employment Status', status: 'pass', detail: 'Stable employment verified' });
    } else if (employmentStatus === 'student' || employmentStatus === 'retired') {
      score += 10;
      checks.push({ item: 'Employment Status', status: 'pass', detail: 'Student/Retired status accepted with sponsorship' });
    } else {
      score -= 10;
      missing.push('No stable employment or student status');
      suggestions.push('Provide employment contract or sponsor documents');
      checks.push({ item: 'Employment Status', status: 'fail', detail: 'Stable employment required or sponsor needed' });
    }

    if (hasTravelHistory) {
      score += 10;
      checks.push({ item: 'Travel History', status: 'pass', detail: 'Prior international travel verified' });
    } else {
      score -= 5;
      suggestions.push('Build travel history with easier destinations before applying');
      checks.push({ item: 'Travel History', status: 'warn', detail: 'No prior travel history detected' });
    }

    if (!hasPriorRejection) {
      score += 10;
      checks.push({ item: 'Prior Rejections', status: 'pass', detail: 'No prior visa rejections' });
    } else {
      score -= 30;
      missing.push('Prior visa rejection on record');
      suggestions.push('Wait 6+ months after rejection, address the reason, or consult an immigration lawyer');
      checks.push({ item: 'Prior Rejections', status: 'fail', detail: 'Previous visa rejection detected' });
    }

    if (passportValidity >= 6) {
      score += 10;
      checks.push({ item: 'Passport Validity', status: 'pass', detail: `${passportValidity} months validity` });
    } else {
      score -= 10;
      missing.push(`Passport only has ${passportValidity} months validity (need 6+ months)`);
      suggestions.push('Renew your passport before applying');
      checks.push({ item: 'Passport Validity', status: 'fail', detail: `${passportValidity} months < 6 required` });
    }

    if (reqs.travelInsurance) {
      score += 5;
      checks.push({ item: 'Travel Insurance', status: 'recommend', detail: 'Travel insurance required' });
    }
    if (reqs.accommodationProof) {
      score += 5;
      checks.push({ item: 'Accommodation Proof', status: 'recommend', detail: 'Hotel/host proof required' });
    }

    score = Math.max(0, Math.min(100, score));

    let eligibility;
    let eligibilityLabel;

    if (score >= 85) {
      eligibility = 'eligible';
      eligibilityLabel = 'Highly Likely to Be Approved';
    } else if (score >= 70) {
      eligibility = 'likely_eligible';
      eligibilityLabel = 'Likely to Be Approved';
    } else if (score >= 50) {
      eligibility = 'conditional';
      eligibilityLabel = 'Approval Depends on Documentation';
    } else {
      eligibility = 'not_eligible';
      eligibilityLabel = 'Not Recommended to Apply Yet';
    }

    const processingTime = {
      schengen: '15-30 working days',
      uk: '15-21 working days',
      usa: '3-5 weeks',
      canada: '4-8 weeks',
      uae: '3-7 working days',
      australia: '20-30 working days'
    };

    res.json({
      eligibilityId: `ELG-${Date.now().toString(36).toUpperCase()}`,
      destination,
      visaType,
      nationality,
      eligibility,
      eligibilityLabel,
      overallScore: score,
      processingTime: processingTime[region] || '15-30 days',
      region: COUNTRY_REQUIREMENTS[region].name,
      checks,
      missingRequirements: missing,
      suggestions,
      recommendedDocs: getRecommendedDocs(region, visaType)
    });
  } catch (error) {
    console.error('Eligibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

function getRecommendedDocs(region, visaType) {
  const baseDocs = ['passport', 'photo_id', 'bank_statements', 'employment_letter'];
  
  const regionDocs = {
    schengen: ['travel_itinerary', 'accommodation', 'travel_insurance', 'travel_history'],
    uk: ['invitation', 'accommodation', 'travel_insurance', 'english_proof'],
    usa: ['ds160', 'photo', 'travel_itinerary', 'travel_insurance'],
    canada: ['travel_itinerary', 'accommodation', 'travel_insurance', 'biometrics'],
    uae: ['hotel_bookings', 'travel_itinerary'],
    australia: ['travel_insurance', 'health_insurance', 'accommodation']
  };

  return [...baseDocs, ...(regionDocs[region] || [])];
}

router.get('/countries', (req, res) => {
  const countries = [];
  Object.values(COUNTRY_REQUIREMENTS).forEach(region => {
    region.countries.forEach(country => {
      countries.push({ country, region: region.name });
    });
  });
  res.json({ countries: [...new Set(countries.map(c => c.country))].map(country => ({
    country,
    region: countries.find(c => c.country === country)?.region
  })) });
});

router.get('/requirements/:country', (req, res) => {
  for (const [key, data] of Object.entries(COUNTRY_REQUIREMENTS)) {
    if (data.countries.some(c => req.params.country.toLowerCase().includes(c.toLowerCase()))) {
      return res.json({
        country: req.params.country,
        region: data.name,
        requirements: data.generalRequirements
      });
    }
  }
  res.status(404).json({ message: 'Country not found' });
});

module.exports = router;

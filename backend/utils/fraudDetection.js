const fraudDetection = {
  checkDuplicateBooking: async (passportNumber, email) => {
    const Appointment = require('../models/Appointment');
    const User = require('../models/User');
    
    const existingAppointments = await Appointment.find({
      'applicationData.passportNumber': passportNumber,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingAppointments.length > 0) {
      return {
        flagged: true,
        reason: 'Duplicate passport booking detected',
        type: 'duplicate_passport'
      };
    }
    
    const user = await User.findOne({ email });
    if (user) {
      const userAppointments = await Appointment.find({
        userId: user._id,
        status: { $in: ['pending', 'confirmed'] }
      });
      
      const today = new Date().toISOString().split('T')[0];
      const futureAppointments = userAppointments.filter(apt => 
        new Date(apt.appointmentDate) >= new Date(today)
      );
      
      if (futureAppointments.length >= 2) {
        return {
          flagged: true,
          reason: 'Multiple active appointments for same user',
          type: 'multiple_bookings'
        };
      }
    }
    
    return { flagged: false };
  },

  checkBulkBookings: async (agentId, date) => {
    const Appointment = require('../models/Appointment');
    
    const appointments = await Appointment.find({
      agentId,
      appointmentDate: date,
      isReservedByAgent: true
    });
    
    if (appointments.length > 20) {
      return {
        flagged: true,
        reason: 'High volume booking detected',
        type: 'bulk_booking',
        count: appointments.length
      };
    }
    
    return { flagged: false };
  },

  checkSuspiciousIP: async (ipAddress) => {
    const suspiciousPatterns = ['100.0.0.', '10.0.0.'];
    const isSuspicious = suspiciousPatterns.some(pattern => 
      ipAddress && ipAddress.startsWith(pattern)
    );
    
    return {
      flagged: isSuspicious,
      reason: isSuspicious ? 'Suspicious IP pattern detected' : null,
      type: 'suspicious_ip'
    };
  },

  checkDocumentReuse: async (documentHash) => {
    const Appointment = require('../models/Appointment');
    
    const appointments = await Appointment.find({ 'documents.url': documentHash });
    
    if (appointments.length > 1) {
      return {
        flagged: true,
        reason: 'Document appears to be reused',
        type: 'document_reuse',
        instances: appointments.length
      };
    }
    
    return { flagged: false };
  },

  analyzeRisk: async (bookingData) => {
    const flags = [];
    
    const duplicateCheck = await fraudDetection.checkDuplicateBooking(
      bookingData.passportNumber,
      bookingData.email
    );
    if (duplicateCheck.flagged) flags.push(duplicateCheck);
    
    if (bookingData.ipAddress) {
      const ipCheck = await fraudDetection.checkSuspiciousIP(bookingData.ipAddress);
      if (ipCheck.flagged) flags.push(ipCheck);
    }
    
    const riskScore = flags.length * 25;
    
    return {
      riskLevel: riskScore >= 75 ? 'high' : riskScore >= 50 ? 'medium' : 'low',
      riskScore,
      flags,
      shouldBlock: riskScore >= 75
    };
  }
};

module.exports = fraudDetection;

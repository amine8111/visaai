require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Slot = require('./models/Slot');
const Appointment = require('./models/Appointment');
const Meeting = require('./models/Meeting');

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Slot.deleteMany({});
    await Appointment.deleteMany({});
    await Meeting.deleteMany({});
    console.log('Cleared existing data');

    const admin = await User.create({
      email: 'admin@visaai.com',
      password: 'admin123',
      fullName: 'Admin User',
      phone: '0555123456',
      role: 'admin',
      isVerified: true,
      membership: { tier: 'premium', startDate: new Date(), expiryDate: null, appointmentsThisMonth: 0 }
    });
    console.log(`Created admin: admin@visaai.com / admin123`);

    const agent = await User.create({
      email: 'agent@visaai.com',
      password: 'agent123',
      fullName: 'Agent User',
      phone: '0555234567',
      role: 'agent',
      isVerified: true,
      membership: { tier: 'gold', startDate: new Date(), appointmentsThisMonth: 0 }
    });
    console.log(`Created agent: agent@visaai.com / agent123`);

    const applicantFree = await User.create({
      email: 'applicant@visaai.com',
      password: 'applicant123',
      fullName: 'Free Tier Applicant',
      phone: '0555345678',
      role: 'applicant',
      nationality: 'Algeria',
      dateOfBirth: '1990-01-15',
      passportNumber: 'E1234567',
      isVerified: true,
      membership: { tier: 'free', startDate: new Date(), appointmentsThisMonth: 0, lastAppointmentReset: new Date() }
    });
    console.log(`Created applicant (Free): applicant@visaai.com / applicant123`);

    const applicantGold = await User.create({
      email: 'gold@visaai.com',
      password: 'gold123',
      fullName: 'Gold Tier Applicant',
      phone: '0555456789',
      role: 'applicant',
      nationality: 'Algeria',
      isVerified: true,
      membership: { tier: 'gold', startDate: new Date(), appointmentsThisMonth: 0, lastAppointmentReset: new Date() }
    });
    console.log(`Created applicant (Gold): gold@visaai.com / gold123`);

    const applicantPremium = await User.create({
      email: 'premium@visaai.com',
      password: 'premium123',
      fullName: 'Premium Tier Applicant',
      phone: '0555567890',
      role: 'applicant',
      nationality: 'Algeria',
      isVerified: true,
      membership: { tier: 'premium', startDate: new Date(), appointmentsThisMonth: 0, lastAppointmentReset: new Date() }
    });
    console.log(`Created applicant (Premium): premium@visaai.com / premium123`);

    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      for (const time of ['09:00', '11:00', '14:00', '16:00']) {
        await Slot.create({
          date: dateStr,
          time,
          totalSlots: 50,
          agentReservedPercent: 70,
          agentReservedSlots: 35,
          publicSlots: 15,
          agentBooked: 0,
          publicBooked: 0,
          isActive: true
        });
      }
    }
    console.log('Created slots for the next 14 days (4 time slots per day)');

    const apt = await Appointment.create({
      appointmentId: 'VA-FREETEST1234',
      userId: applicantFree._id,
      visaType: 'tourist',
      appointmentDate: new Date(today.getTime() + 86400000 * 3).toISOString().split('T')[0],
      appointmentTime: '09:00',
      status: 'confirmed',
      qrCode: 'data:image/png;base64,test',
      isPublic: true,
      priorityScore: 0,
      processingTier: 'standard',
      applicationData: {
        passportNumber: 'E1234567',
        purpose: 'Tourism',
        duration: '14 days',
        destination: 'Paris',
        entryType: 'single'
      }
    });
    console.log(`Created sample appointment: ${apt.appointmentId}`);

    console.log('\n--- Test Accounts ---');
    console.log('Admin:    admin@visaai.com    / admin123');
    console.log('Agent:    agent@visaai.com    / agent123');
    console.log('Free:     applicant@visaai.com / applicant123');
    console.log('Gold:     gold@visaai.com     / gold123');
    console.log('Premium:  premium@visaai.com / premium123');
    console.log('\n--- MongoDB Migration Complete ---');

    process.exit(0);
  } catch (error) {
    console.error('Seeder error:', error);
    process.exit(1);
  }
};

seed();

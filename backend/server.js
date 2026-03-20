require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const agentRoutes = require('./routes/agentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminMeetingRoutes = require('./routes/adminMeetingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const eligibilityRoutes = require('./routes/eligibilityRoutes');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://visa-9c6jdewnj-amine8111s-projects.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/meetings', adminMeetingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/eligibility', eligibilityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'VisaAI API is running', database: 'mongodb' });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

module.exports = app;

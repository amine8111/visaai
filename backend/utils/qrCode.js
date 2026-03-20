const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const generateQRCode = async (appointmentId) => {
  try {
    const qrData = JSON.stringify({
      appointmentId,
      timestamp: Date.now(),
      verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${appointmentId}`
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw error;
  }
};

const generateAppointmentId = () => {
  const uuid = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  return `VA-${uuid}`;
};

module.exports = { generateQRCode, generateAppointmentId };

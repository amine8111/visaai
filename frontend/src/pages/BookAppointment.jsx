import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { appointmentAPI, agentAPI, membershipAPI } from '../services/api';
import { format, addDays } from 'date-fns';

const BookAppointment = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    visaType: 'tourist',
    appointmentDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    appointmentTime: '09:00',
    passportNumber: '',
    purpose: '',
    duration: '',
    destination: '',
    entryType: 'single'
  });

  useEffect(() => {
    fetchSlots();
    fetchMembership();
  }, [formData.appointmentDate]);

  const fetchSlots = async () => {
    try {
      const response = await agentAPI.getSlots(formData.appointmentDate);
      setSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const fetchMembership = async () => {
    try {
      const response = await membershipAPI.getMyMembership();
      setMembership(response.data);
    } catch (error) {
      console.error('Error fetching membership:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    try {
      const response = await appointmentAPI.book(formData);
      setSuccess(response.data);
      fetchMembership();
    } catch (error) {
      const msg = error.response?.data?.message || 'Booking failed';
      const currentTier = error.response?.data?.currentTier;
      if (currentTier) {
        alert(`${msg}\n\nUpgrade your membership for more bookings.`);
      } else {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      free: 'bg-gray-100 border-gray-300 text-gray-700',
      gold: 'bg-yellow-50 border-yellow-400 text-yellow-800',
      premium: 'bg-purple-50 border-purple-400 text-purple-800'
    };
    return colors[tier] || colors.free;
  };

  const getTierBadge = (tier) => {
    const badges = {
      free: 'bg-gray-500',
      gold: 'bg-yellow-500',
      premium: 'bg-purple-600'
    };
    return badges[tier] || badges.free;
  };

  const tier = membership?.tier || 'free';
  const appointmentsUsed = membership?.appointmentsThisMonth || 0;
  const appointmentsLimit = membership?.limit || 2;
  const isAtLimit = appointmentsUsed >= appointmentsLimit && tier === 'free';

  return (
    <div className="max-w-2xl mx-auto">
      <div className={`p-4 rounded-xl border-2 mb-6 ${getTierColor(tier)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getTierBadge(tier)}`}>
              {tier.toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium">{t('appointmentsThisMonth')}</p>
              <p className="text-xs opacity-75">{appointmentsUsed} / {appointmentsLimit} used</p>
            </div>
          </div>
          {isAtLimit && (
            <div className="text-right">
              <p className="text-xs font-medium text-red-600">{t('limitReached')}</p>
              <a href="/membership" className="text-xs text-primary-600 hover:underline">
                {t('upgradeForMore')} →
              </a>
            </div>
          )}
        </div>
        <div className="mt-2 flex gap-3 text-xs">
          {tier === 'free' && <span className="bg-white/50 px-2 py-1 rounded">Standard queue</span>}
          {tier === 'gold' && <span className="bg-white/50 px-2 py-1 rounded">✓ Priority slots</span>}
          {tier === 'premium' && (
            <>
              <span className="bg-white/50 px-2 py-1 rounded">✓ Express processing</span>
              <span className="bg-white/50 px-2 py-1 rounded">✓ Face-to-face meeting</span>
            </>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('bookAppointment')}</h1>

      {success ? (
        <div className="card text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-green-600 mb-2">{t('bookingSuccess')}</h2>
          <div className="bg-gray-50 p-4 rounded-lg mt-4 text-left">
            <p><strong>Appointment ID:</strong> {success.appointment?.appointmentId}</p>
            <p><strong>{t('date')}:</strong> {success.appointment?.appointmentDate ? format(new Date(success.appointment.appointmentDate), 'MMMM dd, yyyy') : '-'}</p>
            <p><strong>{t('time')}:</strong> {success.appointment?.appointmentTime}</p>
            <p><strong>{t('visaType')}:</strong> {t(success.appointment?.visaType)}</p>
            <p><strong>{t('status')}:</strong> {t(success.appointment?.status)}</p>
            {success.appointment?.processingTier && (
              <p className="mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  success.appointment.processingTier === 'express' ? 'bg-purple-100 text-purple-700' :
                  success.appointment.processingTier === 'priority' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {success.appointment.processingTier.toUpperCase()} Processing
                </span>
              </p>
            )}
          </div>
          {success.appointment?.qrCode && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">{t('qrCode')}</p>
              <img src={success.appointment.qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
            </div>
          )}
          <button
            onClick={() => setSuccess(null)}
            className="btn btn-primary mt-6"
          >
            Book Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">{t('visaType')}</label>
            <select
              className="input"
              value={formData.visaType}
              onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
              required
            >
              <option value="tourist">{t('tourist')}</option>
              <option value="business">{t('business')}</option>
              <option value="student">{t('student')}</option>
              <option value="work">{t('work')}</option>
              <option value="family">{t('family')}</option>
              <option value="transit">{t('transit')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('date')}</label>
              <input
                type="date"
                className="input"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
            <div>
              <label className="label">{t('time')}</label>
              <select
                className="input"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
              >
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
              </select>
            </div>
          </div>

          {slots.length > 0 && (
            <div className={`p-3 rounded-lg text-sm ${
              tier === 'free' ? 'bg-blue-50 text-blue-700' :
              tier === 'gold' ? 'bg-yellow-50 text-yellow-700' :
              'bg-purple-50 text-purple-700'
            }`}>
              {tier === 'free' ? (
                <p>Available public slots: {slots[0]?.availablePublicSlots || 0}</p>
              ) : tier === 'gold' ? (
                <p>Priority access — all slots available: {slots[0]?.totalSlots - slots[0]?.publicBooked - slots[0]?.agentBooked || 0}</p>
              ) : (
                <p>Premium access — express queue: {slots[0]?.availableAgentSlots || 0} VIP slots available</p>
              )}
            </div>
          )}

          <div>
            <label className="label">{t('passportNumber')}</label>
            <input
              type="text"
              className="input"
              value={formData.passportNumber}
              onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">{t('purpose')}</label>
            <input
              type="text"
              className="input"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('duration')}</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., 2 weeks"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">{t('destination')}</label>
              <input
                type="text"
                className="input"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">{t('entryType')}</label>
            <select
              className="input"
              value={formData.entryType}
              onChange={(e) => setFormData({ ...formData, entryType: e.target.value })}
              required
            >
              <option value="single">{t('single')}</option>
              <option value="multiple">{t('multiple')}</option>
              <option value="double">{t('double')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || isAtLimit}
            className="btn btn-primary w-full py-3"
          >
            {loading ? t('processing') : t('confirmBooking')}
          </button>

          {isAtLimit && (
            <p className="text-center text-sm text-red-600">
              {t('limitReached')}.{' '}
              <a href="/membership" className="underline">{t('upgradeMembership')}</a>
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default BookAppointment;

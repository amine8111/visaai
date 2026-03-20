import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { membershipAPI } from '../services/api';
import { format, addDays } from 'date-fns';

const MembershipPage = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingData, setMeetingData] = useState({
    meetingDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    meetingTime: '10:00',
    meetingType: 'document_check',
    notes: ''
  });
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [memRes, plansRes] = await Promise.all([
        membershipAPI.getMyMembership(),
        membershipAPI.getPlans()
      ]);
      setMembership(memRes.data);
      setPlans(plansRes.data.plans);
    } catch (error) {
      console.error('Error loading membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier, months = 1) => {
    setUpgrading(true);
    try {
      await membershipAPI.upgrade(tier, months);
      await loadData();
      const userRes = await membershipAPI.getMyMembership();
      updateProfile({ membership: userRes.data });
      setSuccess(t('upgradeSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  const handleBookMeeting = async (e) => {
    e.preventDefault();
    setMeetingLoading(true);
    try {
      await membershipAPI.bookMeeting(meetingData);
      setShowMeetingForm(false);
      setMeetingData({
        meetingDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
        meetingTime: '10:00',
        meetingType: 'document_check',
        notes: ''
      });
      setSuccess(t('meetingSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Booking failed');
    } finally {
      setMeetingLoading(false);
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

  const getTierBadgeColor = (tier) => {
    const colors = {
      free: 'bg-gray-500',
      gold: 'bg-yellow-500',
      premium: 'bg-purple-600'
    };
    return colors[tier] || colors.free;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center font-medium">
          {success}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('myMembership')}</h1>
        <p className="text-gray-500 mt-1">{t('choosePlan')}</p>
      </div>

      <div className={`p-6 rounded-xl border-2 mb-8 ${getTierColor(membership?.tier)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getTierBadgeColor(membership?.tier)}`}>
                {t(membership?.tier || 'free').toUpperCase()}
              </span>
              {membership?.isActive ? (
                <span className="text-sm text-green-600 font-medium">{t('active')}</span>
              ) : (
                <span className="text-sm text-red-600 font-medium">{t('expired')}</span>
              )}
            </div>
            <p className="text-sm opacity-75">
              {membership?.expiryDate ? `Expires: ${format(new Date(membership.expiryDate), 'MMM dd, yyyy')}` : 'No expiry'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">{t('appointmentsThisMonth')}</p>
            <p className="text-2xl font-bold">
              {membership?.appointmentsThisMonth || 0} / {membership?.limit || 2}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(membership?.plan?.features || []).map((feature, i) => (
            <span key={i} className="text-xs bg-white/50 px-2 py-1 rounded">✓ {feature}</span>
          ))}
        </div>
      </div>

      {membership?.tier === 'premium' && (
        <div className="card mb-8 border-2 border-purple-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-purple-800">{t('faceToFaceMeeting')}</h3>
              <p className="text-sm text-gray-500">{t('premiumOnly')}</p>
            </div>
            <span className="text-2xl">🤝</span>
          </div>

          {showMeetingForm ? (
            <form onSubmit={handleBookMeeting} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('date')}</label>
                  <input
                    type="date"
                    className="input"
                    value={meetingData.meetingDate}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingDate: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('time')}</label>
                  <select
                    className="input"
                    value={meetingData.meetingTime}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingTime: e.target.value })}
                    required
                  >
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">{t('meetingType')}</label>
                <select
                  className="input"
                  value={meetingData.meetingType}
                  onChange={(e) => setMeetingData({ ...meetingData, meetingType: e.target.value })}
                >
                  <option value="document_check">{t('documentCheck')}</option>
                  <option value="interview">{t('interview')}</option>
                  <option value="general">{t('general')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('notes')}</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Any specific questions or topics..."
                  value={meetingData.notes}
                  onChange={(e) => setMeetingData({ ...meetingData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary" disabled={meetingLoading}>
                  {meetingLoading ? t('processing') : t('scheduleMeeting')}
                </button>
                <button type="button" onClick={() => setShowMeetingForm(false)} className="btn btn-secondary">
                  {t('cancel')}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowMeetingForm(true)} className="btn bg-purple-600 text-white hover:bg-purple-700">
              {t('bookFaceToFace')}
            </button>
          )}
        </div>
      )}

      {membership?.tier !== 'premium' && (
        <div className="card mb-8 border-2 border-purple-200 bg-purple-50">
          <div className="flex items-center gap-4">
            <span className="text-4xl">👑</span>
            <div>
              <h3 className="font-bold text-purple-800">{t('upgradeToPremium')}</h3>
              <p className="text-sm text-purple-600 mt-1">{t('premiumOnly')}</p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">{t('choosePlan')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans && Object.entries(plans).map(([key, plan]) => {
          const isCurrentPlan = membership?.tier === key;
          const isLower = (key === 'free' && membership?.tier === 'free') ||
                          (key === 'gold' && ['gold', 'premium'].includes(membership?.tier)) ||
                          (key === 'premium' && membership?.tier === 'premium');

          return (
            <div
              key={key}
              className={`card border-2 transition-all ${
                key === 'premium' ? 'border-purple-400 ring-2 ring-purple-100' :
                key === 'gold' ? 'border-yellow-300' : 'border-gray-200'
              }`}
            >
              <div className="text-center mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-bold mb-2 ${
                  key === 'premium' ? 'bg-purple-600' : key === 'gold' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}>
                  {plan.name}
                </span>
                <p className="text-3xl font-bold">
                  {plan.price === 0 ? 'Free' : `${plan.price} DA`}
                </p>
                <p className="text-sm text-gray-500">/ month</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <button className="btn btn-secondary w-full" disabled>
                  {t('currentPlan')}
                </button>
              ) : key !== 'free' ? (
                <button
                  onClick={() => handleUpgrade(key, 1)}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    key === 'premium'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                  disabled={upgrading}
                >
                  {upgrading ? t('processing') : `${t('upgradeMembership')} →`}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembershipPage;

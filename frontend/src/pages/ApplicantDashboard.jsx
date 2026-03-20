import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { appointmentAPI, membershipAPI } from '../services/api';
import { format } from 'date-fns';

const ApplicantDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aptRes, memRes] = await Promise.all([
        appointmentAPI.getMyAppointments(),
        membershipAPI.getMyMembership()
      ]);
      setAppointments(aptRes.data.appointments || []);
      setMembership(memRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      completed: 'status-completed',
      flagged: 'status-flagged'
    };
    return classes[status] || 'status-pending';
  };

  const getTierColor = (tier) => {
    const colors = {
      free: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
      gold: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-400' },
      premium: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-400' }
    };
    return colors[tier] || colors.free;
  };

  const getProcessingBadge = (tier) => {
    const badges = {
      express: { label: 'Express', class: 'bg-purple-100 text-purple-700' },
      priority: { label: 'Priority', class: 'bg-yellow-100 text-yellow-700' },
      standard: { label: 'Standard', class: 'bg-gray-100 text-gray-600' }
    };
    return badges[tier] || badges.standard;
  };

  const tierColors = getTierColor(membership?.tier);

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    today: appointments.filter(a => {
      const today = new Date();
      const aptDate = new Date(a.appointmentDate);
      return aptDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('welcome')}, {user?.fullName}!
          </h1>
          <p className="text-gray-500 capitalize">{user?.role}</p>
        </div>

        {membership && (
          <div className={`px-4 py-2 rounded-xl border-2 ${tierColors.bg} ${tierColors.border}`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold capitalize ${tierColors.text}`}>
                {t(membership.tier || 'free')}
              </span>
              <span className="text-sm text-gray-500">Tier</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>
                {membership.appointmentsThisMonth || 0} / {membership.limit || 2} {t('appointmentsThisMonth').toLowerCase()}
              </span>
              {membership.isActive ? (
                <span className="text-green-600 font-medium">{t('active')}</span>
              ) : (
                <span className="text-red-600 font-medium">{t('expired')}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">{t('totalAppointments')}</p>
          <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('pendingAppointments')}</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('confirmedAppointments')}</p>
          <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('todayAppointments')}</p>
          <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t('myAppointments')}</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{t('noAppointments')}</p>
            <p className="text-sm">{t('bookFirst')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('visaType')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('date')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('time')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Processing</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 10).map((apt) => {
                  const badge = getProcessingBadge(apt.processingTier);
                  return (
                    <tr key={apt._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono">{apt.appointmentId}</td>
                      <td className="py-3 px-4 text-sm capitalize">{t(apt.visaType)}</td>
                      <td className="py-3 px-4 text-sm">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">{apt.appointmentTime}</td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${getStatusClass(apt.status)}`}>
                          {t(apt.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantDashboard;

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { appointmentAPI } from '../services/api';
import { format } from 'date-fns';

const MyAppointments = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getMyAppointments();
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await appointmentAPI.cancel(id);
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Cancel failed');
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('myAppointments')}</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('noAppointments')}</h2>
          <p className="text-gray-500">{t('bookFirst')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => (
            <div key={apt._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-gray-500">{apt.appointmentId}</span>
                    <span className={`status-badge ${getStatusClass(apt.status)}`}>
                      {t(apt.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">{t('visaType')}</p>
                      <p className="font-medium capitalize">{t(apt.visaType)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('date')}</p>
                      <p className="font-medium">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM dd, yyyy') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('time')}</p>
                      <p className="font-medium">{apt.appointmentTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('entryType')}</p>
                      <p className="font-medium capitalize">{apt.applicationData?.entryType || '-'}</p>
                    </div>
                  </div>

                  {apt.applicationData && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{t('passportNumber')}</p>
                          <p className="font-medium">{apt.applicationData.passportNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('purpose')}</p>
                          <p className="font-medium">{apt.applicationData.purpose || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('duration')}</p>
                          <p className="font-medium">{apt.applicationData.duration || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('destination')}</p>
                          <p className="font-medium">{apt.applicationData.destination || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {apt.qrCode && (
                    <button
                      onClick={() => setSelectedAppointment(apt)}
                      className="btn btn-secondary text-sm"
                    >
                      {t('qrCode')}
                    </button>
                  )}
                  {apt.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(apt._id)}
                      className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                    >
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">{t('qrCode')}</h3>
              <img
                src={selectedAppointment.qrCode}
                alt="QR Code"
                className="w-48 h-48 mx-auto mb-4"
              />
              <p className="font-mono text-sm text-gray-500 mb-4">
                {selectedAppointment.appointmentId}
              </p>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="btn btn-primary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;

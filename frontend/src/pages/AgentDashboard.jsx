import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { agentAPI, appointmentAPI } from '../services/api';
import { format, addDays } from 'date-fns';

const AgentDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBulkBook, setShowBulkBook] = useState(false);
  const [bulkBookData, setBulkBookData] = useState({
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '09:00',
    count: 5,
    visaType: 'tourist'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aptRes, slotsRes, clientsRes] = await Promise.all([
        agentAPI.getAppointments(),
        agentAPI.getSlots(),
        agentAPI.getClients()
      ]);
      setAppointments(aptRes.data.appointments || []);
      setSlots(slotsRes.data.slots || []);
      setClients(clientsRes.data.clients || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkBook = async (e) => {
    e.preventDefault();
    try {
      await agentAPI.bulkBook(bulkBookData);
      fetchData();
      setShowBulkBook(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Booking failed');
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled'
    };
    return classes[status] || 'status-pending';
  };

  const stats = {
    total: appointments.length,
    reserved: appointments.filter(a => a.isReservedByAgent).length,
    assigned: appointments.filter(a => !a.isReservedByAgent && a.userId?._id !== user?._id).length,
    clients: clients.length
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('welcome')}, {user?.fullName}!
        </h1>
        <p className="text-gray-500">{t('agent')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">{t('totalAppointments')}</p>
          <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Reserved</p>
          <p className="text-3xl font-bold text-purple-600">{stats.reserved}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Assigned</p>
          <p className="text-3xl font-bold text-green-600">{stats.assigned}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('clients')}</p>
          <p className="text-3xl font-bold text-blue-600">{stats.clients}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{t('bulkBook')}</h2>
            <button
              onClick={() => setShowBulkBook(!showBulkBook)}
              className="btn btn-primary text-sm"
            >
              {showBulkBook ? 'Cancel' : t('bulkBook')}
            </button>
          </div>

          {showBulkBook && (
            <form onSubmit={handleBulkBook} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="label">{t('date')}</label>
                <input
                  type="date"
                  className="input"
                  value={bulkBookData.date}
                  onChange={(e) => setBulkBookData({ ...bulkBookData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">{t('time')}</label>
                <select
                  className="input"
                  value={bulkBookData.time}
                  onChange={(e) => setBulkBookData({ ...bulkBookData, time: e.target.value })}
                >
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                </select>
              </div>
              <div>
                <label className="label">Count</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="50"
                  value={bulkBookData.count}
                  onChange={(e) => setBulkBookData({ ...bulkBookData, count: parseInt(e.target.value) })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                {t('book')}
              </button>
            </form>
          )}

          <h3 className="text-sm font-medium mb-3">{t('availableSlots')}</h3>
          <div className="space-y-2">
            {slots.slice(0, 5).map((slot, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{format(new Date(slot.date), 'MMM dd, yyyy')}</p>
                  <p className="text-xs text-gray-500">{slot.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {slot.availableAgentSlots || (slot.agentReservedSlots - slot.agentBooked)} available
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('appointments')}</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noAppointments')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs text-gray-500">ID</th>
                    <th className="text-left py-2 px-3 text-xs text-gray-500">Client</th>
                    <th className="text-left py-2 px-3 text-xs text-gray-500">{t('date')}</th>
                    <th className="text-left py-2 px-3 text-xs text-gray-500">{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 8).map((apt) => (
                    <tr key={apt._id} className="border-b border-gray-100 text-sm">
                      <td className="py-2 px-3 font-mono text-xs">{apt.appointmentId?.slice(0, 8)}</td>
                      <td className="py-2 px-3">{apt.userId?.fullName || 'Reserved'}</td>
                      <td className="py-2 px-3">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM dd') : '-'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`status-badge ${getStatusClass(apt.status)}`}>
                          {t(apt.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;

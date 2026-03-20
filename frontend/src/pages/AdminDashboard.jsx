import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [meetingStats, setMeetingStats] = useState({ total: 0, scheduled: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [slotConfig, setSlotConfig] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    agentReservedPercent: 70
  });

  useEffect(() => {
    fetchDashboard();
    fetchAppointments();
    fetchUsers();
    fetchMeetingStats();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await adminAPI.getAppointments({ limit: 20 });
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers({ limit: 20 });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMeetingStats = async () => {
    try {
      const response = await adminAPI.getMeetings({ limit: 100 });
      const meetings = response.data.meetings || [];
      setMeetingStats({
        total: meetings.length,
        scheduled: meetings.filter(m => m.status === 'scheduled').length,
        completed: meetings.filter(m => m.status === 'completed').length
      });
    } catch (error) {
      console.error('Error fetching meeting stats:', error);
    }
  };

  const handleSlotAllocation = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateSlotAllocation(slotConfig);
      alert('Slot allocation updated');
    } catch (error) {
      alert(error.response?.data?.message || 'Update failed');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await adminAPI.updateAppointmentStatus(id, status);
      fetchAppointments();
      fetchDashboard();
    } catch (error) {
      alert('Update failed');
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

  const tabs = [
    { id: 'overview', label: t('dashboard') },
    { id: 'appointments', label: t('appointments') },
    { id: 'users', label: t('userManagement') },
    { id: 'slots', label: t('slotAllocation') },
    { id: 'meetings', label: t('meetings') }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('welcome')}, {user?.fullName}!
        </h1>
        <p className="text-gray-500">{t('admin')}</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="card">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-primary-600">{data.stats.totalUsers}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">{t('totalAppointments')}</p>
              <p className="text-3xl font-bold text-purple-600">{data.stats.totalAppointments}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">{t('pendingAppointments')}</p>
              <p className="text-3xl font-bold text-yellow-600">{data.stats.pendingAppointments}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">{t('meetings')}</p>
              <p className="text-3xl font-bold text-purple-600">{meetingStats.total}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">{t('todayAppointments')}</p>
              <p className="text-3xl font-bold text-green-600">{data.stats.todayAppointments}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="font-semibold mb-3">Appointments by Status</h3>
              <div className="space-y-2">
                {data.appointmentsByStatus?.map(item => (
                  <div key={item.status} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="capitalize">{t(item.status)}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-3">{t('meetings')} Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{t('scheduled')}</span>
                  <span className="font-bold text-blue-600">{meetingStats.scheduled}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{t('completed')}</span>
                  <span className="font-bold text-green-600">{meetingStats.completed}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Recent Appointments</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('visaType')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('date')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('status')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Processing</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAppointments?.slice(0, 10).map((apt) => (
                    <tr key={apt._id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm font-mono">{apt.appointmentId}</td>
                      <td className="py-3 px-4 text-sm">{apt.userId?.fullName || '-'}</td>
                      <td className="py-3 px-4 text-sm capitalize">{t(apt.visaType)}</td>
                      <td className="py-3 px-4 text-sm">
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${getStatusClass(apt.status)}`}>
                          {t(apt.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          apt.processingTier === 'express' ? 'bg-purple-100 text-purple-700' :
                          apt.processingTier === 'priority' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {apt.processingTier || 'standard'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'appointments' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('appointments')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('visaType')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('date')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm font-mono">{apt.appointmentId}</td>
                    <td className="py-3 px-4 text-sm">{apt.userId?.fullName || '-'}</td>
                    <td className="py-3 px-4 text-sm capitalize">{t(apt.visaType)}</td>
                    <td className="py-3 px-4 text-sm">
                      {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`status-badge ${getStatusClass(apt.status)}`}>
                        {t(apt.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        apt.priorityScore >= 100 ? 'bg-purple-100 text-purple-700' :
                        apt.priorityScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {apt.priorityScore >= 100 ? 'Premium' : apt.priorityScore >= 50 ? 'Gold' : 'Free'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {apt.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(apt._id, 'confirmed')}
                              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(apt._id, 'flagged')}
                              className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                            >
                              Flag
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('userManagement')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('fullName')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('email')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('phone')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tier</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm">{u.fullName}</td>
                    <td className="py-3 px-4 text-sm">{u.email}</td>
                    <td className="py-3 px-4 text-sm">{u.phone}</td>
                    <td className="py-3 px-4"><span className="capitalize text-sm">{u.role}</span></td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.membership?.tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                        u.membership?.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {u.membership?.tier || 'free'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('slotAllocation')}</h2>
          <form onSubmit={handleSlotAllocation} className="space-y-4 max-w-md">
            <div>
              <label className="label">{t('date')}</label>
              <input type="date" className="input" value={slotConfig.date}
                onChange={(e) => setSlotConfig({ ...slotConfig, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t('time')}</label>
              <select className="input" value={slotConfig.time}
                onChange={(e) => setSlotConfig({ ...slotConfig, time: e.target.value })}>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
              </select>
            </div>
            <div>
              <label className="label">Agent Reserved %</label>
              <input type="number" className="input" min="0" max="100"
                value={slotConfig.agentReservedPercent}
                onChange={(e) => setSlotConfig({ ...slotConfig, agentReservedPercent: parseInt(e.target.value) })} required />
            </div>
            <button type="submit" className="btn btn-primary">Update Allocation</button>
          </form>
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('manageMeetings')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('allMeetings')}</p>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Meeting management is available at:</p>
            <a href="/admin/meetings" className="btn btn-primary">Go to Meetings Panel</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

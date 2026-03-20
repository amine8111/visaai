import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';

const AdminMeetingsPage = () => {
  const { t } = useTranslation();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [status, setStatus] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [notes, setNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [issuesFound, setIssuesFound] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadMeetings();
    loadAgents();
  }, [filter]);

  const loadMeetings = async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      const response = await adminAPI.getMeetings(params);
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await adminAPI.getUsers({ role: 'agent', limit: 100 });
      setAgents(response.data.users || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const openMeeting = async (meeting) => {
    try {
      const response = await adminAPI.getMeeting(meeting._id);
      setSelectedMeeting(response.data.meeting);
      setStatus(response.data.meeting.status);
      setNotes(response.data.meeting.notes || '');
      setVerificationStatus(response.data.meeting.verificationStatus || '');
      setIssuesFound(response.data.meeting.issuesFound?.join('\n') || '');
      setSelectedAgent(
        response.data.meeting.agentId?._id || 
        (typeof response.data.meeting.agentId === 'string' ? response.data.meeting.agentId : '') || 
        ''
      );
    } catch (error) {
      console.error('Error loading meeting details:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { status };
      if (notes !== undefined) data.notes = notes;
      if (verificationStatus) data.verificationStatus = verificationStatus;
      if (issuesFound) data.issuesFound = issuesFound.split('\n').filter(Boolean);

      await adminAPI.updateMeetingStatus(selectedMeeting._id, data);
      if (selectedAgent) {
        await adminAPI.assignMeetingAgent(selectedMeeting._id, selectedAgent);
      }
      loadMeetings();
      setSelectedMeeting(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async () => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newTime = prompt('Enter new time (HH:MM):');
    if (!newDate || !newTime) return;

    try {
      await adminAPI.rescheduleMeeting(selectedMeeting._id, {
        meetingDate: newDate,
        meetingTime: newTime
      });
      loadMeetings();
      setSelectedMeeting(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Reschedule failed');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      rescheduled: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getVerificationColor = (status) => {
    const colors = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      issues_found: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('manageMeetings')}</h1>
          <p className="text-gray-500">{t('allMeetings')}</p>
        </div>
        <div className="flex gap-2">
          {['', 'scheduled', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === '' ? 'All' : t(f)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-700">No meetings found</h2>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('applicant')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('date')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('time')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('meetingType')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Verification</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr key={meeting._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{meeting.meetingId}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="font-medium">
                          {typeof meeting.userId === 'object' ? meeting.userId.fullName : ''}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {typeof meeting.userId === 'object' ? meeting.userId.email : ''}
                        </p>
                        {typeof meeting.userId === 'object' && meeting.userId.membership && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            meeting.userId.membership.tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                            meeting.userId.membership.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {meeting.userId.membership.tier}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {meeting.meetingDate ? format(new Date(meeting.meetingDate), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">{meeting.meetingTime}</td>
                    <td className="py-3 px-4 text-sm capitalize">{t(meeting.meetingType)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {t(meeting.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationColor(meeting.verificationStatus)}`}>
                        {meeting.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openMeeting(meeting)}
                        className="btn btn-secondary text-sm"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedMeeting.meetingId}
            </h3>

            {typeof selectedMeeting.userId === 'object' && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedMeeting.userId.fullName}</p>
                <p className="text-sm text-gray-500">{selectedMeeting.userId.email}</p>
                <p className="text-sm text-gray-500">{selectedMeeting.userId.phone}</p>
                {selectedMeeting.userId.passportNumber && (
                  <p className="text-sm text-gray-500">Passport: {selectedMeeting.userId.passportNumber}</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="label">{t('status')}</label>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="scheduled">{t('scheduled')}</option>
                  <option value="completed">{t('completed')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                  <option value="rescheduled">{t('rescheduled')}</option>
                </select>
              </div>

              <div>
                <label className="label">{t('assignAgent')}</label>
                <select
                  className="input"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                >
                  <option value="">-- {t('selectAgent')} --</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>{agent.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Verification Status</label>
                <select
                  className="input"
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                >
                  <option value="">Pending</option>
                  <option value="verified">{t('verified')}</option>
                  <option value="issues_found">{t('issuesFound')}</option>
                </select>
              </div>

              <div>
                <label className="label">{t('notes')}</label>
                <textarea
                  className="input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t('issuesFound')} (one per line)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Issue 1&#10;Issue 2"
                  value={issuesFound}
                  onChange={(e) => setIssuesFound(e.target.value)}
                />
              </div>

              {selectedMeeting.documentsToBring?.length > 0 && (
                <div>
                  <label className="label">{t('documentsToBring')}</label>
                  <div className="space-y-1">
                    {selectedMeeting.documentsToBring.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={doc.verified ? 'text-green-500' : 'text-gray-400'}>
                          {doc.verified ? '✓' : '○'}
                        </span>
                        {doc.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="btn btn-primary flex-1"
                disabled={saving}
              >
                {saving ? t('processing') : t('updateStatus')}
              </button>
              <button
                onClick={handleReschedule}
                className="btn btn-secondary"
              >
                {t('reschedule')}
              </button>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="btn bg-gray-100 text-gray-700"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMeetingsPage;

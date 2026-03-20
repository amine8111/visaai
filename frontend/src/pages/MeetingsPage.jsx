import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { membershipAPI } from '../services/api';
import { format } from 'date-fns';

const MeetingsPage = () => {
  const { t } = useTranslation();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await membershipAPI.getMyMeetings();
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    setCancelling(id);
    try {
      await membershipAPI.cancelMeeting(id);
      fetchMeetings();
    } catch (error) {
      alert(error.response?.data?.message || 'Cancel failed');
    } finally {
      setCancelling(null);
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

  const getTypeIcon = (type) => {
    const icons = {
      document_check: '📄',
      interview: '💬',
      general: '📋'
    };
    return icons[type] || '📋';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('myMeetings')}</h1>
        <p className="text-gray-500">{t('faceToFaceMeeting')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🤝</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('noMeetings')}</h2>
          <p className="text-gray-500">{t('scheduleFirst')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{getTypeIcon(meeting.meetingType)}</span>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-gray-500">{meeting.meetingId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {t(meeting.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-gray-500">{t('date')}</p>
                        <p className="font-medium">
                          {meeting.meetingDate ? format(new Date(meeting.meetingDate), 'MMM dd, yyyy') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('time')}</p>
                        <p className="font-medium">{meeting.meetingTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('meetingType')}</p>
                        <p className="font-medium capitalize">{t(meeting.meetingType)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('meetingLocation')}</p>
                        <p className="font-medium">{meeting.location}</p>
                      </div>
                    </div>

                    {meeting.documentsToBring?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">{t('documentsToBring')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {meeting.documentsToBring.map((doc, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-1 rounded ${
                                doc.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {doc.verified ? '✓' : '○'} {doc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {meeting.notes && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">{t('notes')}:</p>
                        <p className="text-sm text-gray-700">{meeting.notes}</p>
                      </div>
                    )}

                    {meeting.issuesFound?.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        <p className="font-medium">{t('issuesFound')}:</p>
                        <ul className="list-disc list-inside">
                          {meeting.issuesFound.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedMeeting(meeting)}
                    className="btn btn-secondary text-sm"
                  >
                    {t('meetingDetails')}
                  </button>
                  {meeting.status === 'scheduled' && (
                    <button
                      onClick={() => handleCancel(meeting._id)}
                      className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                      disabled={cancelling === meeting._id}
                    >
                      {cancelling === meeting._id ? t('processing') : t('cancelMeeting')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <span className="text-5xl">{getTypeIcon(selectedMeeting.meetingType)}</span>
              <h3 className="text-lg font-semibold mt-2">{selectedMeeting.meetingId}</h3>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMeeting.status)}`}>
                {t(selectedMeeting.status)}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-500">{t('date')}</span>
                <span className="font-medium">
                  {selectedMeeting.meetingDate ? format(new Date(selectedMeeting.meetingDate), 'MMMM dd, yyyy') : '-'}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-500">{t('time')}</span>
                <span className="font-medium">{selectedMeeting.meetingTime}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-500">{t('meetingLocation')}</span>
                <span className="font-medium">{selectedMeeting.location}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-500">{t('verificationStatus')}</span>
                <span className={`font-medium capitalize ${
                  selectedMeeting.verificationStatus === 'verified' ? 'text-green-600' :
                  selectedMeeting.verificationStatus === 'issues_found' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {t(selectedMeeting.verificationStatus) || t('pending')}
                </span>
              </div>
              {selectedMeeting.agentId && (
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-500">{t('agent')}</span>
                  <span className="font-medium">
                    {typeof selectedMeeting.agentId === 'object' ? selectedMeeting.agentId.fullName : ''}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedMeeting(null)}
              className="btn btn-primary w-full mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;

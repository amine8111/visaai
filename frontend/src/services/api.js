import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://geminivisaai-ns2s.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const appointmentAPI = {
  book: (data) => api.post('/appointments/book', data),
  getMyAppointments: () => api.get('/appointments/my-appointments'),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  cancel: (id) => api.put(`/appointments/cancel/${id}`),
  getAll: (params) => api.get('/appointments', { params })
};

export const agentAPI = {
  bulkBook: (data) => api.post('/agent/bulk-book', data),
  getSlots: (date) => api.get('/agent/slots', { params: { date } }),
  assignAppointment: (data) => api.post('/agent/assign-appointment', data),
  getAppointments: (params) => api.get('/agent/appointments', { params }),
  getClients: () => api.get('/agent/clients')
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAppointments: (params) => api.get('/admin/appointments', { params }),
  updateAppointmentStatus: (id, status) => api.put(`/admin/appointments/${id}/status`, { status }),
  updateSlotAllocation: (data) => api.put('/admin/slot-allocation', data),
  getFraudPatterns: () => api.get('/admin/fraud-patterns'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  generateSlots: (data) => api.post('/admin/slots/generate', data),
  getMeetings: (params) => api.get('/admin/meetings', { params }),
  getMeeting: (id) => api.get(`/admin/meetings/meeting/${id}`),
  updateMeetingStatus: (id, data) => api.put(`/admin/meetings/meeting/${id}/status`, data),
  assignMeetingAgent: (id, agentId) => api.put(`/admin/meetings/meeting/${id}/assign`, { agentId }),
  rescheduleMeeting: (id, data) => api.put(`/admin/meetings/meeting/${id}/reschedule`, data)
};

export const membershipAPI = {
  getPlans: () => api.get('/membership/plans'),
  getMyMembership: () => api.get('/membership/my-membership'),
  upgrade: (tier, durationMonths) => api.post('/membership/upgrade', { tier, durationMonths }),
  bookMeeting: (data) => api.post('/membership/book-meeting', data),
  getMyMeetings: () => api.get('/membership/my-meetings'),
  getMeeting: (id) => api.get(`/membership/meeting/${id}`),
  cancelMeeting: (id) => api.put(`/membership/meeting/${id}/cancel`)
};

export const assessmentAPI = {
  runAssessment: (data) => api.post('/assessment/assess', data),
  getCriteria: (visaType) => api.get(`/assessment/criteria/${visaType}`),
  getRequiredDocs: (visaType) => api.get(`/assessment/required-docs/${visaType}`)
};

export const eligibilityAPI = {
  checkEligibility: (data) => api.post('/eligibility/check', data),
  getCountries: () => api.get('/eligibility/countries'),
  getRequirements: (country) => api.get(`/eligibility/requirements/${country}`)
};

export const aiAPI = {
  verifyFace: (data) => api.post('/ai/verify-face', data),
  checkLiveness: (data) => api.post('/ai/check-liveness', data),
  analyzeRisk: (data) => api.post('/ai/analyze-risk', data),
  getSmartAllocation: (params) => api.get('/ai/smart-allocation', { params })
};

export default api;

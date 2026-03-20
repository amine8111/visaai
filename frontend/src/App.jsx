import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ApplicantDashboard from './pages/ApplicantDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminMeetingsPage from './pages/AdminMeetingsPage';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import MembershipPage from './pages/MembershipPage';
import MeetingsPage from './pages/MeetingsPage';
import AssessmentPage from './pages/AssessmentPage';
import EligibilityPage from './pages/EligibilityPage';
import Layout from './components/layout/Layout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            {user?.role === 'admin' && <AdminDashboard />}
            {user?.role === 'agent' && <AgentDashboard />}
            {user?.role === 'applicant' && <ApplicantDashboard />}
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/meetings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout>
            <AdminMeetingsPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/book-appointment" element={
        <ProtectedRoute allowedRoles={['applicant', 'agent']}>
          <Layout>
            <BookAppointment />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/my-appointments" element={
        <ProtectedRoute>
          <Layout>
            <MyAppointments />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/membership" element={
        <ProtectedRoute allowedRoles={['applicant']}>
          <Layout>
            <MembershipPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/meetings" element={
        <ProtectedRoute allowedRoles={['applicant']}>
          <Layout>
            <MeetingsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/assessment" element={
        <ProtectedRoute allowedRoles={['applicant']}>
          <Layout>
            <AssessmentPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/eligibility" element={
        <ProtectedRoute allowedRoles={['applicant']}>
          <Layout>
            <EligibilityPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

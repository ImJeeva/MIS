import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';

import { PublicLayout } from './layouts/PublicLayout.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';

import PatientDashboard from './pages/patient/Dashboard.jsx';
import Upload from './pages/patient/Upload.jsx';
import Studies from './pages/patient/Studies.jsx';
import Doctors from './pages/patient/Doctors.jsx';

import DoctorDashboard from './pages/doctor/Dashboard.jsx';
import Patients from './pages/doctor/Patients.jsx';
import PatientDetail from './pages/doctor/PatientDetail.jsx';

import StudyDetail from './pages/StudyDetail.jsx';
import Notes from './pages/Notes.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminStudies from './pages/admin/Studies.jsx';
import AdminAudit from './pages/admin/Audit.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Landing />;
  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
}

export default function App() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        path="/app"
        element={
          <ProtectedRoute roles={['PATIENT', 'DOCTOR']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={isDoctor ? <DoctorDashboard /> : <PatientDashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="studies" element={<Studies />} />
        <Route path="studies/:id" element={<StudyDetail />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="notes" element={<Notes />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="studies" element={<AdminStudies />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Doctors from './pages/Doctors';
import MyPatientDetails from './pages/MyPatientDetails';
import DoctorDetail from './pages/DoctorDetail';
import Alerts from './pages/Alerts';

const queryClient = new QueryClient();

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  // If user is already logged in and tries to go to login/register, send them to dashboard
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{ className: 'font-sans' }}
        />
        <Routes>
          {/* 1. Landing Page (Available to everyone) */}
          <Route path="/" element={<Landing />} />

          {/* 2. Auth Routes (Only available if NOT logged in) */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* 3. Private Routes (Require Login) */}
          <Route element={<PrivateRoute />}>
            {/* When a user logs in, they go here */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:id" element={<DoctorDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/mypatient/:id" element={<MyPatientDetails />} />
          </Route>

          {/* 4. Catch-all: redirect any unknown routes to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
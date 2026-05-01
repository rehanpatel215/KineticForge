import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import RoleGuard from './components/auth/RoleGuard';
import MainLayout from './components/layout/MainLayout';

// Pages
import DevTokens from './pages/DevTokens';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import Placeholder from './pages/Placeholder';

// Mentor Pages
import Dashboard from './pages/mentor/Dashboard';
import MarkAttendance from './pages/mentor/MarkAttendance';
import StudentHistory from './pages/mentor/StudentHistory';
import Materials from './pages/mentor/Materials';
import Upload from './pages/mentor/Upload';

// Student Pages
import MyAttendance from './pages/student/MyAttendance';
import Upcoming from './pages/student/Upcoming';
import StudentMaterials from './pages/student/StudentMaterials';

// A simple redirect component for the root path '/'
function RootRedirect() {
  const { session, role, loading } = useAuth();
  
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (role === 'mentor') return <Navigate to="/dashboard" replace />;
  if (role === 'student') return <Navigate to="/me/attendance" replace />;
  
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/dev-tokens" element={<DevTokens />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Routes inside MainLayout */}
          <Route element={<MainLayout />}>
            
            {/* Mentor Routes */}
            <Route element={<RoleGuard allowedRoles={['mentor']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<MarkAttendance />} />
              <Route path="/history" element={<StudentHistory />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/upload" element={<Upload />} />
            </Route>

            {/* Student Routes */}
            <Route element={<RoleGuard allowedRoles={['student']} />}>
              <Route path="/me/attendance" element={<MyAttendance />} />
              <Route path="/me/upcoming" element={<Upcoming />} />
              <Route path="/me/materials" element={<StudentMaterials />} />
            </Route>
            
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

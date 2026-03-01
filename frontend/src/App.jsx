import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Layout
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Consent from './pages/Consent';
import Emergency from './pages/Emergency';
import AuditLogs from './pages/AuditLogs';
import Health from './pages/Health';
import Privacy from './pages/Privacy';
import Assignments from './pages/Assignments';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;

  return children;
};

const Layout = ({ children }) => {
  return (
    <div className="flex bg-dark-bg min-h-screen text-dark-text">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155'
        }
      }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" replace />} />

          {/* Protected Area */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><Layout><Patients /></Layout></ProtectedRoute>} />

          <Route path="/consent" element={<ProtectedRoute allowedRoles={['PATIENT', 'ADMIN', 'DOCTOR', 'NURSE']}><Layout><Consent /></Layout></ProtectedRoute>} />

          <Route path="/emergency" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><Layout><Emergency /></Layout></ProtectedRoute>} />

          <Route path="/assignments" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><Assignments /></Layout></ProtectedRoute>} />

          <Route path="/privacy" element={<ProtectedRoute allowedRoles={['PATIENT']}><Layout><Privacy /></Layout></ProtectedRoute>} />

          <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><AuditLogs /></Layout></ProtectedRoute>} />

          <Route path="/health" element={<ProtectedRoute><Layout><Health /></Layout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;

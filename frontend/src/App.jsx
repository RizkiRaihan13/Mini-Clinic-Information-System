import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Registrations from './pages/Registrations';
import Queue from './pages/Queue';
import MedicalRecords from './pages/MedicalRecords';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, hasRole } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="patients"
          element={
            <ProtectedRoute allowedRoles={['Administrator', 'Petugas Pendaftaran', 'Dokter']}>
              <Patients />
            </ProtectedRoute>
          }
        />
        <Route
          path="registrations"
          element={
            <ProtectedRoute allowedRoles={['Administrator', 'Petugas Pendaftaran']}>
              <Registrations />
            </ProtectedRoute>
          }
        />
        <Route
          path="queues"
          element={
            <ProtectedRoute allowedRoles={['Administrator', 'Dokter', 'Petugas Pendaftaran']}>
              <Queue />
            </ProtectedRoute>
          }
        />
        <Route
          path="medical-records"
          element={
            <ProtectedRoute allowedRoles={['Administrator', 'Dokter']}>
              <MedicalRecords />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { ParticipantInstructionsPage } from './pages/ParticipantInstructionsPage';
import { ParticipantChallengePage } from './pages/ParticipantChallengePage';
import { ParticipantCompletionPage } from './pages/ParticipantCompletionPage';

import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminTeamsPage } from './pages/AdminTeamsPage';
import { AdminQuestionsPage } from './pages/AdminQuestionsPage';
import { AdminChallengesPage } from './pages/AdminChallengesPage';
import { AdminSubmissionsPage } from './pages/AdminSubmissionsPage';
import { AdminActivityPage } from './pages/AdminActivityPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminAuditPage } from './pages/AdminAuditPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Participant Challenge Flow */}
            <Route
              path="/challenge"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <ParticipantInstructionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/challenge/workspace"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <ParticipantChallengePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/challenge/completed"
              element={
                <ProtectedRoute allowedRoles={['participant']}>
                  <ParticipantCompletionPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Control Center Routes */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teams"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminTeamsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/questions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminQuestionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/challenges"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminChallengesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/submissions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSubmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminActivityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAuditPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

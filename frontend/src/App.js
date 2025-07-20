import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Fab, Tooltip } from '@mui/material';
import { BugReport } from '@mui/icons-material';

import { AuthProvider } from './hooks/useAuth';
import { WebSocketProvider } from './contexts/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import ModernLayout from './components/ModernLayout';
import NotificationToast from './components/notifications/NotificationToast';
import LoginPage from './pages/LoginPage';
import ModernDashboardPage from './pages/ModernDashboardPage';
import ModernJamaahListPage from './pages/ModernJamaahListPage';
import JamaahFormPage from './pages/JamaahFormPage';
import JamaahDetailPage from './pages/JamaahDetailPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import BackupPage from './pages/BackupPage';
import PackagesPage from './pages/PackagesPage';
import PaymentsPage from './pages/PaymentsPage';
import DocumentsPage from './pages/DocumentsPage';
import ReportsPage from './pages/ReportsPage';
import TestingPanel from './components/testing/TestingPanel';

function App() {
  const [showTesting, setShowTesting] = useState(false);
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ModernLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<ModernDashboardPage />} />
            
            <Route path="jamaah">
              <Route index element={<ModernJamaahListPage />} />
              <Route path="new" element={<JamaahFormPage />} />
              <Route path=":id" element={<JamaahDetailPage />} />
              <Route path=":id/edit" element={<JamaahFormPage />} />
            </Route>
            
            <Route path="packages" element={<PackagesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Testing Panel FAB - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Tooltip title="Open Testing Panel">
              <Fab
                color="secondary"
                sx={{
                  position: 'fixed',
                  bottom: 16,
                  left: 16,
                  zIndex: 1000
                }}
                onClick={() => setShowTesting(true)}
              >
                <BugReport />
              </Fab>
            </Tooltip>
            
            {showTesting && (
              <TestingPanel onClose={() => setShowTesting(false)} />
            )}
          </>
        )}
      </Box>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
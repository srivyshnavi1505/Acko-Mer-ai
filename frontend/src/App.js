import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SessionPage from './pages/SessionPage';
import Navbar from './components/Navbar';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0', dark: '#0d47a1', light: '#42a5f5' },
    secondary: { main: '#00897b' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    success: { main: '#2e7d32' },
    warning: { main: '#f57c00' },
    error: { main: '#c62828' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { boxShadow: 'none' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
  },
});

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main style={{ minHeight: 'calc(100vh - 64px)' }}>{children}</main>
  </>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SessionProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/session/:id" element={
                <ProtectedRoute>
                  <AppLayout><SessionPage /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false}
            newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SessionPage from './pages/SessionPage';
import PatientsPage from './pages/PatientsPage';
import PatientProfilePage from './pages/PatientProfilePage';
import Navbar from './components/Navbar';

const getTheme = (darkMode) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#457b9d',
      dark: '#1d3557',
      light: '#a8dadc',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a8dadc',
      dark: '#457b9d',
      light: '#f1faee',
      contrastText: '#1d3557',
    },
    background: {
      default: darkMode ? '#0d1b2a' : '#f1faee',
      paper: darkMode ? '#1a2a3a' : '#ffffff',
    },
    text: {
      primary: darkMode ? '#f1faee' : '#1d3557',
      secondary: darkMode ? '#a8dadc' : '#1d3557',
    },
    divider: darkMode ? 'rgba(168,218,220,0.15)' : 'rgba(69,123,157,0.15)',
    success: { main: '#2d6a4f' },
    warning: { main: '#e07a2f' },
    error: { main: '#c1121f' },
    info: { main: '#457b9d' },
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700, letterSpacing: '-0.3px' },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #457b9d 0%, #1d3557 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1d3557 0%, #457b9d 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(29,53,87,0.08), 0 1px 2px rgba(29,53,87,0.06)',
          border: '1px solid rgba(69,123,157,0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px rgba(29,53,87,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

const LoadingScreen = () => (
  <Box sx={{
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', bgcolor: '#f1faee', flexDirection: 'column', gap: 2,
  }}>
    <CircularProgress sx={{ color: '#457b9d' }} size={40} thickness={4} />
    <Box sx={{ color: '#457b9d', fontSize: 13, fontWeight: 500, letterSpacing: '0.05em' }}>
      ACKO MER AI
    </Box>
  </Box>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main style={{ minHeight: 'calc(100vh - 64px)' }}>{children}</main>
  </>
);

const ThemedApp = () => {
  const { darkMode } = useTheme();
  const theme = getTheme(darkMode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SessionProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
              <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/session/:id" element={<ProtectedRoute><AppLayout><SessionPage /></AppLayout></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><AppLayout><PatientsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/patients/:id" element={<ProtectedRoute><AppLayout><PatientProfilePage /></AppLayout></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <ToastContainer
            position="bottom-right"
            autoClose={4000}
            theme={darkMode ? 'dark' : 'light'}
            toastStyle={{
              borderRadius: 10,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
            }}
          />
        </SessionProvider>
      </AuthProvider>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;
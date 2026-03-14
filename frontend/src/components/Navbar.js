import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem,
  IconButton, Chip, Tooltip, Divider,
} from '@mui/material';
import { LocalHospital, ExitToApp, Dashboard, DarkMode, LightMode, People } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully.');
    navigate('/login');
    setAnchorEl(null);
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'DR';
  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="sticky" elevation={0} sx={{
      bgcolor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',
      color: 'text.primary',
    }}>
      <Toolbar>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 3 }}
          onClick={() => navigate('/')}>
          <LocalHospital sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={800} color="primary.main" lineHeight={1.1}>
              ACKO MER AI
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1}>
              Medical Transcription
            </Typography>
          </Box>
        </Box>

        {/* Nav Links */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5, flexGrow: 1 }}>
          <Button
            startIcon={<Dashboard />}
            onClick={() => navigate('/')}
            color={isActive('/') ? 'primary' : 'inherit'}
            sx={{ fontWeight: isActive('/') ? 700 : 400 }}>
            Dashboard
          </Button>
          <Button
            startIcon={<People />}
            onClick={() => navigate('/patients')}
            color={isActive('/patients') ? 'primary' : 'inherit'}
            sx={{ fontWeight: isActive('/patients') ? 700 : 400 }}>
            Patients
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          {user && (
            <>
              <Chip label={user.role} size="small" color="primary" variant="outlined"
                sx={{ display: { xs: 'none', sm: 'flex' } }} />
              <Tooltip title={user.name}>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                    {initials}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { minWidth: 200 } }}>
                <MenuItem disabled>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    {user.specialization && (
                      <Typography variant="caption" color="primary" display="block">{user.specialization}</Typography>
                    )}
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { toggleDarkMode(); setAnchorEl(null); }}>
                  {darkMode ? <LightMode fontSize="small" sx={{ mr: 1 }} /> : <DarkMode fontSize="small" sx={{ mr: 1 }} />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ExitToApp fontSize="small" sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

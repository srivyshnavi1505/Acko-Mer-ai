import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem,
  IconButton, Chip, Tooltip,
} from '@mui/material';
import { LocalHospital, Person, ExitToApp, Dashboard } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully.');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'DR';

  return (
    <AppBar position="sticky" elevation={0} sx={{
      bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary',
    }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, cursor: 'pointer' }}
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<Dashboard />} onClick={() => navigate('/')} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            Dashboard
          </Button>

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
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem disabled>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
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

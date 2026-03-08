import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress, Divider } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onSwitch }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Demo login shortcut
  const demoLogin = async () => {
    setForm({ email: 'demo@acko.com', password: 'demo1234' });
    setError('');
    setLoading(true);
    try {
      await login('demo@acko.com', 'demo1234');
    } catch {
      setError('Demo account not set up. Please register first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <LocalHospital sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" fontWeight={700}>Welcome to ACKO MER AI</Typography>
        <Typography variant="body2" color="text.secondary">Medical Transcription & AI Summaries</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField fullWidth label="Email" name="email" type="email" value={form.email}
        onChange={handleChange} required margin="normal" autoComplete="email" />
      <TextField fullWidth label="Password" name="password" type="password" value={form.password}
        onChange={handleChange} required margin="normal" autoComplete="current-password" />

      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
        sx={{ mt: 2, mb: 1, py: 1.5, borderRadius: 2, fontWeight: 700 }}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
      </Button>

      <Divider sx={{ my: 2 }}>or</Divider>

      <Button fullWidth variant="outlined" size="large" onClick={demoLogin} disabled={loading}
        sx={{ mb: 2, borderRadius: 2 }}>
        Try Demo Account
      </Button>

      <Typography variant="body2" textAlign="center">
        Don't have an account?{' '}
        <Button variant="text" size="small" onClick={onSwitch} sx={{ fontWeight: 700 }}>Register</Button>
      </Typography>
    </Box>
  );
};

export default LoginForm;

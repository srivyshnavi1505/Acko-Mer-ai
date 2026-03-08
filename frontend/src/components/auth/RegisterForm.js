import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress, MenuItem, Divider } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const SPECIALIZATIONS = ['General Medicine', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Dermatology', 'Psychiatry', 'Oncology', 'Gynecology', 'Other'];

const RegisterForm = ({ onSwitch }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '', role: 'doctor' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <LocalHospital sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" fontWeight={700}>Create Account</Typography>
        <Typography variant="body2" color="text.secondary">Join ACKO MER AI</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange}
        required margin="normal" />
      <TextField fullWidth label="Email" name="email" type="email" value={form.email}
        onChange={handleChange} required margin="normal" />
      <TextField fullWidth label="Password" name="password" type="password" value={form.password}
        onChange={handleChange} required margin="normal" helperText="Minimum 6 characters" />
      <TextField fullWidth select label="Specialization" name="specialization" value={form.specialization}
        onChange={handleChange} margin="normal">
        {SPECIALIZATIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </TextField>

      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
        sx={{ mt: 2, mb: 1, py: 1.5, borderRadius: 2, fontWeight: 700 }}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
      </Button>

      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" textAlign="center">
        Already have an account?{' '}
        <Button variant="text" size="small" onClick={onSwitch} sx={{ fontWeight: 700 }}>Sign In</Button>
      </Typography>
    </Box>
  );
};

export default RegisterForm;

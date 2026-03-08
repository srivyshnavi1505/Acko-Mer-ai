import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, CircularProgress, Alert, Chip, Box,
} from '@mui/material';
import { useSession } from '../../context/SessionContext';
import { toast } from 'react-toastify';

const SESSION_TYPES = ['consultation', 'follow-up', 'emergency', 'routine', 'specialist'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = { low: 'success', medium: 'info', high: 'warning', urgent: 'error' };

const CreateSessionDialog = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({
    doctorName: '', patientId: '', patientName: '',
    sessionType: 'consultation', priority: 'medium', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { createSession } = useSession();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.doctorName.trim()) { setError('Doctor name is required.'); return; }
    setLoading(true);
    try {
      const session = await createSession(form);
      toast.success('Session created successfully!');
      if (onCreated) onCreated(session);
      onClose();
      setForm({ doctorName: '', patientId: '', patientName: '', sessionType: 'consultation', priority: 'medium', notes: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>New Consultation Session</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth required label="Doctor Name" name="doctorName"
              value={form.doctorName} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Patient ID" name="patientId"
              value={form.patientId} onChange={handleChange} placeholder="MRN or ID" />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Patient Name" name="patientName"
              value={form.patientName} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Session Type" name="sessionType"
              value={form.sessionType} onChange={handleChange}>
              {SESSION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Priority" name="priority"
              value={form.priority} onChange={handleChange}>
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>
                  <Chip label={p.toUpperCase()} color={PRIORITY_COLORS[p]} size="small" sx={{ mr: 1 }} />
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Initial Notes (optional)" name="notes"
              value={form.notes} onChange={handleChange} placeholder="Any relevant pre-consultation notes..." />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ fontWeight: 700 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Start Session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSessionDialog;

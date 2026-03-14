import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Grid, CircularProgress, Alert, Divider,
  Typography, IconButton, Box, Chip,
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { patientAPI } from '../../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];
const GENDERS = ['male', 'female', 'other'];
const SEVERITY = ['mild', 'moderate', 'severe'];

const emptyForm = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'male',
  bloodGroup: 'unknown', phone: '', email: '', address: '',
  chronicConditions: [], currentMedications: [], allergies: [],
  emergencyContact: { name: '', relationship: '', phone: '' },
  notes: '',
};

const CreatePatientDialog = ({ open, onClose, onSaved, editData }) => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState({ substance: '', reaction: '', severity: 'mild' });

  useEffect(() => {
    if (editData) {
      setForm({
        ...emptyForm, ...editData,
        dateOfBirth: editData.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : '',
        emergencyContact: editData.emergencyContact || { name: '', relationship: '', phone: '' },
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [editData, open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setEC = (field) => (e) => setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, [field]: e.target.value } }));

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setForm((f) => ({ ...f, chronicConditions: [...f.chronicConditions, newCondition.trim()] }));
    setNewCondition('');
  };

  const removeCondition = (i) => setForm((f) => ({ ...f, chronicConditions: f.chronicConditions.filter((_, idx) => idx !== i) }));

  const addAllergy = () => {
    if (!newAllergy.substance.trim()) return;
    setForm((f) => ({ ...f, allergies: [...f.allergies, { ...newAllergy }] }));
    setNewAllergy({ substance: '', reaction: '', severity: 'mild' });
  };

  const removeAllergy = (i) => setForm((f) => ({ ...f, allergies: f.allergies.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim()) { setError('First and last name are required.'); return; }
    if (!form.gender) { setError('Gender is required.'); return; }
    setLoading(true);
    try {
      if (editData) {
        await patientAPI.update(editData._id, form);
      } else {
        await patientAPI.create(form);
      }
      onSaved();
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {editData ? 'Edit Patient' : 'Add New Patient'}
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Basic Info */}
        <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1.5 }}>
          Personal Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <TextField fullWidth required label="First Name" value={form.firstName} onChange={set('firstName')} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth required label="Last Name" value={form.lastName} onChange={set('lastName')} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth select required label="Gender" value={form.gender} onChange={set('gender')}>
              {GENDERS.map((g) => <MenuItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth}
              onChange={set('dateOfBirth')} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth select label="Blood Group" value={form.bloodGroup} onChange={set('bloodGroup')}>
              {BLOOD_GROUPS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Address" value={form.address} onChange={set('address')} />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* Chronic Conditions */}
        <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1.5 }}>
          Chronic Conditions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField size="small" fullWidth placeholder="e.g. Type 2 Diabetes"
            value={newCondition} onChange={(e) => setNewCondition(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCondition()} />
          <Button variant="outlined" onClick={addCondition} startIcon={<Add />}>Add</Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {form.chronicConditions.map((c, i) => (
            <Chip key={i} label={c} onDelete={() => removeCondition(i)} color="warning" variant="outlined" />
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Allergies */}
        <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1.5 }}>
          Allergies
        </Typography>
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={4}>
            <TextField size="small" fullWidth placeholder="Substance (e.g. Penicillin)"
              value={newAllergy.substance} onChange={(e) => setNewAllergy((a) => ({ ...a, substance: e.target.value }))} />
          </Grid>
          <Grid item xs={4}>
            <TextField size="small" fullWidth placeholder="Reaction"
              value={newAllergy.reaction} onChange={(e) => setNewAllergy((a) => ({ ...a, reaction: e.target.value }))} />
          </Grid>
          <Grid item xs={2}>
            <TextField size="small" fullWidth select value={newAllergy.severity}
              onChange={(e) => setNewAllergy((a) => ({ ...a, severity: e.target.value }))}>
              {SEVERITY.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={2}>
            <Button fullWidth variant="outlined" onClick={addAllergy} sx={{ height: '100%' }}>Add</Button>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {form.allergies.map((a, i) => (
            <Chip key={i} label={`${a.substance} (${a.severity})`}
              onDelete={() => removeAllergy(i)} color="error" variant="outlined" />
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Emergency Contact */}
        <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1.5 }}>
          Emergency Contact
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <TextField fullWidth label="Contact Name" value={form.emergencyContact.name} onChange={setEC('name')} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Relationship" value={form.emergencyContact.relationship} onChange={setEC('relationship')} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Phone" value={form.emergencyContact.phone} onChange={setEC('phone')} />
          </Grid>
        </Grid>

        {/* Notes */}
        <TextField fullWidth multiline rows={2} label="Additional Notes"
          value={form.notes} onChange={set('notes')} />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ fontWeight: 700, px: 4 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : editData ? 'Save Changes' : 'Add Patient'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePatientDialog;

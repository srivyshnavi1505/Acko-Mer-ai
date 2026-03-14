import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Button, Grid, Paper, TextField,
  InputAdornment, Skeleton, Chip, Avatar, Card, CardContent,
  CardActions, IconButton, Tooltip, Pagination,
} from '@mui/material';
import {
  Add, Search, Person, Phone, Bloodtype, Edit, Delete,
  History, Female, Male,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { patientAPI } from '../services/api';
import { toast } from 'react-toastify';
import CreatePatientDialog from '../components/patients/CreatePatientDialog';

const BLOOD_COLORS = { 'A+': '#e53935', 'A-': '#e53935', 'B+': '#1e88e5', 'B-': '#1e88e5', 'AB+': '#8e24aa', 'AB-': '#8e24aa', 'O+': '#43a047', 'O-': '#43a047', unknown: '#757575' };

const PatientCard = ({ patient, onEdit, onDelete, onViewHistory }) => {
  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const avatarColor = BLOOD_COLORS[patient.bloodGroup] || '#1565c0';

  return (
    <Card elevation={0} sx={{
      border: '1px solid', borderColor: 'divider', borderRadius: 3,
      transition: 'all 0.2s',
      '&:hover': { boxShadow: 4, borderColor: 'primary.main', transform: 'translateY(-2px)' },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: avatarColor, width: 48, height: 48, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {patient.firstName} {patient.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {patient.patientCode}
            </Typography>
          </Box>
          <Chip
            label={patient.bloodGroup}
            size="small"
            sx={{ bgcolor: avatarColor, color: 'white', fontWeight: 700, fontSize: 11 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {patient.gender === 'male' ? <Male fontSize="small" color="action" /> : <Female fontSize="small" color="action" />}
            <Typography variant="body2" color="text.secondary">
              {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
              {patient.age ? `, ${patient.age} yrs` : ''}
            </Typography>
          </Box>
          {patient.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">{patient.phone}</Typography>
            </Box>
          )}
          {patient.chronicConditions?.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {patient.chronicConditions.slice(0, 2).map((c, i) => (
                <Chip key={i} label={c} size="small" variant="outlined" color="warning" sx={{ fontSize: 10 }} />
              ))}
              {patient.chronicConditions.length > 2 && (
                <Chip label={`+${patient.chronicConditions.length - 2}`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
              )}
            </Box>
          )}
          {patient.allergies?.length > 0 && (
            <Chip label={`⚠️ ${patient.allergies.length} allerg${patient.allergies.length > 1 ? 'ies' : 'y'}`}
              size="small" color="error" variant="outlined" sx={{ alignSelf: 'flex-start', fontSize: 10, mt: 0.5 }} />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Button size="small" startIcon={<History />} onClick={() => onViewHistory(patient._id)}>
          History
        </Button>
        <Box>
          <Tooltip title="Edit patient">
            <IconButton size="small" onClick={() => onEdit(patient)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete patient">
            <IconButton size="small" color="error" onClick={() => onDelete(patient)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

const PatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);
  const [editPatient, setEditPatient] = useState(null);

  const fetchPatients = useCallback(async (searchVal = search, pageVal = page) => {
    setLoading(true);
    try {
      const res = await patientAPI.getAll({ search: searchVal, page: pageVal, limit: 12 });
      setPatients(res.data.patients);
      setTotalPages(res.pages);
      setTotal(res.total);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
    fetchPatients(e.target.value, 1);
  };

  const handleDelete = async (patient) => {
    if (!window.confirm(`Delete patient ${patient.firstName} ${patient.lastName}?`)) return;
    try {
      await patientAPI.delete(patient._id);
      toast.success('Patient removed.');
      fetchPatients();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreated = () => {
    setOpenCreate(false);
    setEditPatient(null);
    fetchPatients();
    toast.success('Patient saved!');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Patients</Typography>
          <Typography color="text.secondary">{total} patient{total !== 1 ? 's' : ''} registered</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} size="large"
          onClick={() => setOpenCreate(true)} sx={{ borderRadius: 2, px: 3 }}>
          Add Patient
        </Button>
      </Box>

      {/* Search */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TextField fullWidth placeholder="Search by name, patient code, or phone..."
          value={search} onChange={handleSearch}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
      </Paper>

      {/* Grid */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rounded" height={220} />
            </Grid>
          ))}
        </Grid>
      ) : patients.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No patients found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {search ? 'Try a different search' : 'Add your first patient to get started'}
          </Typography>
          {!search && (
            <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setOpenCreate(true)}>
              Add Patient
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {patients.map((patient) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={patient._id}>
                <PatientCard
                  patient={patient}
                  onEdit={(p) => { setEditPatient(p); setOpenCreate(true); }}
                  onDelete={handleDelete}
                  onViewHistory={(id) => navigate(`/patients/${id}`)}
                />
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={totalPages} page={page}
                onChange={(_, v) => { setPage(v); fetchPatients(search, v); }} color="primary" />
            </Box>
          )}
        </>
      )}

      <CreatePatientDialog
        open={openCreate}
        onClose={() => { setOpenCreate(false); setEditPatient(null); }}
        onSaved={handleCreated}
        editData={editPatient}
      />
    </Container>
  );
};

export default PatientsPage;

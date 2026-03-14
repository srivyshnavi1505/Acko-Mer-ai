import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Paper, Chip, Avatar,
  CircularProgress, Alert, Divider, Card, CardContent, Tab, Tabs,
  List, ListItem, ListItemText, Breadcrumbs, Link,
} from '@mui/material';
import {
  ArrowBack, Person, Phone, Email, Bloodtype, Warning,
  MedicalServices, History, Edit, AccessTime,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { patientAPI } from '../services/api';
import { toast } from 'react-toastify';
import CreatePatientDialog from '../components/patients/CreatePatientDialog';

const STATUS_COLORS = { active: 'success', paused: 'warning', completed: 'default' };

const InfoRow = ({ label, value }) => value ? (
  <Box sx={{ mb: 1 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
) : null;

const PatientProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [openEdit, setOpenEdit] = useState(false);

  const fetchData = async () => {
    try {
      const res = await patientAPI.getWithHistory(id);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const formatDuration = (duration) => {
    if (!duration) return null;
    return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={48} />
    </Box>
  );

  if (error) return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Alert severity="error" action={<Button onClick={() => navigate('/patients')}>Go Back</Button>}>{error}</Alert>
    </Container>
  );

  const { patient, sessions, totalVisits } = data;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/" underline="hover" color="inherit" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
        <Link href="/patients" underline="hover" color="inherit" onClick={(e) => { e.preventDefault(); navigate('/patients'); }}>Patients</Link>
        <Typography color="text.primary">{patient.firstName} {patient.lastName}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24, fontWeight: 700 }}>
              {patient.firstName[0]}{patient.lastName[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>{patient.firstName} {patient.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">{patient.patientCode}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={patient.bloodGroup} size="small" color="error" />
                <Chip label={patient.gender} size="small" variant="outlined" />
                {patient.age && <Chip label={`${patient.age} years`} size="small" variant="outlined" />}
                <Chip label={`${totalVisits} visit${totalVisits !== 1 ? 's' : ''}`} size="small" color="primary" variant="outlined" />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Edit />} onClick={() => setOpenEdit(true)}>Edit</Button>
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/patients')}>Back</Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left — Patient Info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Contact Information</Typography>
            <InfoRow label="Phone" value={patient.phone} />
            <InfoRow label="Email" value={patient.email} />
            <InfoRow label="Address" value={patient.address} />
            <InfoRow label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
            {patient.emergencyContact?.name && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Emergency Contact</Typography>
                <InfoRow label="Name" value={patient.emergencyContact.name} />
                <InfoRow label="Relationship" value={patient.emergencyContact.relationship} />
                <InfoRow label="Phone" value={patient.emergencyContact.phone} />
              </>
            )}
          </Paper>

          {/* Allergies */}
          {patient.allergies?.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'error.light', borderRadius: 2, mb: 2, bgcolor: 'error.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Warning color="error" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700} color="error">Allergies</Typography>
              </Box>
              {patient.allergies.map((a, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{a.substance}</Typography>
                  <Typography variant="caption" color="text.secondary">{a.reaction} — <b>{a.severity}</b></Typography>
                </Box>
              ))}
            </Paper>
          )}

          {/* Chronic Conditions */}
          {patient.chronicConditions?.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'warning.light', borderRadius: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <MedicalServices color="warning" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>Chronic Conditions</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {patient.chronicConditions.map((c, i) => (
                  <Chip key={i} label={c} color="warning" variant="outlined" size="small" />
                ))}
              </Box>
            </Paper>
          )}

          {/* Current Medications */}
          {patient.currentMedications?.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Current Medications</Typography>
              {patient.currentMedications.map((m, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.dosage} — {m.frequency}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Grid>

        {/* Right — Visit History */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Visit History ({totalVisits})
              </Typography>
            </Box>
            {sessions.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <History sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No visits recorded yet</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {sessions.map((session, i) => (
                  <React.Fragment key={session._id}>
                    <ListItem sx={{ px: 3, py: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => navigate(`/session/${session._id}`)}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={600}>
                              {formatDate(session.startedAt)}
                            </Typography>
                            <Chip label={session.status} color={STATUS_COLORS[session.status] || 'default'} size="small" />
                            <Chip label={session.sessionType} size="small" variant="outlined" />
                            {session.priority === 'urgent' && <Chip label="urgent" color="error" size="small" />}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary">Dr. {session.doctorName}</Typography>
                            {session.duration && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                <AccessTime sx={{ fontSize: 12 }} />
                                <Typography variant="caption" color="text.secondary">{formatDuration(session.duration)}</Typography>
                              </Box>
                            )}
                            {session.hasSummary && <Chip label="Summary ready" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < sessions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <CreatePatientDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSaved={() => { setOpenEdit(false); fetchData(); toast.success('Patient updated!'); }}
        editData={patient}
      />
    </Container>
  );
};

export default PatientProfilePage;

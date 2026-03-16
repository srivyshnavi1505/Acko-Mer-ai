import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Button, Chip, Grid, Paper,
  CircularProgress, Alert, Divider, Avatar,
  List, ListItem, ListItemText, Breadcrumbs, Link,
} from '@mui/material';
import {
  ArrowBack, Warning, MedicalServices, History,
  Edit, AccessTime, Person, FiberManualRecord,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { patientAPI } from '../services/api';
import { toast } from 'react-toastify';
import CreatePatientDialog from '../components/patients/CreatePatientDialog';

const STATUS_COLORS = { active: 'success', paused: 'warning', completed: 'default' };

const InfoRow = ({ label, value }) => value ? (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500} color="text.primary" sx={{ mt: 0.3 }}>{value}</Typography>
  </Box>
) : null;

const SectionCard = ({ children, sx = {} }) => (
  <Paper elevation={0} sx={{
    p: 3,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    mb: 2,
    ...sx,
  }}>
    {children}
  </Paper>
);

const PatientProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const formatDuration = (duration) => duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : null;

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', bgcolor: 'background.default' }}>
      <CircularProgress sx={{ color: '#457b9d' }} size={40} thickness={4} />
    </Box>
  );

  if (error) return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Alert severity="error" action={<Button onClick={() => navigate('/patients')}>Go Back</Button>}>{error}</Alert>
    </Container>
  );

  const { patient, sessions, totalVisits } = data;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1d3557 0%, #457b9d 100%)',
        pt: 4, pb: 7, px: 2,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -40,
          left: 0, right: 0,
          height: 80,
          bgcolor: 'background.default',
          borderRadius: '50% 50% 0 0 / 40px 40px 0 0',
        },
      }}>
        <Container maxWidth="xl">
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link href="/" underline="hover" sx={{ color: 'rgba(241,250,238,0.6)', fontSize: 13 }} onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
            <Link href="/patients" underline="hover" sx={{ color: 'rgba(241,250,238,0.6)', fontSize: 13 }} onClick={(e) => { e.preventDefault(); navigate('/patients'); }}>Patients</Link>
            <Typography sx={{ color: '#a8dadc', fontSize: 13 }}>{patient.firstName} {patient.lastName}</Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar sx={{
                width: 70, height: 70,
                bgcolor: '#a8dadc',
                color: '#1d3557',
                fontSize: 26, fontWeight: 800,
                border: '3px solid rgba(241,250,238,0.3)',
              }}>
                {patient.firstName[0]}{patient.lastName[0]}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#f1faee', letterSpacing: '-0.3px' }}>
                  {patient.firstName} {patient.lastName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(241,250,238,0.6)', mt: 0.3 }}>
                  {patient.patientCode}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.8, mt: 1, flexWrap: 'wrap' }}>
                  {patient.bloodGroup && (
                    <Chip label={patient.bloodGroup} size="small" sx={{ bgcolor: 'rgba(193,18,31,0.2)', color: '#ff8a8a', border: '1px solid rgba(193,18,31,0.3)', fontSize: 11, fontWeight: 600 }} />
                  )}
                  <Chip label={patient.gender} size="small" sx={{ bgcolor: 'rgba(168,218,220,0.15)', color: '#a8dadc', border: '1px solid rgba(168,218,220,0.25)', fontSize: 11 }} />
                  {patient.age && <Chip label={`${patient.age} yrs`} size="small" sx={{ bgcolor: 'rgba(168,218,220,0.15)', color: '#a8dadc', border: '1px solid rgba(168,218,220,0.25)', fontSize: 11 }} />}
                  <Chip label={`${totalVisits} visit${totalVisits !== 1 ? 's' : ''}`} size="small" sx={{ bgcolor: 'rgba(69,123,157,0.3)', color: '#f1faee', fontSize: 11, fontWeight: 600 }} />
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<Edit />} onClick={() => setOpenEdit(true)}
                sx={{ color: '#a8dadc', borderColor: 'rgba(168,218,220,0.4)', '&:hover': { borderColor: '#a8dadc', bgcolor: 'rgba(168,218,220,0.1)' } }}>
                Edit
              </Button>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/patients')}
                sx={{ color: 'rgba(241,250,238,0.7)', borderColor: 'rgba(241,250,238,0.25)', '&:hover': { borderColor: '#f1faee', bgcolor: 'rgba(241,250,238,0.08)' } }}>
                Back
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 0, pb: 6, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={4}>
            <SectionCard>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
                Contact Information
              </Typography>
              <InfoRow label="Phone" value={patient.phone} />
              <InfoRow label="Email" value={patient.email} />
              <InfoRow label="Address" value={patient.address} />
              <InfoRow label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
              {patient.emergencyContact?.name && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
                    Emergency Contact
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <InfoRow label="Name" value={patient.emergencyContact.name} />
                    <InfoRow label="Relationship" value={patient.emergencyContact.relationship} />
                    <InfoRow label="Phone" value={patient.emergencyContact.phone} />
                  </Box>
                </>
              )}
            </SectionCard>

            {patient.allergies?.length > 0 && (
              <SectionCard sx={{ borderColor: 'rgba(193,18,31,0.2)', bgcolor: 'rgba(193,18,31,0.03)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Warning sx={{ color: '#c1121f', fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="error.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
                    Allergies
                  </Typography>
                </Box>
                {patient.allergies.map((a, i) => (
                  <Box key={i} sx={{ mb: 1.5, pl: 1, borderLeft: '2px solid rgba(193,18,31,0.3)' }}>
                    <Typography variant="body2" fontWeight={600}>{a.substance}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.reaction} — <b>{a.severity}</b></Typography>
                  </Box>
                ))}
              </SectionCard>
            )}

            {patient.chronicConditions?.length > 0 && (
              <SectionCard sx={{ borderColor: 'rgba(224,122,47,0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MedicalServices sx={{ color: '#e07a2f', fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
                    Chronic Conditions
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {patient.chronicConditions.map((c, i) => (
                    <Chip key={i} label={c} size="small" sx={{ bgcolor: 'rgba(224,122,47,0.08)', color: '#e07a2f', border: '1px solid rgba(224,122,47,0.2)', fontWeight: 500 }} />
                  ))}
                </Box>
              </SectionCard>
            )}

            {patient.currentMedications?.length > 0 && (
              <SectionCard>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
                  Current Medications
                </Typography>
                {patient.currentMedications.map((m, i) => (
                  <Box key={i} sx={{ mb: 1.5, pl: 1, borderLeft: '2px solid rgba(69,123,157,0.3)' }}>
                    <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{m.dosage} — {m.frequency}</Typography>
                  </Box>
                ))}
              </SectionCard>
            )}
          </Grid>

          {/* Right Column — Visit History */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{
                p: 2.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                <History sx={{ color: '#457b9d', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Visit History
                </Typography>
                <Chip label={totalVisits} size="small" sx={{ bgcolor: 'rgba(69,123,157,0.1)', color: '#457b9d', fontWeight: 700, ml: 0.5 }} />
              </Box>

              {sessions.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <History sx={{ fontSize: 44, color: 'rgba(69,123,157,0.2)', mb: 1.5 }} />
                  <Typography fontWeight={600} color="text.secondary">No visits recorded yet</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {sessions.map((session, i) => (
                    <React.Fragment key={session._id}>
                      <ListItem
                        sx={{
                          px: 3, py: 2.5, cursor: 'pointer',
                          transition: 'background 0.15s',
                          '&:hover': { bgcolor: 'rgba(69,123,157,0.04)' },
                        }}
                        onClick={() => navigate(`/session/${session._id}`)}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                              <FiberManualRecord sx={{ fontSize: 8, color: session.status === 'active' ? '#2d6a4f' : session.status === 'paused' ? '#e07a2f' : 'text.disabled' }} />
                              <Typography variant="body2" fontWeight={700}>
                                {formatDate(session.startedAt)}
                              </Typography>
                              <Chip label={session.status} color={STATUS_COLORS[session.status] || 'default'} size="small" sx={{ fontSize: 11, fontWeight: 600 }} />
                              <Chip label={session.sessionType} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                              {session.priority === 'urgent' && <Chip label="urgent" color="error" size="small" sx={{ fontSize: 11 }} />}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pl: 2 }}>
                              <Typography variant="caption" color="text.secondary">Dr. {session.doctorName}</Typography>
                              {session.duration && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                  <AccessTime sx={{ fontSize: 11, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">{formatDuration(session.duration)}</Typography>
                                </Box>
                              )}
                              {session.hasSummary && (
                                <Chip label="Summary ready" size="small" sx={{ height: 17, fontSize: 10, bgcolor: 'rgba(69,123,157,0.08)', color: '#457b9d', border: '1px solid rgba(69,123,157,0.2)' }} />
                              )}
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
      </Container>

      <CreatePatientDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSaved={() => { setOpenEdit(false); fetchData(); toast.success('Patient updated!'); }}
        editData={patient}
      />
    </Box>
  );
};

export default PatientProfilePage;
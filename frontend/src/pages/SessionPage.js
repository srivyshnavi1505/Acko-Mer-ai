import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Button, Chip, Grid, Paper, Tab, Tabs,
  CircularProgress, Alert, Breadcrumbs, Link, Tooltip,
} from '@mui/material';
import { ArrowBack, Stop, Person, AccessTime, Mic } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionAPI } from '../services/api';
import { toast } from 'react-toastify';
import AudioRecorder from '../components/recording/AudioRecorder';
import TranscriptPanel from '../components/transcription/TranscriptPanel';
import SummaryPanel from '../components/summary/SummaryPanel';

const STATUS_COLORS = { active: 'success', paused: 'warning', completed: 'default', archived: 'secondary' };

const TabPanel = ({ value, index, children }) => (
  <Box hidden={value !== index} sx={{ pt: 3 }}>{value === index && children}</Box>
);

const SessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [transcriptKey, setTranscriptKey] = useState(0);

  useEffect(() => {
    sessionAPI.getById(id)
      .then((res) => setSession(res.data.session))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEndSession = async () => {
    if (!window.confirm('End this session?')) return;
    try {
      const res = await sessionAPI.end(id);
      setSession(res.data.session);
      toast.success('Session ended. You can now generate a summary.');
      setTabValue(1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTranscriptCreated = () => {
    setTranscriptKey((k) => k + 1);
    setTabValue(1);
  };

  // ✅ FIXED: Use stored duration field, not live calculation
  const formatDuration = (session) => {
    if (session.duration) {
      const m = Math.floor(session.duration / 60);
      const s = session.duration % 60;
      return `${m}m ${s}s`;
    }
    if (session.status === 'active') return 'Ongoing';
    return '—';
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={48} />
    </Box>
  );

  if (error) return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Alert severity="error" action={<Button onClick={() => navigate('/')}>Go Back</Button>}>{error}</Alert>
    </Container>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/" underline="hover" color="inherit" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          Dashboard
        </Link>
        <Typography color="text.primary">Session Details</Typography>
      </Breadcrumbs>

      {/* Session Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip label={session.status.toUpperCase()} color={STATUS_COLORS[session.status]} />
              <Chip label={session.sessionType} variant="outlined" />
              <Chip label={session.priority} variant="outlined" />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {session.patientName || 'Unknown Patient'}
              {session.patientId && (
                <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                  ID: {session.patientId}
                </Typography>
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">Dr. {session.doctorName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(session.startedAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Mic fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Duration: {formatDuration(session)}
                </Typography>
              </Box>
            </Box>
            {session.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 600 }}>
                Notes: {session.notes}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {session.status === 'active' && (
              <Button variant="contained" color="error" startIcon={<Stop />} onClick={handleEndSession}>
                End Session
              </Button>
            )}
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/')}>
              Back
            </Button>
          </Box>
        </Box>
      </Paper>

      {session.status === 'active' && (
        <Box sx={{ mb: 3 }}>
          <AudioRecorder sessionId={id} onTranscriptCreated={handleTranscriptCreated} />
        </Box>
      )}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab label="Transcripts" />
          <Tab label="AI Summary" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <TranscriptPanel key={transcriptKey} sessionId={id} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <SummaryPanel sessionId={id} />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default SessionPage;

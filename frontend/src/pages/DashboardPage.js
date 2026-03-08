import React, { useEffect, useState } from 'react';
import {
  Box, Container, Grid, Typography, Button, Paper, Skeleton,
  Card, CardContent, Divider, Chip,
} from '@mui/material';
import { Add, TrendingUp, AccessTime, CheckCircle, Pending } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { sessionAPI } from '../services/api';
import SessionCard from '../components/sessions/SessionCard';
import CreateSessionDialog from '../components/sessions/CreateSessionDialog';

const StatCard = ({ title, value, icon, color }) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>{value}</Typography>
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.dark` }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessions, fetchSessions, loading } = useSession();
  const [stats, setStats] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchSessions({ limit: 12 });
    sessionAPI.getStats().then((res) => setStats(res.data.stats)).catch(() => {});
  }, []);

  const getCount = (status) => stats.find((s) => s._id === status)?.count || 0;

  const handleCreated = (session) => navigate(`/session/${session._id}`);

  const filteredSessions = filterStatus
    ? sessions.filter((s) => s.status === filterStatus)
    : sessions;

  const STATUSES = ['', 'active', 'completed', 'paused'];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Welcome, {user?.name || 'Doctor'} 👋
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} size="large"
          onClick={() => setOpenCreate(true)} sx={{ borderRadius: 2, px: 3 }}>
          New Session
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Sessions" value={stats.reduce((a, s) => a + s.count, 0)} icon={<TrendingUp />} color="primary" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active" value={getCount('active')} icon={<AccessTime />} color="warning" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Completed" value={getCount('completed')} icon={<CheckCircle />} color="success" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Paused" value={getCount('paused')} icon={<Pending />} color="info" />
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {STATUSES.map((s) => (
          <Chip key={s || 'all'} label={s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            color={filterStatus === s ? 'primary' : 'default'}
            variant={filterStatus === s ? 'filled' : 'outlined'}
            onClick={() => setFilterStatus(s)} clickable />
        ))}
      </Box>

      {/* Sessions Grid */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} lg={4} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : filteredSessions.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">No sessions yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click "New Session" to start your first consultation
          </Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setOpenCreate(true)}>
            Create Session
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredSessions.map((session) => (
            <Grid item xs={12} sm={6} lg={4} key={session._id}>
              <SessionCard session={session}
                onDelete={(id) => fetchSessions()}
                onUpdate={(updated) => fetchSessions()} />
            </Grid>
          ))}
        </Grid>
      )}

      <CreateSessionDialog open={openCreate} onClose={() => setOpenCreate(false)} onCreated={handleCreated} />
    </Container>
  );
};

export default DashboardPage;

import React, { useEffect, useState } from 'react';
import {
  Box, Container, Grid, Typography, Button, Paper, Skeleton,
  Card, CardContent, Chip,
} from '@mui/material';
import { Add, TrendingUp, AccessTime, CheckCircle, Pending } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { sessionAPI } from '../services/api';
import SessionCard from '../components/sessions/SessionCard';
import CreateSessionDialog from '../components/sessions/CreateSessionDialog';

const StatCard = ({ title, value, icon, color, bgColor }) => (
  <Card elevation={0} sx={{
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
    position: 'relative',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(29,53,87,0.1)',
    },
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: 'text.primary', letterSpacing: '-1px' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2.5,
          bgcolor: bgColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
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
  const filteredSessions = filterStatus ? sessions.filter((s) => s.status === filterStatus) : sessions;
  const STATUSES = ['', 'active', 'completed', 'paused'];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1d3557 0%, #457b9d 100%)',
        pt: 5, pb: 8, px: 2,
        position: 'relative',
        overflow: 'hidden',
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: '#a8dadc', fontWeight: 500, mb: 0.5, letterSpacing: '0.04em' }}>
                {greeting()},
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#f1faee', letterSpacing: '-0.5px' }}>
                Dr. {user?.name || 'Doctor'} 👋
              </Typography>
              <Typography sx={{ color: 'rgba(241,250,238,0.6)', mt: 0.5, fontSize: 14 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
           <Button
  variant="contained"
  startIcon={<Add />}
  size="large"
  onClick={() => setOpenCreate(true)}
  sx={{
    background: 'linear-gradient(135deg, #ffffff 0%, #e8f4f8 100%)',
    color: '#1d3557',
    fontWeight: 700,
    borderRadius: 3,
    px: 3.5,
    py: 1.2,
    fontSize: '0.95rem',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #ffffff 0%, #c8e6f0 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
    },
    '&:active': {
      transform: 'translateY(0px)',
    },
  }}
>
  New Session
</Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: -2, pb: 6, position: 'relative', zIndex: 1 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Total Sessions" value={stats.reduce((a, s) => a + s.count, 0)} icon={<TrendingUp fontSize="small" />} color="#1d3557" bgColor="rgba(29,53,87,0.08)" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Active" value={getCount('active')} icon={<AccessTime fontSize="small" />} color="#e07a2f" bgColor="rgba(224,122,47,0.1)" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Completed" value={getCount('completed')} icon={<CheckCircle fontSize="small" />} color="#2d6a4f" bgColor="rgba(45,106,79,0.1)" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Paused" value={getCount('paused')} icon={<Pending fontSize="small" />} color="#457b9d" bgColor="rgba(69,123,157,0.1)" />
          </Grid>
        </Grid>

        {/* Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mr: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filter:
          </Typography>
          {STATUSES.map((s) => (
            <Chip
              key={s || 'all'}
              label={s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              onClick={() => setFilterStatus(s)}
              clickable
              sx={{
                fontWeight: filterStatus === s ? 700 : 500,
                bgcolor: filterStatus === s ? '#1d3557' : 'transparent',
                color: filterStatus === s ? '#f1faee' : 'text.secondary',
                border: '1px solid',
                borderColor: filterStatus === s ? '#1d3557' : 'divider',
                '&:hover': { bgcolor: filterStatus === s ? '#1d3557' : 'rgba(69,123,157,0.08)' },
                transition: 'all 0.2s',
              }}
            />
          ))}
        </Box>

        {/* Sessions Grid */}
        {loading ? (
          <Grid container spacing={2.5}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} lg={4} key={i}>
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : filteredSessions.length === 0 ? (
          <Paper elevation={0} sx={{
            p: 7, textAlign: 'center',
            border: '2px dashed',
            borderColor: 'rgba(69,123,157,0.2)',
            borderRadius: 3,
            bgcolor: 'rgba(168,218,220,0.04)',
          }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: '50%',
              bgcolor: 'rgba(69,123,157,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
            }}>
              <Add sx={{ color: '#457b9d', fontSize: 28 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">No sessions yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
              Click "New Session" to start your first consultation
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenCreate(true)}
              sx={{ borderRadius: 2 }}
            >
              Create Session
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filteredSessions.map((session) => (
              <Grid item xs={12} sm={6} lg={4} key={session._id}>
                <SessionCard
                  session={session}
                  onDelete={() => fetchSessions()}
                  onUpdate={() => fetchSessions()}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <CreateSessionDialog open={openCreate} onClose={() => setOpenCreate(false)} onCreated={handleCreated} />
    </Box>
  );
};

export default DashboardPage;
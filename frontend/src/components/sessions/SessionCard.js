import React from 'react';
import {
  Card, CardContent, CardActions, Typography, Chip, Button, Box, IconButton, Tooltip,
} from '@mui/material';
import {
  AccessTime, Person, MicNone, Description, Delete, OpenInNew,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_COLORS = { active: 'success', paused: 'warning', completed: 'default', archived: 'secondary' };
const PRIORITY_COLORS = { low: 'success', medium: 'info', high: 'warning', urgent: 'error' };

const SessionCard = ({ session, onDelete, onUpdate }) => {
  const navigate = useNavigate();

  const handleEnd = async () => {
    try {
      await sessionAPI.end(session._id);
      if (onUpdate) onUpdate({ ...session, status: 'completed' });
      toast.success('Session ended.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this session and all its data?')) return;
    try {
      await sessionAPI.delete(session._id);
      if (onDelete) onDelete(session._id);
      toast.success('Session deleted.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Card elevation={0} sx={{
      border: '1px solid', borderColor: 'divider',
      borderRadius: 2, transition: 'all 0.2s',
      '&:hover': { boxShadow: 4, borderColor: 'primary.main' },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={session.status} color={STATUS_COLORS[session.status]} size="small" />
            <Chip label={session.priority} color={PRIORITY_COLORS[session.priority]} size="small" variant="outlined" />
          </Box>
          <Chip label={session.sessionType} size="small" variant="outlined" />
        </Box>

        <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
          {session.patientName || 'Unknown Patient'}
          {session.patientId && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({session.patientId})
            </Typography>
          )}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <Person fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">{session.doctorName}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <AccessTime fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">{formatDate(session.startedAt)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MicNone fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {session.transcriptCount || 0} recording{session.transcriptCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          {session.hasSummary && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Description fontSize="small" color="primary" />
              <Typography variant="caption" color="primary">Summary ready</Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Box>
          <Button size="small" startIcon={<OpenInNew />}
            onClick={() => navigate(`/session/${session._id}`)}>
            Open
          </Button>
          {session.status === 'active' && (
            <Button size="small" color="warning" onClick={handleEnd}>End</Button>
          )}
        </Box>
        <Tooltip title="Delete session">
          <IconButton size="small" color="error" onClick={handleDelete}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default SessionCard;

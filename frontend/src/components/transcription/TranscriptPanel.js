import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, CircularProgress, Button, TextField,
  IconButton, Tooltip, Alert, Divider, List, ListItem,
} from '@mui/material';
import { Edit, Save, Cancel, Refresh, Delete, Download } from '@mui/icons-material';
import { transcriptionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import useSocket from '../../hooks/useSocket';

const STATUS_COLORS = { pending: 'warning', processing: 'info', completed: 'success', failed: 'error' };

const TranscriptPanel = ({ sessionId }) => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTranscripts = transcripts.filter((t) =>
    t.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchTranscripts = async () => {
    try {
      const res = await transcriptionAPI.getBySession(sessionId);
      setTranscripts(res.data.transcripts);
    } catch (err) {
      console.error('Failed to fetch transcripts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTranscripts(); }, [sessionId]);

  // Real-time socket updates
  useSocket(sessionId, {
    'transcription:completed': (data) => {
      setTranscripts((prev) => {
        const exists = prev.find((t) => t._id === data.transcript._id);
        if (exists) return prev.map((t) => t._id === data.transcript._id ? data.transcript : t);
        return [data.transcript, ...prev];
      });
      toast.success('Transcription completed!');
    },
    'transcription:started': (data) => {
      toast.info('Transcription started...');
    },
    'transcription:failed': (data) => {
      toast.error(`Transcription failed: ${data.error}`);
      setTranscripts((prev) =>
        prev.map((t) => t._id === data.transcriptId ? { ...t, status: 'failed', errorMessage: data.error } : t)
      );
    },
  });

  const startEdit = (transcript) => {
    setEditingId(transcript._id);
    setEditText(transcript.text);
  };

  const saveEdit = async (transcriptId) => {
    try {
      const res = await transcriptionAPI.update(transcriptId, { text: editText, editedBy: 'doctor' });
      setTranscripts((prev) => prev.map((t) => t._id === transcriptId ? res.data.transcript : t));
      setEditingId(null);
      toast.success('Transcript updated.');
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (transcriptId) => {
    if (!window.confirm('Delete this transcript and its audio file?')) return;
    try {
      await transcriptionAPI.delete(transcriptId);
      setTranscripts((prev) => prev.filter((t) => t._id !== transcriptId));
      toast.success('Transcript deleted.');
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleExport = async (transcriptId, format) => {
    try {
      const blob = await transcriptionAPI.export(transcriptId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${transcriptId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  if (transcripts.length === 0) return (
    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography color="text.secondary">No transcripts yet.</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Record audio or upload an audio file to get started.
      </Typography>
    </Paper>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Transcripts ({transcripts.length})</Typography>
        <Tooltip title="Refresh"><IconButton onClick={fetchTranscripts} size="small"><Refresh /></IconButton></Tooltip>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Search transcripts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      {filteredTranscripts.map((transcript) => (
        <Paper key={transcript._id} elevation={0} sx={{
          mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label={transcript.status.toUpperCase()} color={STATUS_COLORS[transcript.status]} size="small" />
              {transcript.language && (
                <Chip label={transcript.language.toUpperCase()} variant="outlined" size="small" />
              )}
              {transcript.audioFile?.originalName && (
                <Typography variant="caption" color="text.secondary">
                  {transcript.audioFile.originalName}
                </Typography>
              )}
            </Box>
            <Box>
              {transcript.status === 'completed' && editingId !== transcript._id && (
                <>
                  <Tooltip title="Export as TXT">
                    <IconButton size="small" onClick={() => handleExport(transcript._id, 'txt')}>
                      <Download fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export as SRT">
                    <IconButton size="small" onClick={() => handleExport(transcript._id, 'srt')}>
                      <Download fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit transcript">
                    <IconButton size="small" onClick={() => startEdit(transcript)}><Edit fontSize="small" /></IconButton>
                  </Tooltip>
                </>
              )}
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => handleDelete(transcript._id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {transcript.status === 'processing' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">Transcribing audio...</Typography>
            </Box>
          )}

          {transcript.status === 'failed' && (
            <Alert severity="error" sx={{ mt: 1 }}>{transcript.errorMessage || 'Transcription failed.'}</Alert>
          )}

          {transcript.status === 'completed' && (
            editingId === transcript._id ? (
              <Box>
                <TextField fullWidth multiline minRows={4} value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  sx={{ mb: 1 }} variant="outlined" />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" startIcon={<Save />}
                    onClick={() => saveEdit(transcript._id)}>Save</Button>
                  <Button size="small" variant="outlined" startIcon={<Cancel />}
                    onClick={() => setEditingId(null)}>Cancel</Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {transcript.text || 'No text extracted.'}
              </Typography>
            )
          )}

          {transcript.processingTime && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Processed in {(transcript.processingTime / 1000).toFixed(1)}s
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default TranscriptPanel;

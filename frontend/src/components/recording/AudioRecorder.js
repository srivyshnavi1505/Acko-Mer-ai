import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, LinearProgress, Chip,
  IconButton, Alert, CircularProgress,
} from '@mui/material';
import { Mic, Stop, Pause, PlayArrow, CloudUpload } from '@mui/icons-material';
import { transcriptionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import useRecording from '../../hooks/useRecording';

const AudioRecorder = ({ sessionId, onTranscriptCreated }) => {
  const { isRecording, isPaused, durationFormatted, audioBlob, audioFile, error, start, stop, pause, resume } = useRecording(sessionId);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload({ target: { files } });
    }
  };

  const handleUploadBlob = async () => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      const res = await transcriptionAPI.uploadAudio(sessionId, formData, setUploadProgress);
      toast.success('Audio uploaded! Transcription in progress...');
      if (onTranscriptCreated) onTranscriptCreated(res.data.transcript);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files || e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0]; // Handle first file for now
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await transcriptionAPI.uploadAudio(sessionId, formData, setUploadProgress);
      toast.success(`File uploaded! Transcription in progress...`);
      if (onTranscriptCreated) onTranscriptCreated(res.data.transcript);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>Audio Recording</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Recording Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {!isRecording ? (
          <Button variant="contained" color="error" startIcon={<Mic />} onClick={start}
            size="large" sx={{ borderRadius: 2, px: 3 }}>
            Start Recording
          </Button>
        ) : (
          <>
            <Button variant="contained" color="error" startIcon={<Stop />} onClick={stop}
              size="large" sx={{ borderRadius: 2, px: 3 }}>
              Stop
            </Button>
            <IconButton onClick={isPaused ? resume : pause} color="warning" size="large">
              {isPaused ? <PlayArrow /> : <Pause />}
            </IconButton>
          </>
        )}

        {isRecording && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 10, height: 10, borderRadius: '50%',
              bgcolor: isPaused ? 'warning.main' : 'error.main',
              animation: isPaused ? 'none' : 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 }, '50%': { opacity: 0.4 }, '100%': { opacity: 1 },
              },
            }} />
            <Typography variant="h6" fontFamily="monospace">{durationFormatted}</Typography>
            <Chip label={isPaused ? 'PAUSED' : 'RECORDING'} color={isPaused ? 'warning' : 'error'} size="small" />
          </Box>
        )}
      </Box>

      {/* Upload recorded audio */}
      {audioBlob && !isRecording && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="success" sx={{ mb: 1 }}>
            Recording complete! Duration: {durationFormatted}
          </Alert>
          <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%', marginBottom: 8 }} />
          <Button variant="outlined" startIcon={<CloudUpload />} onClick={handleUploadBlob}
            disabled={uploading} fullWidth sx={{ borderRadius: 2 }}>
            {uploading ? 'Uploading...' : 'Upload & Transcribe'}
          </Button>
        </Box>
      )}

      {/* File Upload */}
      <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Or upload a pre-recorded audio file:
        </Typography>
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: dragOver ? 'action.hover' : 'transparent',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
        >
          <Button component="label" variant="outlined" startIcon={<CloudUpload />}
            disabled={uploading || isRecording} sx={{ borderStyle: 'dashed', mb: 1 }}>
            Upload Audio File
            <input hidden type="file" accept="audio/*" onChange={handleFileUpload} />
          </Button>
          <Typography variant="body2" color="text.secondary">
            or drag and drop files here
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>
          Supported: MP3, WAV, M4A, WebM, OGG — Max 500MB
        </Typography>
      </Box>

      {/* Upload progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">Uploading & processing...</Typography>
            <Typography variant="caption">{uploadProgress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
    </Paper>
  );
};

export default AudioRecorder;

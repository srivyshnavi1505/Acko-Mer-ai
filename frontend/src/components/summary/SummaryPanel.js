import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid, Chip, Divider,
  CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel,
  Accordion, AccordionSummary, AccordionDetails, IconButton, Tooltip,
} from '@mui/material';
import {
  AutoAwesome, Edit, Save, Cancel, Download, ExpandMore, Refresh,
} from '@mui/icons-material';
import { summaryAPI } from '../../services/api';
import { toast } from 'react-toastify';
import useSocket from '../../hooks/useSocket';

const TEMPLATES = ['SOAP', 'APSO', 'DAP', 'BIRP'];

const SUMMARY_FIELDS = [
  { key: 'chiefComplaint', label: 'Chief Complaint', rows: 2 },
  { key: 'historyOfPresentIllness', label: 'History of Present Illness', rows: 4 },
  { key: 'pastMedicalHistory', label: 'Past Medical History', rows: 3 },
  { key: 'medications', label: 'Current Medications', rows: 2 },
  { key: 'allergies', label: 'Allergies', rows: 2 },
  { key: 'assessment', label: 'Assessment', rows: 4 },
  { key: 'plan', label: 'Plan', rows: 4 },
  { key: 'prescription', label: 'Prescription', rows: 3 },
  { key: 'followUp', label: 'Follow-up Instructions', rows: 2 },
];

const SummaryPanel = ({ sessionId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [template, setTemplate] = useState('SOAP');

  const fetchSummary = async () => {
    try {
      const res = await summaryAPI.getBySession(sessionId);
      setSummary(res.data.summary);
      setEditData(res.data.summary);
    } catch {
      // No summary yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [sessionId]);

  useSocket(sessionId, {
    'summary:generated': (data) => {
      setSummary(data.summary);
      setEditData(data.summary);
      toast.success('Medical summary generated!');
    },
  });

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const res = await summaryAPI.generate(sessionId, { template });
      setSummary(res.data.summary);
      setEditData(res.data.summary);
      toast.success('Summary generated successfully!');
    } catch (err) {
      toast.error(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const saveSummary = async () => {
    try {
      const res = await summaryAPI.update(summary._id, editData);
      setSummary(res.data.summary);
      setEditing(false);
      toast.success('Summary saved.');
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await summaryAPI.export(summary._id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical_summary_${summary._id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight={600}>AI Medical Summary</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {summary && (
            <>
              <Button size="small" startIcon={<Download />} onClick={() => handleExport('json')} variant="outlined">
                Export JSON
              </Button>
              <Button size="small" startIcon={<Download />} onClick={() => handleExport('text')} variant="outlined">
                Export Text
              </Button>
              {!editing ? (
                <Button size="small" startIcon={<Edit />} onClick={() => { setEditing(true); setEditData(summary); }}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button size="small" variant="contained" startIcon={<Save />} onClick={saveSummary}>Save</Button>
                  <Button size="small" startIcon={<Cancel />} onClick={() => setEditing(false)}>Cancel</Button>
                </>
              )}
            </>
          )}

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {TEMPLATES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>

          <Button variant="contained" startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
            onClick={generateSummary} disabled={generating} sx={{ borderRadius: 2 }}>
            {generating ? 'Generating...' : summary ? 'Regenerate' : 'Generate Summary'}
          </Button>
        </Box>
      </Box>

      {!summary && !generating && (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <AutoAwesome sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
          <Typography color="text.secondary">No summary yet.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            First add a transcription, then click "Generate Summary" to create an AI-powered medical note.
          </Typography>
        </Paper>
      )}

      {generating && (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'primary.light', borderRadius: 2 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Analyzing transcript and generating {template} medical note...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>This may take 15-30 seconds</Typography>
        </Paper>
      )}

      {summary && !generating && (
        <Box>
          {/* Confidence & Metadata */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`Template: ${summary.template}`} variant="outlined" size="small" />
            <Chip label={`Model: ${summary.model}`} variant="outlined" size="small" />
            {summary.confidenceScore && (
              <Chip
                label={`Confidence: ${summary.confidenceScore}%`}
                color={summary.confidenceScore >= 80 ? 'success' : 'warning'}
                size="small"
              />
            )}
            {summary.isEdited && <Chip label="Edited" color="info" size="small" />}
          </Box>

          {/* Summary Fields */}
          <Grid container spacing={2}>
            {SUMMARY_FIELDS.map(({ key, label, rows }) => (
              <Grid item xs={12} key={key}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                    {label}
                  </Typography>
                  {editing ? (
                    <TextField fullWidth multiline rows={rows} value={editData[key] || ''}
                      onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value }))}
                      variant="outlined" size="small" />
                  ) : (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {summary[key] || <em style={{ opacity: 0.5 }}>Not discussed</em>}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* ICD-10 & CPT Codes */}
          {(summary.icdCodes?.length > 0 || summary.cptCodes?.length > 0) && (
            <Paper elevation={0} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Medical Codes</Typography>
              {summary.icdCodes?.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>ICD-10 Diagnosis Codes:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {summary.icdCodes.map((c, i) => (
                      <Tooltip key={i} title={`Confidence: ${Math.round(c.confidence * 100)}%`}>
                        <Chip label={`${c.code}: ${c.description}`} size="small"
                          color={c.confidence >= 0.9 ? 'success' : 'warning'} variant="outlined" />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}
              {summary.cptCodes?.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>CPT Procedure Codes:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {summary.cptCodes.map((c, i) => (
                      <Tooltip key={i} title={`Confidence: ${Math.round(c.confidence * 100)}%`}>
                        <Chip label={`${c.code}: ${c.description}`} size="small"
                          color={c.confidence >= 0.9 ? 'success' : 'warning'} variant="outlined" />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SummaryPanel;

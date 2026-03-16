import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, Divider, CircularProgress,
  Alert, Grid, TextField,
} from '@mui/material';
import {
  AutoAwesome, PictureAsPdf, Code, TextSnippet, Refresh, Edit, Save, Close,
} from '@mui/icons-material';
import { summaryAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Section = ({ title, content }) => content ? (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 0.5 }}>{title}</Typography>
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{content}</Typography>
  </Box>
) : null;

//  Builds full HTML string for PDF
const buildPDFContent = (summary, session) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Medical Summary - ${session?.patientName || 'Patient'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1565c0; padding-bottom: 12px; margin-bottom: 20px; }
    .logo { color: #1565c0; font-size: 20px; font-weight: bold; }
    .logo-sub { color: #666; font-size: 11px; margin-top: 2px; }
    .badge { background: #1565c0; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .meta { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; background: #f5f7fa; padding: 14px; border-radius: 8px; margin-bottom: 20px; }
    .meta-item b { display: block; color: #1565c0; font-size: 10px; text-transform: uppercase; margin-bottom: 3px; }
    .meta-item span { font-size: 13px; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 11px; font-weight: bold; color: #1565c0; text-transform: uppercase; border-left: 3px solid #1565c0; padding-left: 8px; margin-bottom: 6px; letter-spacing: 0.5px; }
    .section-content { font-size: 13px; line-height: 1.8; color: #333; padding-left: 11px; white-space: pre-wrap; }
    .codes { display: flex; gap: 6px; flex-wrap: wrap; padding-left: 11px; }
    .code-chip { background: #e3f2fd; color: #1565c0; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid #bbdefb; }
    .footer { margin-top: 40px; border-top: 1px solid #e0e0e0; padding-top: 12px; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">🏥 ACKO MER AI</div>
      <div class="logo-sub">Medical Encounter Recording & AI Summary System</div>
    </div>
    <div class="badge">${summary.template || 'SOAP'} NOTE</div>
  </div>

  <div class="meta">
    <div class="meta-item"><b>Doctor</b><span>${session?.doctorName ? 'Dr. ' + session.doctorName : 'N/A'}</span></div>
    <div class="meta-item"><b>Patient</b><span>${session?.patientName || 'N/A'}</span></div>
    <div class="meta-item"><b>Patient ID</b><span>${session?.patientId || 'N/A'}</span></div>
    <div class="meta-item"><b>Date</b><span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
  </div>

  ${summary.chiefComplaint ? `<div class="section"><div class="section-title">Chief Complaint</div><div class="section-content">${summary.chiefComplaint}</div></div>` : ''}
  ${summary.historyOfPresentIllness ? `<div class="section"><div class="section-title">History of Present Illness</div><div class="section-content">${summary.historyOfPresentIllness}</div></div>` : ''}
  ${summary.pastMedicalHistory ? `<div class="section"><div class="section-title">Past Medical History</div><div class="section-content">${summary.pastMedicalHistory}</div></div>` : ''}
  <hr class="divider"/>
  ${summary.assessment ? `<div class="section"><div class="section-title">Assessment</div><div class="section-content">${summary.assessment}</div></div>` : ''}
  ${summary.plan ? `<div class="section"><div class="section-title">Plan</div><div class="section-content">${summary.plan}</div></div>` : ''}
  ${summary.prescription ? `<div class="section"><div class="section-title">Prescription / Medications</div><div class="section-content">${summary.prescription}</div></div>` : ''}
  ${summary.followUp ? `<div class="section"><div class="section-title">Follow Up</div><div class="section-content">${summary.followUp}</div></div>` : ''}

  ${summary.icdCodes?.length ? `
  <hr class="divider"/>
  <div class="section">
    <div class="section-title">ICD-10 Diagnosis Codes</div>
    <div class="codes" style="margin-top:6px">
      ${summary.icdCodes.map(c => `<span class="code-chip">${c.code} — ${c.description}</span>`).join('')}
    </div>
  </div>` : ''}

  ${summary.cptCodes?.length ? `
  <div class="section">
    <div class="section-title">CPT Procedure Codes</div>
    <div class="codes" style="margin-top:6px">
      ${summary.cptCodes.map(c => `<span class="code-chip">${c.code} — ${c.description}</span>`).join('')}
    </div>
  </div>` : ''}

  <div class="footer">
    Generated by ACKO MER AI &nbsp;•&nbsp; ${new Date().toLocaleString('en-IN')} &nbsp;•&nbsp; Confidential Medical Record &nbsp;•&nbsp; Not for distribution
  </div>
</body>
</html>`;

const EDIT_FIELDS = [
  { key: 'chiefComplaint', label: 'Chief Complaint' },
  { key: 'historyOfPresentIllness', label: 'History of Present Illness' },
  { key: 'pastMedicalHistory', label: 'Past Medical History' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'plan', label: 'Plan' },
  { key: 'prescription', label: 'Prescription' },
  { key: 'followUp', label: 'Follow Up' },
];

const SummaryPanel = ({ sessionId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await summaryAPI.getBySession(sessionId);
      setSummary(res.data.summary);
    } catch (err) {
      if (!err.message.includes('404')) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [sessionId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await summaryAPI.generate(sessionId, { template: 'SOAP' });
      setSummary(res.data.summary);
      toast.success('Summary generated!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Edit handlers
  const handleEditStart = () => {
    setEditForm({
      chiefComplaint: summary.chiefComplaint || '',
      historyOfPresentIllness: summary.historyOfPresentIllness || '',
      pastMedicalHistory: summary.pastMedicalHistory || '',
      assessment: summary.assessment || '',
      plan: summary.plan || '',
      prescription: summary.prescription || '',
      followUp: summary.followUp || '',
    });
    setEditing(true);
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const res = await summaryAPI.update(summary._id, editForm);
      setSummary(res.data.summary);
      setEditing(false);
      toast.success('Summary updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditForm({});
  };

  // PDF export
  const handleExportPDF = () => {
    if (!summary) return;
    const session = summary.sessionId || {};
    const htmlContent = buildPDFContent(summary, session);
    const patientName = (session.patientName || 'patient').replace(/\s+/g, '_');
    const date = new Date().toISOString().split('T')[0];

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        setTimeout(() => {
          win.document.title = `Summary_${patientName}_${date}`;
          win.print();
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        }, 300);
      };
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = `Summary_${patientName}_${date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success('PDF opened for printing. Use "Save as PDF" in the print dialog!');
  };

  const handleExportJSON = async () => {
    try {
      const res = await summaryAPI.export(summary._id, 'json');
      const url = URL.createObjectURL(res);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary_${summary._id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleExportText = async () => {
    try {
      const res = await summaryAPI.export(summary._id, 'text');
      const url = URL.createObjectURL(res);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary_${summary._id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Export failed');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress />
    </Box>
  );

  if (!summary) return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <AutoAwesome sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>No Summary Yet</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Generate an AI-powered SOAP note from the transcription
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button variant="contained"
        startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
        onClick={handleGenerate} disabled={generating} size="large">
        {generating ? 'Generating...' : 'Generate AI Summary'}
      </Button>
    </Box>
  );

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={summary.template} color="primary" size="small" />
          {summary.isEdited && <Chip label="Edited" size="small" variant="outlined" />}
          {summary.sessionId?.patientName && (
            <Chip label={summary.sessionId.patientName} size="small" variant="outlined" color="secondary" />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Edit / Save / Cancel buttons */}
          {!editing ? (
            <Button size="small" startIcon={<Edit />} variant="outlined"
              color="primary" onClick={handleEditStart}>
              Edit
            </Button>
          ) : (
            <>
              <Button size="small" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save />}
                variant="contained" color="success" onClick={handleEditSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button size="small" startIcon={<Close />} variant="outlined"
                onClick={handleEditCancel} disabled={saving}>
                Cancel
              </Button>
            </>
          )}

          <Button size="small" startIcon={<PictureAsPdf />} variant="contained"
            color="error" onClick={handleExportPDF} disabled={editing}>
            Export PDF
          </Button>
          <Button size="small" startIcon={<TextSnippet />} variant="outlined"
            onClick={handleExportText} disabled={editing}>
            Text
          </Button>
          <Button size="small" startIcon={<Code />} variant="outlined"
            onClick={handleExportJSON} disabled={editing}>
            JSON
          </Button>
          <Button size="small" startIcon={<Refresh />} variant="outlined"
            onClick={handleGenerate} disabled={generating || editing}>
            {generating ? 'Generating...' : 'Regenerate'}
          </Button>
        </Box>
      </Box>

      {/* Summary Content */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: editing ? 'primary.main' : 'divider', borderRadius: 2 }}>
        {/* Session info header */}
        {summary.sessionId && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              <b>Doctor:</b> {summary.sessionId.doctorName ? `Dr. ${summary.sessionId.doctorName}` : 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <b>Patient:</b> {summary.sessionId.patientName || 'N/A'}
            </Typography>
            {summary.sessionId.patientId && (
              <Typography variant="caption" color="text.secondary">
                <b>ID:</b> {summary.sessionId.patientId}
              </Typography>
            )}
          </Box>
        )}

        
        {editing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {EDIT_FIELDS.map(({ key, label }) => (
              <TextField key={key} fullWidth multiline minRows={2} label={label}
                value={editForm[key]}
                onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} />
            ))}
          </Box>
        ) : (
          <>
            <Section title="Chief Complaint" content={summary.chiefComplaint} />
            <Section title="History of Present Illness" content={summary.historyOfPresentIllness} />
            <Section title="Past Medical History" content={summary.pastMedicalHistory} />
            <Divider sx={{ my: 2 }} />
            <Section title="Assessment" content={summary.assessment} />
            <Section title="Plan" content={summary.plan} />
            <Section title="Prescription" content={summary.prescription} />
            <Section title="Follow Up" content={summary.followUp} />
          </>
        )}

        {/* ICD / CPT codes — always visible */}
        {(summary.icdCodes?.length > 0 || summary.cptCodes?.length > 0) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {summary.icdCodes?.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1 }}>ICD-10 Codes</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {summary.icdCodes.map((c, i) => (
                      <Chip key={i} label={`${c.code} — ${c.description}`} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
              {summary.cptCodes?.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1 }}>CPT Codes</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {summary.cptCodes.map((c, i) => (
                      <Chip key={i} label={`${c.code} — ${c.description}`} size="small" color="secondary" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default SummaryPanel;

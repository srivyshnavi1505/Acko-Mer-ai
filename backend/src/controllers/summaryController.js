const Session = require('../models/Session');
const Transcript = require('../models/Transcript');
const Summary = require('../models/Summary');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateMedicalSummary } = require('../services/openaiService');
const { emitToSession } = require('../config/socket');
const { TRANSCRIPT_STATUS } = require('../config/constants');
const logger = require('../config/logger');

exports.generateSummary = catchAsync(async (req, res, next) => {
  const session = await Session.findById(req.params.sessionId);
  if (!session) return next(new AppError('Session not found.', 404));

  // Get the latest completed transcript
  const transcript = await Transcript.findOne({
    sessionId: session._id,
    status: TRANSCRIPT_STATUS.COMPLETED,
  }).sort({ createdAt: -1 });

  if (!transcript || !transcript.text) {
    return next(new AppError('No completed transcription found for this session.', 400));
  }

  const { template = 'SOAP' } = req.body;

  try {
    logger.info(`Generating summary for session: ${session._id}`);
    const summaryData = await generateMedicalSummary(transcript.text, template, {
      doctorName: session.doctorName,
      sessionType: session.sessionType,
      sessionId: session._id,
    });

    // Upsert summary (update if exists, create if not)
    let summary = await Summary.findOne({ sessionId: session._id });
    if (summary) {
      summary.versions.push({ data: summary.toObject() });
      Object.assign(summary, summaryData, { template, transcriptId: transcript._id });
      await summary.save();
    } else {
      summary = await Summary.create({
        sessionId: session._id,
        transcriptId: transcript._id,
        template,
        ...summaryData,
      });
    }

    // Mark session as having a summary
    await Session.findByIdAndUpdate(session._id, { hasSummary: true });
    emitToSession(session._id.toString(), 'summary:generated', { summary });

    res.status(200).json({ status: 'success', data: { summary } });
  } catch (error) {
    logger.error('Summary generation error:', error.message);
    return next(new AppError(error.message, 500));
  }
});

exports.getSummary = catchAsync(async (req, res, next) => {
  const summary = await Summary.findById(req.params.id).populate('sessionId', 'doctorName patientName sessionType');
  if (!summary) return next(new AppError('Summary not found.', 404));
  res.status(200).json({ status: 'success', data: { summary } });
});

exports.getSessionSummary = catchAsync(async (req, res, next) => {
  const summary = await Summary.findOne({ sessionId: req.params.sessionId });
  if (!summary) return next(new AppError('No summary found for this session.', 404));
  res.status(200).json({ status: 'success', data: { summary } });
});

exports.updateSummary = catchAsync(async (req, res, next) => {
  const summary = await Summary.findById(req.params.id);
  if (!summary) return next(new AppError('Summary not found.', 404));

  summary.versions.push({ data: summary.toObject() });
  Object.assign(summary, req.body, { isEdited: true });
  await summary.save();

  res.status(200).json({ status: 'success', data: { summary } });
});

exports.exportSummary = catchAsync(async (req, res, next) => {
  const summary = await Summary.findById(req.params.id).populate('sessionId');
  if (!summary) return next(new AppError('Summary not found.', 404));

  const { format = 'json' } = req.params;
  const session = summary.sessionId;

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="summary_${summary._id}.json"`);
    return res.json({
      exportedAt: new Date().toISOString(),
      session: { id: session._id, doctorName: session?.doctorName, patientName: session?.patientName },
      summary: {
        chiefComplaint: summary.chiefComplaint,
        historyOfPresentIllness: summary.historyOfPresentIllness,
        assessment: summary.assessment,
        plan: summary.plan,
        prescription: summary.prescription,
        followUp: summary.followUp,
        icdCodes: summary.icdCodes,
        cptCodes: summary.cptCodes,
      },
    });
  }

  if (format === 'text') {
    const text = [
      `MEDICAL SUMMARY - ${new Date().toLocaleDateString()}`,
      `Doctor: ${session?.doctorName || 'N/A'}`,
      `Patient: ${session?.patientName || 'N/A'}`,
      `Template: ${summary.template}`,
      '',
      `CHIEF COMPLAINT:\n${summary.chiefComplaint}`,
      `HISTORY OF PRESENT ILLNESS:\n${summary.historyOfPresentIllness}`,
      `PAST MEDICAL HISTORY:\n${summary.pastMedicalHistory}`,
      `ASSESSMENT:\n${summary.assessment}`,
      `PLAN:\n${summary.plan}`,
      `PRESCRIPTION:\n${summary.prescription}`,
      `FOLLOW-UP:\n${summary.followUp}`,
      '',
      `ICD-10 CODES: ${summary.icdCodes?.map((c) => `${c.code} (${c.description})`).join(', ') || 'None'}`,
      `CPT CODES: ${summary.cptCodes?.map((c) => `${c.code} (${c.description})`).join(', ') || 'None'}`,
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="summary_${summary._id}.txt"`);
    return res.send(text);
  }

  return next(new AppError(`Export format '${format}' not supported. Use: json, text`, 400));
});

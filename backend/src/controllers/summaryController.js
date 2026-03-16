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

    await Session.findByIdAndUpdate(session._id, { hasSummary: true });

    // ✅ FIX: Populate session so doctor/patient names are available
    const populatedSummary = await Summary.findById(summary._id)
      .populate('sessionId', 'doctorName patientName sessionType patientId');

    emitToSession(session._id.toString(), 'summary:generated', { summary: populatedSummary });
    res.status(200).json({ status: 'success', data: { summary: populatedSummary } });
  } catch (error) {
    logger.error('Summary generation error:', error.message);
    return next(new AppError(error.message, 500));
  }
});

exports.getSummary = catchAsync(async (req, res, next) => {
  const summary = await Summary.findById(req.params.id)
    .populate('sessionId', 'doctorName patientName sessionType patientId');
  if (!summary) return next(new AppError('Summary not found.', 404));
  res.status(200).json({ status: 'success', data: { summary } });
});

// ✅ FIX: Added populate here too
exports.getSessionSummary = catchAsync(async (req, res, next) => {
  const summary = await Summary.findOne({ sessionId: req.params.sessionId })
    .populate('sessionId', 'doctorName patientName sessionType patientId');
  if (!summary) return next(new AppError('No summary found for this session.', 404));
  res.status(200).json({ status: 'success', data: { summary } });
});

exports.updateSummary = catchAsync(async (req, res, next) => {
  const summary = await Summary.findById(req.params.id);
  if (!summary) return next(new AppError('Summary not found.', 404));

  summary.versions.push({ data: summary.toObject() });
  Object.assign(summary, req.body, { isEdited: true });
  await summary.save();

  const populated = await Summary.findById(summary._id)
    .populate('sessionId', 'doctorName patientName sessionType patientId');
  res.status(200).json({ status: 'success', data: { summary: populated } });
});

exports.exportSummary = catchAsync(async (req, res, next) => {
  const summary = await Summary.findById(req.params.id)
    .populate('sessionId', 'doctorName patientName sessionType patientId');
  if (!summary) return next(new AppError('Summary not found.', 404));

  const { format = 'json' } = req.params;
  const session = summary.sessionId;

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="summary_${summary._id}.json"`);
    return res.json({
      exportedAt: new Date().toISOString(),
      session: {
        id: session?._id,
        doctorName: session?.doctorName,
        patientName: session?.patientName,
        patientId: session?.patientId,
        sessionType: session?.sessionType,
      },
      summary: {
        template: summary.template,
        chiefComplaint: summary.chiefComplaint,
        historyOfPresentIllness: summary.historyOfPresentIllness,
        pastMedicalHistory: summary.pastMedicalHistory,
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
      `CHIEF COMPLAINT:\n${summary.chiefComplaint || 'N/A'}`,
      `HISTORY OF PRESENT ILLNESS:\n${summary.historyOfPresentIllness || 'N/A'}`,
      `PAST MEDICAL HISTORY:\n${summary.pastMedicalHistory || 'N/A'}`,
      `ASSESSMENT:\n${summary.assessment || 'N/A'}`,
      `PLAN:\n${summary.plan || 'N/A'}`,
      `PRESCRIPTION:\n${summary.prescription || 'N/A'}`,
      `FOLLOW-UP:\n${summary.followUp || 'N/A'}`,
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

const path = require('path');
const fs = require('fs');
const Session = require('../models/Session');
const Transcript = require('../models/Transcript');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { transcribeAudio } = require('../services/openaiService');
const { cache } = require('../config/redis');
const { emitToSession } = require('../config/socket');
const { CACHE_TTL, TRANSCRIPT_STATUS } = require('../config/constants');
const logger = require('../config/logger');

exports.uploadAndTranscribe = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No audio file uploaded.', 400));

  const session = await Session.findById(req.params.sessionId);
  if (!session) return next(new AppError('Session not found.', 404));

  // Create transcript record immediately
  const transcript = await Transcript.create({
    sessionId: session._id,
    status: TRANSCRIPT_STATUS.PROCESSING,
    audioFile: {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    },
  });

  // Emit processing started
  emitToSession(session._id.toString(), 'transcription:started', { transcriptId: transcript._id });

  // Process transcription asynchronously
  setImmediate(async () => {
    try {
      const result = await transcribeAudio(req.file.path, req.body.language);

      transcript.text = result.text;
      transcript.language = result.language;
      transcript.segments = result.segments;
      transcript.processingTime = result.processingTime;
      transcript.status = TRANSCRIPT_STATUS.COMPLETED;
      await transcript.save();

      // Update session transcript count
      await Session.findByIdAndUpdate(session._id, { $inc: { transcriptCount: 1 } });

      await cache.set(`transcript:${transcript._id}`, transcript, CACHE_TTL.TRANSCRIPT);
      emitToSession(session._id.toString(), 'transcription:completed', { transcript });
      logger.info(`Transcription completed: ${transcript._id}`);
    } catch (error) {
      transcript.status = TRANSCRIPT_STATUS.FAILED;
      transcript.errorMessage = error.message;
      await transcript.save();
      emitToSession(session._id.toString(), 'transcription:failed', {
        transcriptId: transcript._id,
        error: error.message,
      });
      logger.error(`Transcription failed: ${transcript._id}`, error.message);
    }
  });

  res.status(202).json({
    status: 'success',
    message: 'Audio uploaded. Transcription in progress.',
    data: { transcript },
  });
});

exports.getTranscript = catchAsync(async (req, res, next) => {
  const cacheKey = `transcript:${req.params.id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', data: { transcript: cached } });

  const transcript = await Transcript.findById(req.params.id);
  if (!transcript) return next(new AppError('Transcript not found.', 404));

  if (transcript.status === TRANSCRIPT_STATUS.COMPLETED) {
    await cache.set(cacheKey, transcript, CACHE_TTL.TRANSCRIPT);
  }

  res.status(200).json({ status: 'success', data: { transcript } });
});

exports.getSessionTranscripts = catchAsync(async (req, res, next) => {
  const transcripts = await Transcript.find({ sessionId: req.params.sessionId }).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: transcripts.length, data: { transcripts } });
});

exports.updateTranscript = catchAsync(async (req, res, next) => {
  const { text, editedBy } = req.body;
  const transcript = await Transcript.findById(req.params.id);
  if (!transcript) return next(new AppError('Transcript not found.', 404));

  // Save version history
  if (transcript.text) {
    transcript.versions.push({ text: transcript.text, editedBy: editedBy || 'user' });
  }
  transcript.text = text;
  await transcript.save();

  await cache.del(`transcript:${transcript._id}`);
  res.status(200).json({ status: 'success', data: { transcript } });
});

exports.deleteTranscript = catchAsync(async (req, res, next) => {
  const transcript = await Transcript.findByIdAndDelete(req.params.id);
  if (!transcript) return next(new AppError('Transcript not found.', 404));

  // Delete audio file
  if (transcript.audioFile?.filePath && fs.existsSync(transcript.audioFile.filePath)) {
    fs.unlinkSync(transcript.audioFile.filePath);
  }

  await cache.del(`transcript:${transcript._id}`);
  await Session.findByIdAndUpdate(transcript.sessionId, { $inc: { transcriptCount: -1 } });

  res.status(204).json({ status: 'success', data: null });
});

exports.exportTranscript = catchAsync(async (req, res, next) => {
  const transcript = await Transcript.findById(req.params.id);
  if (!transcript) return next(new AppError('Transcript not found.', 404));

  const { format } = req.params;
  let content, mimeType, filename;

  if (format === 'txt') {
    content = transcript.text;
    mimeType = 'text/plain';
    filename = `transcript_${transcript._id}.txt`;
  } else if (format === 'srt') {
    // Generate SRT from segments
    content = transcript.segments.map((seg, i) => {
      const start = formatTime(seg.start);
      const end = formatTime(seg.end);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    }).join('\n');
    mimeType = 'text/plain';
    filename = `transcript_${transcript._id}.srt`;
  } else {
    return next(new AppError('Unsupported format.', 400));
  }

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(content);
});

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

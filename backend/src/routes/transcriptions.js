const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  uploadAndTranscribe, getTranscript, getSessionTranscripts,
  updateTranscript, deleteTranscript, exportTranscript,
} = require('../controllers/transcriptionController');
const { optionalAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// Session-specific transcripts
router.get('/session/:sessionId/transcriptions', optionalAuth, getSessionTranscripts);
router.post('/session/:sessionId/upload', optionalAuth, uploadLimiter, upload.single('audio'), uploadAndTranscribe);

// Single transcript operations
router.get('/:id', optionalAuth, getTranscript);
router.get('/:id/export/:format', optionalAuth, exportTranscript);
router.patch('/:id', optionalAuth, updateTranscript);
router.delete('/:id', optionalAuth, deleteTranscript);

module.exports = router;

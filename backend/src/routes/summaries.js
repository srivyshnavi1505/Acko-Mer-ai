const express = require('express');
const router = express.Router();
const {
  generateSummary, getSummary, getSessionSummary,
  updateSummary, exportSummary,
} = require('../controllers/summaryController');
const { optionalAuth } = require('../middleware/auth');

router.post('/session/:sessionId/generate', optionalAuth, generateSummary);
router.get('/session/:sessionId', optionalAuth, getSessionSummary);
router.get('/:id', optionalAuth, getSummary);
router.patch('/:id', optionalAuth, updateSummary);
router.get('/:id/export/:format', optionalAuth, exportSummary);

module.exports = router;

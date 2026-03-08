const express = require('express');
const router = express.Router();
const {
  createSession, getSessions, getSession, updateSession,
  endSession, deleteSession, getSessionStats,
} = require('../controllers/sessionController');
const { optionalAuth, protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.get('/stats', protect, getSessionStats);
router.route('/')
  .get(optionalAuth, getSessions)
  .post(optionalAuth, validate(schemas.createSession), createSession);

router.route('/:id')
  .get(optionalAuth, getSession)
  .patch(optionalAuth, validate(schemas.updateSession), updateSession)
  .delete(optionalAuth, deleteSession);

router.patch('/:id/end', optionalAuth, endSession);

module.exports = router;

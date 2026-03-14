const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createPatient, getPatients, getPatient, getPatientWithHistory,
  updatePatient, deletePatient, searchPatients, getPatientStats,
} = require('../controllers/patientController');

router.use(protect);

router.get('/search', searchPatients);
router.get('/stats', getPatientStats);
router.route('/').get(getPatients).post(createPatient);
router.get('/:id/history', getPatientWithHistory);
router.route('/:id').get(getPatient).patch(updatePatient).delete(deletePatient);

module.exports = router;

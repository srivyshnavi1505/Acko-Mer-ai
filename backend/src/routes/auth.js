const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

module.exports = router;

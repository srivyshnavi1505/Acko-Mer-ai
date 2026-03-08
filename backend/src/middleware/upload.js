const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
const { ALLOWED_AUDIO_TYPES } = require('../config/constants');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  destination: (req, file, cb) => {
    const sessionDir = path.join(uploadDir, req.params.sessionId || 'general');
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} not allowed. Upload audio files only.`, 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024 },
});

module.exports = upload;

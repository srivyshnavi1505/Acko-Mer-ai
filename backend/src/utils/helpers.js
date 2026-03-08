const { v4: uuidv4 } = require('uuid');

const generateRequestId = () => uuidv4().split('-')[0].toUpperCase();

const sanitizeText = (text) => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit), page: parseInt(page) };
};

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

module.exports = { generateRequestId, sanitizeText, paginate, formatDuration };

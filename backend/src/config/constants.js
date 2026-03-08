module.exports = {
  SESSION_STATUS: { ACTIVE: 'active', PAUSED: 'paused', COMPLETED: 'completed', ARCHIVED: 'archived' },
  SESSION_TYPES: ['consultation', 'follow-up', 'emergency', 'routine', 'specialist'],
  PRIORITY_LEVELS: ['low', 'medium', 'high', 'urgent'],
  TRANSCRIPT_STATUS: { PENDING: 'pending', PROCESSING: 'processing', COMPLETED: 'completed', FAILED: 'failed' },
  SUMMARY_TEMPLATES: ['SOAP', 'APSO', 'DAP', 'BIRP'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/x-m4a', 'video/webm'],
  CACHE_TTL: {
    SESSION: 3600, TRANSCRIPT: 21600, API_RESPONSE: 600, PERMISSIONS: 1800, CODE_LOOKUP: 86400,
  },
  ROLES: { DOCTOR: 'doctor', ADMIN: 'admin', VIEWER: 'viewer' },
};

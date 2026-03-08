const Joi = require('joi');
const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new AppError(message, 400));
  }
  next();
};

const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('doctor', 'admin', 'viewer').default('doctor'),
    specialization: Joi.string().max(100).optional(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  createSession: Joi.object({
    doctorName: Joi.string().min(2).max(100).required(),
    patientId: Joi.string().max(50).optional().allow(''),
    patientName: Joi.string().max(100).optional().allow(''),
    sessionType: Joi.string().valid('consultation', 'follow-up', 'emergency', 'routine', 'specialist').default('consultation'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    notes: Joi.string().max(5000).optional().allow(''),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
  }),
  updateSession: Joi.object({
    status: Joi.string().valid('active', 'paused', 'completed', 'archived').optional(),
    notes: Joi.string().max(5000).optional().allow(''),
    tags: Joi.array().items(Joi.string()).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  }),
};

module.exports = { validate, schemas };

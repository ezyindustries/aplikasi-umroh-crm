const Joi = require('joi');

// Validation schemas
const schemas = {
  sendMessage: Joi.object({
    conversationId: Joi.string().uuid().required(),
    toNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    content: Joi.string().max(4096).when('templateName', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required()
    }),
    messageType: Joi.string().valid('text', 'image', 'video', 'audio', 'document').default('text'),
    mediaUrl: Joi.string().uri().when('messageType', {
      is: 'text',
      then: Joi.forbidden(),
      otherwise: Joi.required()
    }),
    templateName: Joi.string(),
    templateVariables: Joi.object()
  }),

  createContact: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    name: Joi.string().max(255),
    email: Joi.string().email(),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object()
  }),

  updateContact: Joi.object({
    name: Joi.string().max(255),
    email: Joi.string().email(),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object(),
    status: Joi.string().valid('active', 'blocked', 'archived')
  }),

  createConversation: Joi.object({
    contactId: Joi.string().uuid().required(),
    sessionId: Joi.string().default('default'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
  }),

  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  })
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

// Validate query parameters
const validateQuery = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        errors
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  validate,
  validateQuery
};
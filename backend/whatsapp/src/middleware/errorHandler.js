const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = 'Validation error';
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    error = new AppError(message, 400);
    error.errors = errors;
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value';
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(error.errors && { errors: error.errors })
  });
};

// 404 handler
const notFound = (req, res, next) => {
  const message = `Route not found: ${req.originalUrl}`;
  const error = new AppError(message, 404);
  next(error);
};

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFound
};
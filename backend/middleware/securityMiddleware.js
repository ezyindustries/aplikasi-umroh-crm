const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const validator = require('validator');

// Enhanced rate limiting for different endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different operations
const rateLimits = {
  // Strict rate limiting for authentication
  auth: createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'),
  
  // Moderate rate limiting for API calls
  api: createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'),
  
  // Strict rate limiting for file uploads
  upload: createRateLimit(60 * 60 * 1000, 10, 'Too many file uploads'),
  
  // Very strict rate limiting for export operations
  export: createRateLimit(60 * 60 * 1000, 5, 'Too many export requests')
};

// Speed limiting middleware
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: 500, // add 500ms delay after 50 requests
  maxDelayMs: 20000, // max delay of 20 seconds
});

// Enhanced helmet configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize against NoSQL injection
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  
  // Additional XSS protection for string inputs
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = validator.escape(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };
  
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  next();
};

// Request size limiting middleware
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length'));
    const maxSizeBytes = typeof maxSize === 'string' 
      ? parseInt(maxSize) * 1024 * 1024 
      : maxSize;
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: maxSize
      });
    }
    
    next();
  };
};

// IP whitelist middleware for sensitive operations
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No restriction if no IPs specified
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    const xForwardedFor = req.get('X-Forwarded-For');
    const realIP = xForwardedFor ? xForwardedFor.split(',')[0].trim() : clientIP;
    
    if (!allowedIPs.includes(realIP)) {
      return res.status(403).json({
        error: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Additional security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Expect-CT': 'max-age=86400, enforce'
  });
  
  // Remove sensitive headers in production
  if (process.env.NODE_ENV === 'production') {
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
  }
  
  next();
};

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check for suspicious patterns in URLs
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /[<>]/,  // HTML tags
    /script/i, // Script injection
    /union.*select/i, // SQL injection
    /exec\s*\(/i // Code execution
  ];
  
  const fullUrl = req.originalUrl || req.url;
  
  for (let pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl)) {
      return res.status(400).json({
        error: 'Invalid request pattern detected'
      });
    }
  }
  
  // Validate user agent (basic bot detection)
  const userAgent = req.get('User-Agent') || '';
  if (userAgent.length === 0) {
    return res.status(400).json({
      error: 'User agent required'
    });
  }
  
  next();
};

// File upload security middleware
const secureFileUpload = (req, res, next) => {
  if (req.file || req.files) {
    const files = req.files || [req.file];
    
    // Allowed MIME types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    // Allowed file extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.xlsx', '.xls', '.csv'];
    
    for (let file of files) {
      if (file) {
        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: 'File type not allowed',
            allowed: allowedExtensions
          });
        }
        
        // Check file extension
        const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExt)) {
          return res.status(400).json({
            error: 'File extension not allowed',
            allowed: allowedExtensions
          });
        }
        
        // Check file size (additional to multer limits)
        const maxFileSize = process.env.MAX_FILE_SIZE || 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
          return res.status(400).json({
            error: 'File too large',
            maxSize: `${maxFileSize / 1024 / 1024}MB`
          });
        }
      }
    }
  }
  
  next();
};

module.exports = {
  rateLimits,
  speedLimiter,
  helmetConfig,
  sanitizeInput,
  requestSizeLimit,
  ipWhitelist,
  securityHeaders,
  validateRequest,
  secureFileUpload
};
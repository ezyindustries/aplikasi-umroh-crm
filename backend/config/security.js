const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Security configuration and utilities
class SecurityConfig {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.isProduction = this.environment === 'production';
  }

  // Validate and set secure environment variables
  validateEnvironment() {
    // For development/demo mode, only check JWT_SECRET
    if (!this.isProduction) {
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️  JWT_SECRET not set, using default for development');
        process.env.JWT_SECRET = 'dev-jwt-secret-key-for-demo-only';
      }
      return true;
    }

    // Production validation
    const requiredVars = [
      'JWT_SECRET',
      'DB_PASSWORD',
      'REDIS_PASSWORD'
    ];

    const missingVars = [];
    const weakVars = [];

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      
      if (!value) {
        missingVars.push(varName);
      } else {
        // Check for weak passwords/secrets
        if (this.isWeakSecret(value)) {
          weakVars.push(varName);
        }
      }
    });

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    if (weakVars.length > 0) {
      throw new Error(`Weak secrets detected in production: ${weakVars.join(', ')}`);
    }

    return true;
  }

  // Check if a secret/password is weak
  isWeakSecret(secret) {
    if (!secret || secret.length < 32) return true;
    
    // Check for common weak patterns
    const weakPatterns = [
      /^password/i,
      /^123456/,
      /^qwerty/i,
      /^admin/i,
      /^secret/i,
      /^default/i,
      /^test/i,
      /^change/i
    ];

    return weakPatterns.some(pattern => pattern.test(secret));
  }

  // Generate secure random password
  generateSecurePassword(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  // Hash sensitive data
  async hashSensitiveData(data) {
    const saltRounds = this.isProduction ? 12 : 10;
    return await bcrypt.hash(data, saltRounds);
  }

  // Verify hashed data
  async verifyHashedData(data, hash) {
    return await bcrypt.compare(data, hash);
  }

  // Encrypt sensitive data
  encrypt(text, key = null) {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      key: encryptionKey
    };
  }

  // Decrypt sensitive data
  decrypt(encryptedData, key, iv) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Generate encryption key
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Input validation rules
  getValidationRules() {
    return {
      nik: {
        pattern: /^\d{16}$/,
        message: 'NIK must be exactly 16 digits'
      },
      passport: {
        pattern: /^[A-Z0-9]{6,12}$/,
        message: 'Passport must be 6-12 alphanumeric characters'
      },
      phone: {
        pattern: /^(\+62|62|0)[0-9]{9,13}$/,
        message: 'Invalid Indonesian phone number format'
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
      },
      password: {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      }
    };
  }

  // Sanitize and validate input
  validateInput(input, type) {
    const rules = this.getValidationRules();
    const rule = rules[type];
    
    if (!rule) {
      return { isValid: false, message: 'Unknown validation type' };
    }

    if (!rule.pattern.test(input)) {
      return { isValid: false, message: rule.message };
    }

    return { isValid: true };
  }

  // Security headers configuration
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'Strict-Transport-Security': this.isProduction ? 'max-age=31536000; includeSubDomains; preload' : undefined,
      'Content-Security-Policy': this.getCSPPolicy()
    };
  }

  // Content Security Policy
  getCSPPolicy() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "child-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'"
    ].join('; ');
  }

  // CORS configuration
  getCorsConfig() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'];

    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
      ],
      maxAge: 86400 // 24 hours
    };
  }

  // Database security configuration
  getDatabaseSecurityConfig() {
    return {
      ssl: this.isProduction ? { rejectUnauthorized: false } : false,
      pool: {
        max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: this.isProduction ? false : console.log,
      benchmark: !this.isProduction
    };
  }

  // Session security configuration
  getSessionConfig() {
    return {
      secret: process.env.SESSION_SECRET || this.generateSecurePassword(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: this.isProduction, // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      },
      name: 'sessionId' // Change default session name
    };
  }

  // Audit configuration
  getAuditConfig() {
    return {
      logSensitiveData: false,
      logRetention: {
        days: parseInt(process.env.LOG_RETENTION_DAYS) || 90
      },
      alertOnSuspiciousActivity: this.isProduction,
      alertThresholds: {
        failedLogins: 5,
        largeDataExports: 1000,
        unusualAccessPatterns: true
      }
    };
  }
}

module.exports = new SecurityConfig();
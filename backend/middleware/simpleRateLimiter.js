const rateLimit = require('express-rate-limit');

// Message sending rate limiter - per user per phone number
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // 5 messages per minute per phone number
  message: 'Too many messages to this number. Please wait before sending again.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.user?.id || 'anonymous'}:${req.body.phoneNumber || req.params.phone}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'You are sending messages too quickly. Please slow down.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Global message rate limiter - system wide
const globalMessageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 messages per minute system-wide
  message: 'System is busy. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users in emergency
    return req.user?.role === 'admin' && req.headers['x-emergency'] === 'true';
  }
});

// API rate limiter - general API calls
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limiter - for login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again later.',
  skipSuccessfulRequests: true // Don't count successful logins
});

// Bulk operation limiter
const bulkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 bulk operations per hour
  message: 'Bulk operation limit reached. Please wait before performing another bulk action.',
  keyGenerator: (req) => req.user?.id || req.ip
});

// Simple in-memory storage for daily limits
const dailyLimits = new Map();
const lastReset = new Map();

// Custom middleware to track and enforce daily limits
const dailyLimitMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next();

    const today = new Date().toDateString();
    const userKey = `${userId}:${today}`;
    
    // Reset if new day
    const lastResetDate = lastReset.get(userId);
    if (lastResetDate !== today) {
      dailyLimits.delete(userKey);
      lastReset.set(userId, today);
    }
    
    // Get current count
    const currentCount = dailyLimits.get(userKey) || 0;
    
    // Check limit based on user tier
    const userTier = req.user?.tier || 'basic';
    const tierLimits = {
      basic: 100,
      premium: 500,
      enterprise: 2000
    };

    const limit = tierLimits[userTier] || tierLimits.basic;

    if (currentCount >= limit) {
      return res.status(429).json({
        success: false,
        error: 'Daily limit exceeded',
        message: `You have reached your daily limit of ${limit} messages.`,
        resetAt: new Date().setHours(24, 0, 0, 0)
      });
    }

    // Increment counter
    dailyLimits.set(userKey, currentCount + 1);

    // Add limit info to response headers
    res.setHeader('X-Daily-Limit', limit);
    res.setHeader('X-Daily-Remaining', limit - currentCount - 1);

    next();
  } catch (error) {
    console.error('Daily limit middleware error:', error);
    next(); // Continue on error
  }
};

// Spam detection middleware
const spamDetectionMiddleware = async (req, res, next) => {
  const { message, content } = req.body;
  const textToCheck = message || content || '';

  // Quick spam checks
  const spamIndicators = [
    /viagra|cialis|pharmacy/i,
    /click here now|act now|limited time/i,
    /congratulations.*won|you.*winner/i,
    /100% free|absolutely free/i,
    /bit\.ly|tinyurl|short\.link/i,
    /earn.*\$\d+.*day|make money fast/i
  ];

  for (const pattern of spamIndicators) {
    if (pattern.test(textToCheck)) {
      return res.status(400).json({
        success: false,
        error: 'Message blocked',
        message: 'Your message was blocked due to spam detection. Please revise and try again.'
      });
    }
  }

  // Simple duplicate message detection (in-memory)
  const recentMessages = req.app.locals.recentMessages = req.app.locals.recentMessages || new Map();
  
  if (req.user?.id) {
    const messageKey = `${req.user.id}:${textToCheck}`;
    const lastSent = recentMessages.get(messageKey);
    
    if (lastSent && (Date.now() - lastSent) < 300000) { // 5 minutes
      return res.status(400).json({
        success: false,
        error: 'Duplicate message',
        message: 'You recently sent an identical message. Please wait before sending again.'
      });
    }

    // Store message timestamp
    recentMessages.set(messageKey, Date.now());
    
    // Clean up old entries periodically
    if (Math.random() < 0.1) { // 10% chance to clean up
      const fiveMinutesAgo = Date.now() - 300000;
      for (const [key, timestamp] of recentMessages.entries()) {
        if (timestamp < fiveMinutesAgo) {
          recentMessages.delete(key);
        }
      }
    }
  }

  next();
};

// Business hours middleware
const businessHoursMiddleware = (req, res, next) => {
  // Skip for replies within 24-hour window
  if (req.body.isReply) return next();

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Business hours: Monday-Saturday, 8 AM - 8 PM Jakarta time
  const isBusinessHours = day !== 0 && hour >= 8 && hour < 20;

  if (!isBusinessHours && req.user?.role !== 'admin') {
    return res.status(400).json({
      success: false,
      error: 'Outside business hours',
      message: 'Messages can only be sent during business hours (Monday-Saturday, 8 AM - 8 PM).',
      businessHours: {
        days: 'Monday - Saturday',
        hours: '8:00 AM - 8:00 PM WIB'
      }
    });
  }

  next();
};

// Rate limit info endpoint
const getRateLimitInfo = async (req, res) => {
  try {
    const userId = req.user?.id;
    const today = new Date().toDateString();
    const userKey = `${userId}:${today}`;
    
    // Get various counters
    const dailyCount = dailyLimits.get(userKey) || 0;
    const userTier = req.user?.tier || 'basic';
    
    const limits = {
      daily: {
        limit: userTier === 'enterprise' ? 2000 : userTier === 'premium' ? 500 : 100,
        used: dailyCount,
        remaining: Math.max(0, (userTier === 'enterprise' ? 2000 : userTier === 'premium' ? 500 : 100) - dailyCount)
      },
      perMinute: {
        limit: 5,
        window: '1 minute'
      },
      perHour: {
        limit: 30,
        window: '1 hour'
      },
      businessHours: {
        days: 'Monday - Saturday',
        hours: '8:00 AM - 8:00 PM WIB',
        currentlyOpen: isWithinBusinessHours()
      }
    };

    res.json({
      success: true,
      limits,
      tier: userTier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get rate limit info'
    });
  }
};

function isWithinBusinessHours() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  return day !== 0 && hour >= 8 && hour < 20;
}

module.exports = {
  messageLimiter,
  globalMessageLimiter,
  apiLimiter,
  authLimiter,
  bulkLimiter,
  dailyLimitMiddleware,
  spamDetectionMiddleware,
  businessHoursMiddleware,
  getRateLimitInfo
};
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

// Create Redis client with fallback
let redisClient = null;
let useRedis = false;

try {
  redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.warn('Redis connection failed after 10 retries. Using memory store.');
          return new Error('Redis not available');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    useRedis = false;
  });

  redisClient.on('ready', () => {
    console.log('Redis connected for rate limiting');
    useRedis = true;
  });

  // Try to connect
  redisClient.connect().catch(err => {
    console.warn('Redis connection failed:', err.message);
    useRedis = false;
  });
} catch (error) {
  console.warn('Redis client creation failed:', error.message);
  useRedis = false;
}

// Message sending rate limiter - per user per phone number
const messageLimiter = rateLimit({
  store: useRedis && redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:msg:'
  }) : undefined,
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
  store: useRedis && redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:global:'
  }) : undefined,
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
  store: useRedis && redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:bulk:'
  }) : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 bulk operations per hour
  message: 'Bulk operation limit reached. Please wait before performing another bulk action.',
  keyGenerator: (req) => req.user?.id || req.ip
});

// Custom middleware to track and enforce daily limits
const dailyLimitMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next();

    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `daily:${userId}:${today}`;

    // Get current count
    const currentCount = await redisClient.get(dailyKey) || 0;
    
    // Check limit based on user tier
    const userTier = req.user?.tier || 'basic';
    const dailyLimits = {
      basic: 100,
      premium: 500,
      enterprise: 2000
    };

    const limit = dailyLimits[userTier] || dailyLimits.basic;

    if (currentCount >= limit) {
      return res.status(429).json({
        success: false,
        error: 'Daily limit exceeded',
        message: `You have reached your daily limit of ${limit} messages.`,
        resetAt: new Date(today + 'T00:00:00Z').getTime() + 24 * 60 * 60 * 1000
      });
    }

    // Increment counter
    await redisClient.incr(dailyKey);
    await redisClient.expire(dailyKey, 24 * 60 * 60); // Expire after 24 hours

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

  // Check for repeated messages
  if (req.user?.id) {
    const recentMessageKey = `recent:${req.user.id}:${Buffer.from(textToCheck).toString('base64')}`;
    const exists = await redisClient.exists(recentMessageKey);
    
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate message',
        message: 'You recently sent an identical message. Please wait before sending again.'
      });
    }

    // Store message hash for 5 minutes
    await redisClient.setex(recentMessageKey, 300, '1');
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
    const today = new Date().toISOString().split('T')[0];
    
    // Get various counters
    const dailyCount = await redisClient.get(`daily:${userId}:${today}`) || 0;
    const userTier = req.user?.tier || 'basic';
    
    const limits = {
      daily: {
        limit: userTier === 'enterprise' ? 2000 : userTier === 'premium' ? 500 : 100,
        used: parseInt(dailyCount),
        remaining: Math.max(0, (userTier === 'enterprise' ? 2000 : userTier === 'premium' ? 500 : 100) - parseInt(dailyCount))
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
  getRateLimitInfo,
  redisClient
};
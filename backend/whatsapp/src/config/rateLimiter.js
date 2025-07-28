const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const Redis = require('redis');

// Redis client for rate limiting
const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  enable_offline_queue: false
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

// WhatsApp Business API Rate Limits
const rateLimiters = {
  // Overall API rate limit
  api: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'api',
    points: 100, // requests
    duration: 60, // per minute
    blockDuration: 60 // block for 1 minute
  }),

  // WhatsApp message sending limits
  messageSending: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'msg_send',
    points: 80, // messages per second (WhatsApp limit)
    duration: 1,
    blockDuration: 10
  }),

  // Per phone number limit (prevent spam)
  perPhoneNumber: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'phone',
    points: 10, // messages
    duration: 60, // per minute
    blockDuration: 300 // block for 5 minutes
  }),

  // Business initiated conversation limit (tier-based)
  businessInitiated: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'biz_init',
    points: parseInt(process.env.BUSINESS_INITIATED_LIMIT || '1000'),
    duration: 86400, // 24 hours
    blockDuration: 3600 // block for 1 hour
  }),

  // Unique users per day limit
  uniqueUsers: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'unique_users',
    points: parseInt(process.env.UNIQUE_USERS_LIMIT || '1000'),
    duration: 86400, // 24 hours
    blockDuration: 3600
  }),

  // Template message limit
  templateMessages: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'template',
    points: 1000, // per hour
    duration: 3600,
    blockDuration: 600
  }),

  // Media upload limit
  mediaUpload: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'media',
    points: 100, // uploads
    duration: 3600, // per hour
    blockDuration: 300
  }),

  // Webhook processing limit
  webhook: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'webhook',
    points: 1000, // webhooks
    duration: 60, // per minute
    blockDuration: 60
  })
};

// Fallback to memory-based rate limiter if Redis is not available
const memoryRateLimiters = {
  api: new RateLimiterMemory({
    keyPrefix: 'api_memory',
    points: process.env.NODE_ENV === 'development' ? 1000 : 100, // More relaxed in dev
    duration: 60,
    blockDuration: 60
  }),
  
  messageSending: new RateLimiterMemory({
    keyPrefix: 'msg_send_memory',
    points: 80,
    duration: 1,
    blockDuration: 10
  }),
  
  perPhoneNumber: new RateLimiterMemory({
    keyPrefix: 'phone_memory',
    points: 10,
    duration: 60,
    blockDuration: 300
  })
};

// Rate limit middleware factory
const createRateLimitMiddleware = (limiterName) => {
  return async (req, res, next) => {
    try {
      // In development, use very relaxed limits or skip entirely
      if (process.env.NODE_ENV === 'development') {
        // Skip rate limiting in development for easier testing
        return next();
      }
      
      // Try Redis first, fall back to memory if Redis fails
      let limiter;
      try {
        await rateLimiters[limiterName].consume('test');
        limiter = rateLimiters[limiterName];
      } catch (e) {
        // Redis not available, use memory limiter
        limiter = memoryRateLimiters[limiterName];
      }
      
      const key = req.ip || req.connection.remoteAddress;
      
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60
      });
    }
  };
};

// Check if can send message (multiple limits)
const canSendMessage = async (phoneNumber, isTemplate = false) => {
  try {
    // Check overall sending limit
    await rateLimiters.messageSending.consume('global');
    
    // Check per phone number limit
    await rateLimiters.perPhoneNumber.consume(phoneNumber);
    
    // Check template limit if applicable
    if (isTemplate) {
      await rateLimiters.templateMessages.consume('global');
    }
    
    return { allowed: true };
  } catch (rejRes) {
    return {
      allowed: false,
      retryAfter: Math.round(rejRes.msBeforeNext / 1000),
      reason: rejRes.remainingPoints !== undefined ? 'rate_limit' : 'error'
    };
  }
};

// Track unique user for daily limit
const trackUniqueUser = async (phoneNumber) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const key = `unique_${date}`;
    
    // Use SET operation to ensure uniqueness
    await redisClient.sadd(key, phoneNumber);
    await redisClient.expire(key, 86400); // Expire after 24 hours
    
    // Check if limit exceeded
    const count = await redisClient.scard(key);
    const limit = parseInt(process.env.UNIQUE_USERS_LIMIT || '1000');
    
    if (count > limit) {
      throw new Error('Daily unique user limit exceeded');
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking unique user:', error);
    return false;
  }
};

// Get current usage stats
const getUsageStats = async () => {
  const stats = {};
  
  for (const [name, limiter] of Object.entries(rateLimiters)) {
    try {
      const res = await limiter.get('global');
      stats[name] = {
        consumed: res ? res.consumedPoints : 0,
        remaining: res ? res.remainingPoints : limiter.points,
        resetAt: res ? new Date(Date.now() + res.msBeforeNext) : null
      };
    } catch (error) {
      stats[name] = { error: error.message };
    }
  }
  
  return stats;
};

module.exports = {
  rateLimiters,
  memoryRateLimiters,
  createRateLimitMiddleware,
  canSendMessage,
  trackUniqueUser,
  getUsageStats
};
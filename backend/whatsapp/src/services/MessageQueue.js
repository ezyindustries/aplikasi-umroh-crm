// Use SimpleMessageQueue for development (no Redis required)
// For production, uncomment the Bull/Redis version below
module.exports = require('./SimpleMessageQueue');

/* Production version with Redis:
const Bull = require('bull');
const { Message, ConversationSession, Contact } = require('../models');
// Use RealWAHAService for exact WAHA API compatibility
const whatsappService = require('./RealWAHAService');
const logger = require('../utils/logger');

class MessageQueueService {
  constructor() {
    this.queues = {
      outgoing: new Bull('outgoing-messages', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        }
      }),
      incoming: new Bull('incoming-messages', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        }
      }),
      status: new Bull('message-status', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        }
      })
    };

    this.initializeProcessors();
  }

  // ... rest of the implementation ...
}

module.exports = new MessageQueueService();
*/
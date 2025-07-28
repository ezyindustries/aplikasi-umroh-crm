const EventEmitter = require('events');
const db = require('../models');

class MessageQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.messagesSentToday = new Map();
    this.lastMessageTime = new Map();
    
    // Configuration
    this.config = {
      minDelayBetweenMessages: 2000, // 2 seconds
      maxMessagesPerMinute: 10,
      maxNewConversationsPerDay: 15,
      maxMessagesPerHour: 30,
      businessHoursStart: 8,
      businessHoursEnd: 20
    };

    // Start processing
    this.startProcessing();
    
    // Reset daily counters at midnight
    this.scheduleDailyReset();
  }

  // Add message to queue
  async add(phoneNumber, message, options = {}) {
    try {
      // Validate before adding to queue
      await this.validateMessage(phoneNumber, message);
      
      const queueItem = {
        id: Date.now() + Math.random(),
        phoneNumber,
        message,
        priority: options.priority || 'normal',
        retries: 0,
        maxRetries: options.maxRetries || 3,
        addedAt: new Date(),
        options
      };

      // Add to queue based on priority
      if (options.priority === 'high') {
        this.queue.unshift(queueItem);
      } else {
        this.queue.push(queueItem);
      }

      this.emit('message:queued', queueItem);
      
      // Start processing if not already
      if (!this.processing) {
        this.process();
      }

      return { success: true, queueId: queueItem.id, position: this.queue.length };
    } catch (error) {
      this.emit('message:rejected', { phoneNumber, message, error: error.message });
      throw error;
    }
  }

  // Add media message to queue
  async addMedia(phoneNumber, mediaData, options = {}) {
    try {
      // Validate before adding to queue (skip spam check for media)
      const hasConsent = await this.checkConsent(phoneNumber);
      if (!hasConsent) {
        throw new Error('No active consent for this number');
      }

      if (!this.isBusinessHours() && !this.isReplyMessage(phoneNumber)) {
        throw new Error('Messages can only be sent during business hours (8 AM - 8 PM)');
      }

      const queueItem = {
        id: Date.now() + Math.random(),
        phoneNumber,
        message: mediaData.caption || mediaData.fileName,
        mediaData: mediaData, // Contains filePath, fileName, mimeType, caption
        isMedia: true,
        priority: options.priority || 'normal',
        retries: 0,
        maxRetries: options.maxRetries || 3,
        addedAt: new Date(),
        options
      };

      // Add to queue based on priority
      if (options.priority === 'high') {
        this.queue.unshift(queueItem);
      } else {
        this.queue.push(queueItem);
      }

      this.emit('message:queued', queueItem);
      
      // Start processing if not already
      if (!this.processing) {
        this.process();
      }

      return { success: true, queueId: queueItem.id, position: this.queue.length };
    } catch (error) {
      this.emit('message:rejected', { phoneNumber, mediaData, error: error.message });
      throw error;
    }
  }

  // Validate message before queuing
  async validateMessage(phoneNumber, message) {
    // Check business hours
    if (!this.isBusinessHours() && !this.isReplyMessage(phoneNumber)) {
      throw new Error('Messages can only be sent during business hours (8 AM - 8 PM)');
    }

    // Check rate limits
    const rateLimitCheck = await this.checkRateLimits(phoneNumber);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.reason);
    }

    // Check spam
    if (await this.isSpam(message)) {
      throw new Error('Message blocked: Potential spam detected');
    }

    // Check consent
    const hasConsent = await this.checkConsent(phoneNumber);
    if (!hasConsent) {
      throw new Error('No active consent for this number');
    }

    return true;
  }

  // Check various rate limits
  async checkRateLimits(phoneNumber) {
    const now = new Date();
    const today = now.toDateString();
    const hour = now.getHours();
    
    // Check daily limit for new conversations
    const dailyKey = `${phoneNumber}-${today}`;
    const dailyCount = this.messagesSentToday.get(dailyKey) || 0;
    
    const isNewConversation = await this.isNewConversation(phoneNumber);
    if (isNewConversation && dailyCount >= this.config.maxNewConversationsPerDay) {
      return { 
        allowed: false, 
        reason: `Daily limit reached for new conversations (${this.config.maxNewConversationsPerDay}/day)` 
      };
    }

    // Check minimum delay between messages
    const lastTime = this.lastMessageTime.get(phoneNumber);
    if (lastTime) {
      const timeSinceLastMessage = now - lastTime;
      if (timeSinceLastMessage < this.config.minDelayBetweenMessages) {
        return { 
          allowed: false, 
          reason: `Please wait ${Math.ceil((this.config.minDelayBetweenMessages - timeSinceLastMessage) / 1000)} seconds before sending another message` 
        };
      }
    }

    // Check hourly limit
    const hourlyMessages = await this.getHourlyMessageCount();
    if (hourlyMessages >= this.config.maxMessagesPerHour) {
      return { 
        allowed: false, 
        reason: `Hourly limit reached (${this.config.maxMessagesPerHour}/hour)` 
      };
    }

    return { allowed: true };
  }

  // Process queue
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        // Enforce minimum delay
        await this.enforceDelay(item.phoneNumber);
        
        // Send message
        await this.sendMessage(item);
        
        // Track successful send
        this.trackMessage(item.phoneNumber);
        
        this.emit('message:sent', item);
        
        // Log to database
        await this.logMessage(item, 'sent');
        
      } catch (error) {
        console.error('Failed to send message:', error);
        
        // Retry logic
        if (item.retries < item.maxRetries) {
          item.retries++;
          this.queue.push(item); // Add back to queue
          this.emit('message:retry', item);
        } else {
          this.emit('message:failed', { item, error: error.message });
          await this.logMessage(item, 'failed', error.message);
        }
      }
    }
    
    this.processing = false;
  }

  // Enforce delay between messages
  async enforceDelay(phoneNumber) {
    const now = Date.now();
    const lastTime = this.lastMessageTime.get(phoneNumber);
    
    if (lastTime) {
      const timeSinceLastMessage = now - lastTime;
      const requiredDelay = this.config.minDelayBetweenMessages;
      
      if (timeSinceLastMessage < requiredDelay) {
        const waitTime = requiredDelay - timeSinceLastMessage;
        await this.delay(waitTime);
      }
    }
  }

  // Send message via WhatsApp service
  async sendMessage(item) {
    const whatsappBot = require('./whatsappBot');
    
    // Check if it's a media message
    if (item.isMedia && item.mediaData) {
      const result = await whatsappBot.sendMedia(
        item.phoneNumber, 
        item.mediaData.filePath,
        item.mediaData.mimeType,
        item.mediaData.caption,
        item.mediaData.fileName
      );
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to send media');
      }
      
      return result;
    } else {
      // Regular text message
      const result = await whatsappBot.sendMessage(item.phoneNumber, item.message);
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to send message');
      }
      
      return result;
    }
  }

  // Track message for rate limiting
  trackMessage(phoneNumber) {
    const now = new Date();
    const today = now.toDateString();
    const dailyKey = `${phoneNumber}-${today}`;
    
    // Update daily count
    const currentCount = this.messagesSentToday.get(dailyKey) || 0;
    this.messagesSentToday.set(dailyKey, currentCount + 1);
    
    // Update last message time
    this.lastMessageTime.set(phoneNumber, now);
  }

  // Check if within business hours
  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Monday to Saturday, 8 AM - 8 PM
    if (day === 0) return false; // Sunday
    return hour >= this.config.businessHoursStart && hour < this.config.businessHoursEnd;
  }

  // Check if this is a reply to customer message (24-hour window)
  async isReplyMessage(phoneNumber) {
    try {
      const lastCustomerMessage = await db.WaMessage.findOne({
        where: {
          phone_number: phoneNumber,
          direction: 'inbound',
          created_at: {
            [db.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
          }
        },
        order: [['created_at', 'DESC']]
      });
      
      return !!lastCustomerMessage;
    } catch (error) {
      console.error('Error checking reply message:', error);
      return false;
    }
  }

  // Check if new conversation
  async isNewConversation(phoneNumber) {
    try {
      const existingConversation = await db.WaConversation.findOne({
        where: {
          phone_number: phoneNumber,
          created_at: {
            [db.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }
      });
      
      return !existingConversation;
    } catch (error) {
      console.error('Error checking conversation:', error);
      return true; // Assume new to be safe
    }
  }

  // Check for spam patterns
  async isSpam(message) {
    const spamPatterns = [
      /viagra|cialis|pharmacy/i,
      /click here now|limited time/i,
      /congratulations.*won|winner/i,
      /100% free|act now/i,
      /bit\.ly|tinyurl|short\.link/i,
      /\${3,}/i, // Multiple dollar signs
      /(.)\1{10,}/i // Repeated characters
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(message)) {
        return true;
      }
    }

    // Check for excessive caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.8 && message.length > 10) {
      return true;
    }

    // Check for excessive emojis
    const emojiCount = (message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 10) {
      return true;
    }

    return false;
  }

  // Check consent
  async checkConsent(phoneNumber) {
    try {
      // For now, check if lead exists and is not opted out
      const lead = await db.Lead.findOne({
        where: {
          phone: phoneNumber,
          status: { [db.Op.ne]: 'opted_out' }
        }
      });
      
      return !!lead;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  // Get hourly message count
  async getHourlyMessageCount() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    try {
      const count = await db.WaMessage.count({
        where: {
          direction: 'outbound',
          created_at: { [db.Op.gte]: oneHourAgo }
        }
      });
      
      return count;
    } catch (error) {
      console.error('Error getting hourly count:', error);
      return 0;
    }
  }

  // Log message to database
  async logMessage(item, status, error = null) {
    try {
      await db.MessageLog.create({
        phone_number: item.phoneNumber,
        message_content: item.message,
        status,
        error_message: error,
        queue_id: item.id,
        attempts: item.retries + 1,
        sent_at: status === 'sent' ? new Date() : null
      });
    } catch (err) {
      console.error('Error logging message:', err);
    }
  }

  // Helper delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Start continuous processing
  startProcessing() {
    setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.process();
      }
    }, 1000);
  }

  // Reset daily counters
  scheduleDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
      this.messagesSentToday.clear();
      this.emit('daily:reset');
      this.scheduleDailyReset(); // Schedule next reset
    }, msUntilMidnight);
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      messagesSetToday: Array.from(this.messagesSentToday.entries()).reduce((sum, [, count]) => sum + count, 0),
      config: this.config
    };
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('config:updated', this.config);
  }
}

// Export singleton instance
module.exports = new MessageQueue();
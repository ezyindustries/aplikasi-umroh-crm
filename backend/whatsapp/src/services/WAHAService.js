const axios = require('axios');
const EventEmitter = require('events');
const { WhatsAppSession } = require('../models');

class WAHAService extends EventEmitter {
  constructor() {
    super();
    this.baseURL = process.env.WAHA_BASE_URL || 'http://localhost:3000';
    this.apiKey = process.env.WAHA_API_KEY || '';
    
    // Rate limiting configuration
    this.rateLimitDelay = parseInt(process.env.WAHA_RATE_LIMIT_DELAY_MS) || 1000; // Default 1 second between requests
    this.lastRequestTime = 0;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 30000
    });

    // Add response interceptor for rate limit handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response && error.response.status === 429) {
          // Rate limit exceeded
          const retryAfter = error.response.headers['retry-after'] || 5;
          console.log(`Rate limit exceeded. Retrying after ${retryAfter} seconds...`);
          
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  // Add rate limit wrapper
  async rateLimitedRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.rateLimitDelay) {
        await new Promise(resolve => 
          setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
        );
      }

      const { requestFn, resolve, reject } = this.requestQueue.shift();
      
      try {
        this.lastRequestTime = Date.now();
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  // Session Management
  async startSession(sessionName = 'default') {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/start`);
      
      // Update session in database
      await WhatsAppSession.upsert({
        sessionName,
        status: 'connecting',
        lastHealthCheck: new Date()
      });

      return response.data;
    } catch (error) {
      console.error('Error starting session:', error.message);
      throw error;
    }
  }

  async stopSession(sessionName = 'default') {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/stop`);
      
      // Update session status
      await WhatsAppSession.update(
        { 
          status: 'disconnected',
          disconnectedAt: new Date()
        },
        { where: { sessionName } }
      );

      return response.data;
    } catch (error) {
      console.error('Error stopping session:', error.message);
      throw error;
    }
  }

  async getSessionStatus(sessionName = 'default') {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/status`);
      const data = response.data;

      // Update session in database
      const updateData = {
        status: data.status,
        lastHealthCheck: new Date()
      };

      if (data.qr) {
        updateData.qrCode = data.qr;
        updateData.qrCodeExpiresAt = new Date(Date.now() + 60000); // 60 seconds
      }

      if (data.phoneNumber) {
        updateData.phoneNumber = data.phoneNumber;
      }

      if (data.status === 'connected') {
        updateData.connectedAt = updateData.connectedAt || new Date();
      }

      await WhatsAppSession.upsert({
        sessionName,
        ...updateData
      });

      return data;
    } catch (error) {
      console.error('Error getting session status:', error.message);
      return { status: 'disconnected' };
    }
  }

  async getQRCode(sessionName = 'default') {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/qr`);
      return response.data;
    } catch (error) {
      console.error('Error getting QR code:', error.message);
      throw error;
    }
  }

  // Messaging
  async sendTextMessage(sessionName, phoneNumber, text) {
    return this.rateLimitedRequest(async () => {
      try {
        const response = await this.client.post(`/api/sessions/${sessionName}/messages/text`, {
          to: this.formatPhoneNumber(phoneNumber),
          text
        });

        return response.data;
      } catch (error) {
        console.error('Error sending text message:', error.message);
        throw error;
      }
    });
  }

  async sendMediaMessage(sessionName, phoneNumber, mediaUrl, caption = '') {
    return this.rateLimitedRequest(async () => {
      try {
        const response = await this.client.post(`/api/sessions/${sessionName}/messages/media`, {
          to: this.formatPhoneNumber(phoneNumber),
          mediaUrl,
          caption
        });

        return response.data;
      } catch (error) {
        console.error('Error sending media message:', error.message);
        throw error;
      }
    });
  }

  async sendTemplateMessage(sessionName, phoneNumber, template) {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/messages/template`, {
        to: this.formatPhoneNumber(phoneNumber),
        template
      });

      return response.data;
    } catch (error) {
      console.error('Error sending template message:', error.message);
      throw error;
    }
  }

  // Contact Management
  async getContacts(sessionName = 'default') {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/contacts`);
      return response.data;
    } catch (error) {
      console.error('Error getting contacts:', error.message);
      return [];
    }
  }

  async checkNumberExists(sessionName, phoneNumber) {
    try {
      const response = await this.client.get(
        `/api/sessions/${sessionName}/contacts/check/${this.formatPhoneNumber(phoneNumber)}`
      );
      return response.data.exists;
    } catch (error) {
      console.error('Error checking number:', error.message);
      return false;
    }
  }

  // Groups
  async getGroups(sessionName = 'default') {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/groups`);
      return response.data;
    } catch (error) {
      console.error('Error getting groups:', error.message);
      return [];
    }
  }

  // Media
  async downloadMedia(sessionName, mediaId) {
    try {
      const response = await this.client.get(
        `/api/sessions/${sessionName}/media/${mediaId}`,
        { responseType: 'arraybuffer' }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading media:', error.message);
      throw error;
    }
  }

  // Webhook Management
  async setWebhook(sessionName, webhookUrl) {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/webhook`, {
        url: webhookUrl
      });

      // Update webhook URL in database
      await WhatsAppSession.update(
        { webhookUrl },
        { where: { sessionName } }
      );

      return response.data;
    } catch (error) {
      console.error('Error setting webhook:', error.message);
      throw error;
    }
  }

  // Utility Methods
  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('62') && cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    
    // Add @c.us suffix for WhatsApp
    return cleaned.includes('@') ? cleaned : `${cleaned}@c.us`;
  }

  parsePhoneNumber(whatsappId) {
    // Remove @c.us or @g.us suffix
    return whatsappId.replace(/@[cg]\.us$/, '');
  }

  // Health Check
  async healthCheck() {
    try {
      const sessions = await WhatsAppSession.findAll({
        where: { status: 'connected' }
      });

      for (const session of sessions) {
        await this.getSessionStatus(session.sessionName);
      }

      return true;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }

  // Load existing chats from WhatsApp
  async loadExistingChats(sessionName = 'default') {
    try {
      const logger = require('../utils/logger');
      logger.info('Loading existing chats from WhatsApp...');
      
      // Try different WAHA endpoints
      let chats = [];
      
      // Try method 1: Get contacts
      try {
        const contactsResponse = await this.client.get(`/api/contacts`);
        const contacts = contactsResponse.data || [];
        logger.info(`Found ${contacts.length} contacts`);
        
        // For each contact, create a chat entry
        for (const contact of contacts) {
          if (contact.isMyContact || contact.isUser) {
            chats.push({
              id: contact.id || contact.number,
              name: contact.name || contact.pushname,
              number: contact.number || contact.id
            });
          }
        }
      } catch (error) {
        logger.warn('Could not get contacts:', error.message);
      }
      
      // Try method 2: Get recent chats (if available)
      if (chats.length === 0) {
        try {
          const chatsResponse = await this.client.get(`/api/${sessionName}/chats`);
          chats = chatsResponse.data || [];
          logger.info(`Found ${chats.length} chats from chats endpoint`);
        } catch (error) {
          logger.warn('Could not get chats:', error.message);
        }
      }
      
      // If still no chats, create some test data from known conversations
      if (chats.length === 0) {
        logger.info('No chats found via API, will wait for incoming messages');
        return { count: 0, chats: 0 };
      }
      
      let processedCount = 0;
      const messageQueue = require('./MessageQueue');
      
      // Process each chat (limit to 50 for testing)
      const chatsToProcess = chats.slice(0, 50);
      logger.info(`Processing ${chatsToProcess.length} chats...`);
      
      for (const chat of chatsToProcess) {
        try {
          const chatId = chat.id || chat.number;
          
          // Try to get last few messages for this chat
          try {
            const messagesResponse = await this.client.get(
              `/api/${sessionName}/chats/${chatId}/messages?limit=10`
            );
            const messages = messagesResponse.data || [];
            
            // Process messages oldest first
            messages.reverse();
            
            for (const message of messages) {
              // Format message for our system
              const formattedMessage = {
                id: message.id?._serialized || message.id || `${chatId}_${Date.now()}`,
                from: message.fromMe ? sessionName : chatId,
                to: message.fromMe ? chatId : sessionName,
                type: message.type || 'chat',
                text: message.body || message.caption || '',
                timestamp: message.timestamp ? message.timestamp * 1000 : Date.now(),
                isForwarded: message.isForwarded || false,
                quotedMessageId: message.quotedMsgId,
                mediaId: message.mediaKey
              };
              
              // Process through message queue
              await messageQueue.processIncomingMessage({
                sessionId: sessionName,
                message: formattedMessage
              });
              
              processedCount++;
            }
          } catch (msgError) {
            logger.debug(`Could not get messages for chat ${chatId}:`, msgError.message);
          }
          
          // Add delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          logger.error(`Error processing chat ${chat.id}:`, error);
        }
      }
      
      logger.info(`Successfully processed ${processedCount} messages from ${chatsToProcess.length} chats`);
      
      // Emit event for frontend
      this.emit('chats:loaded', {
        sessionId: sessionName,
        count: processedCount,
        message: `Loaded ${processedCount} messages from ${chatsToProcess.length} chats`
      });
      
      return { count: processedCount, chats: chatsToProcess.length };
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error('Error loading existing chats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const wahaService = new WAHAService();

// Start health check interval
setInterval(() => {
  wahaService.healthCheck();
}, 10000); // Every 10 seconds

module.exports = wahaService;
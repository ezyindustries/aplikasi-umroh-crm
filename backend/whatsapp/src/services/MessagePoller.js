const axios = require('axios');
const logger = require('../utils/logger');
const SimpleMessageQueue = require('./SimpleMessageQueue');

class MessagePoller {
  constructor() {
    this.polling = false;
    this.lastMessageId = null;
    this.pollInterval = 5000; // 5 seconds
    this.messageQueue = new SimpleMessageQueue();
  }

  async startPolling(sessionName = 'default') {
    if (this.polling) {
      logger.info('Message polling already started');
      return;
    }

    this.polling = true;
    logger.info('Starting message polling for session:', sessionName);

    // Initial poll
    await this.pollMessages(sessionName);

    // Set up interval
    this.pollTimer = setInterval(async () => {
      if (this.polling) {
        await this.pollMessages(sessionName);
      }
    }, this.pollInterval);
  }

  async pollMessages(sessionName) {
    try {
      // Try to fetch recent chats
      const response = await axios.get(`http://localhost:3000/api/${sessionName}/chats`, {
        params: {
          limit: 10
        }
      });

      if (response.data && Array.isArray(response.data)) {
        for (const chat of response.data) {
          if (chat.lastMessage && chat.lastMessage.id !== this.lastMessageId) {
            // Check if this is a new message
            const message = chat.lastMessage;
            
            // Skip if it's our own message
            if (!message.fromMe) {
              logger.info('New message detected via polling:', {
                id: message.id,
                from: message.from,
                body: message.body
              });

              // Process as webhook event
              const webhookEvent = {
                event: 'message',
                session: sessionName,
                payload: {
                  id: message.id,
                  from: message.from || chat.id,
                  to: message.to || sessionName,
                  body: message.body,
                  type: message.type || 'text',
                  timestamp: message.timestamp,
                  fromMe: false
                }
              };

              // Process through message queue
              await this.messageQueue.processIncomingMessage({
                sessionId: sessionName,
                message: webhookEvent.payload
              });

              this.lastMessageId = message.id;
            }
          }
        }
      }
    } catch (error) {
      // Silently fail - endpoint might not exist
      if (error.response?.status !== 404) {
        logger.debug('Polling error:', error.message);
      }
    }
  }

  stopPolling() {
    this.polling = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    logger.info('Message polling stopped');
  }
}

module.exports = MessagePoller;
const axios = require('axios');
const logger = require('../utils/logger');
const messageQueue = require('./SimpleMessageQueue');

class MessagePoller {
  constructor() {
    this.polling = false;
    this.lastMessageId = null;
    this.pollInterval = 5000; // 5 seconds
    this.messageQueue = messageQueue;
    this.processedMessages = new Set(); // Track processed message IDs
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
          limit: 20
        }
      });

      if (response.data && Array.isArray(response.data)) {
        // Process personal chats only (not groups)
        const personalChats = response.data.filter(chat => 
          chat.id._serialized && chat.id._serialized.includes('@c.us')
        );
        
        for (const chat of personalChats) {
          if (!chat.lastMessage) continue;
          
          const chatId = chat.id._serialized;
          
          // Fetch recent messages for this chat
          try {
            const messagesRes = await axios.get(
              `http://localhost:3000/api/${sessionName}/chats/${chatId}/messages`,
              { params: { limit: 10 } }
            );
            
            if (messagesRes.data && Array.isArray(messagesRes.data)) {
              for (const message of messagesRes.data) {
                // Check if message is new and not from us
                const messageId = message.id?.id || message.id;
                
                if (!message.fromMe && !this.processedMessages.has(messageId)) {
                  logger.info('New incoming message detected via polling:', {
                    id: messageId,
                    from: message.from,
                    body: message.body,
                    timestamp: new Date(message.timestamp * 1000).toLocaleString()
                  });

                  // Mark as processed
                  this.processedMessages.add(messageId);

                  // Process as webhook event
                  const webhookEvent = {
                    event: 'message',
                    session: sessionName,
                    payload: {
                      id: messageId,
                      from: message.from,
                      to: message.to || '628113032232@c.us', // Our number
                      body: message.body || '',
                      type: message.type || 'chat',
                      timestamp: message.timestamp,
                      fromMe: false
                    }
                  };

                  // Process through message queue
                  await this.messageQueue.processIncomingMessage({
                    sessionId: sessionName,
                    message: webhookEvent.payload
                  });
                }
              }
            }
          } catch (err) {
            // Ignore errors for specific chats
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
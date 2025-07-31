const axios = require('axios');
const logger = require('../utils/logger');
const messageQueue = require('./SimpleMessageQueue');

class MessagePoller {
  constructor() {
    this.polling = false;
    this.lastMessageId = null;
    this.pollInterval = 5000; // 5 seconds
    this.messageQueue = messageQueue; // Use the imported instance directly
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
        // Process all chats (both personal and groups)
        const allChats = response.data.filter(chat => 
          chat.id._serialized && (chat.id._serialized.includes('@c.us') || chat.id._serialized.includes('@g.us'))
        );
        
        for (const chat of allChats) {
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
                    type: message.type,
                    hasMedia: !!message.media,
                    mediaInfo: message.media ? {
                      id: message.media.id,
                      mimetype: message.media.mimetype,
                      filename: message.media.filename
                    } : null,
                    timestamp: new Date(message.timestamp * 1000).toLocaleString()
                  });

                  // Mark as processed
                  this.processedMessages.add(messageId);

                  // Check if this is a media message from WAHA
                  let mediaData = undefined;
                  if (message._data && message._data.type === 'image' && message._data.body) {
                    // WAHA returns image data in body as base64
                    mediaData = {
                      id: messageId,
                      mimetype: message._data.mimetype || 'image/jpeg',
                      filename: message._data.filename || 'image.jpg',
                      filesize: message._data.size,
                      base64: message._data.body,
                      directPath: message._data.directPath,
                      url: message._data.deprecatedMms3Url
                    };
                  } else if (message.media) {
                    mediaData = {
                      id: message.media.id || messageId,
                      mimetype: message.media.mimetype || message.mimetype,
                      filename: message.media.filename || message.filename,
                      filesize: message.media.filesize || message.size,
                      url: message.media.url
                    };
                  }
                  
                  // Check if this is a group message
                  const isGroupMessage = chatId.includes('@g.us');
                  
                  // Process as webhook event
                  const webhookEvent = {
                    event: 'message',
                    session: sessionName,
                    payload: {
                      id: messageId,
                      from: message.from,
                      to: message.to || (isGroupMessage ? chatId : '628113032232@c.us'),
                      body: message._data && message._data.type === 'image' ? '' : (message.body || ''),
                      type: message._data?.type || message.type || 'chat',
                      timestamp: message.timestamp,
                      fromMe: false,
                      media: mediaData,
                      // Add group information if it's a group message
                      chatId: isGroupMessage ? chatId : undefined,
                      author: isGroupMessage ? message.author : undefined,
                      isGroupMsg: isGroupMessage
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
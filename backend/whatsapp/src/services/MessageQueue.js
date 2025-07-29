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

  initializeProcessors() {
    // Process outgoing messages
    this.queues.outgoing.process(async (job) => {
      const { messageId } = job.data;
      return await this.processOutgoingMessage(messageId);
    });

    // Process incoming messages
    this.queues.incoming.process(async (job) => {
      const { webhookData } = job.data;
      return await this.processIncomingMessage(webhookData);
    });

    // Process status updates
    this.queues.status.process(async (job) => {
      const { messageId, status, timestamp } = job.data;
      return await this.updateMessageStatus(messageId, status, timestamp);
    });

    // Error handling
    Object.values(this.queues).forEach(queue => {
      queue.on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed:`, err);
      });

      queue.on('completed', (job) => {
        logger.info(`Job ${job.id} completed`);
      });
    });
  }

  // Add message to outgoing queue
  async queueOutgoingMessage(messageData) {
    try {
      // Save message to database first
      const message = await Message.create({
        ...messageData,
        status: 'pending',
        direction: 'outbound'
      });

      // Add to queue with retry options
      const job = await this.queues.outgoing.add(
        { messageId: message.id },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: true,
          removeOnFail: false
        }
      );

      return { messageId: message.id, jobId: job.id };
    } catch (error) {
      logger.error('Error queuing message:', error);
      throw error;
    }
  }

  // Process outgoing message
  async processOutgoingMessage(messageId) {
    const message = await Message.findByPk(messageId, {
      include: ['conversation']
    });

    if (!message) {
      throw new Error('Message not found');
    }

    try {
      // Check if within 24-hour window
      const session = await ConversationSession.findOne({
        where: { conversationId: message.conversationId },
        order: [['createdAt', 'DESC']]
      });

      let response;
      const sessionName = message.conversation.sessionId || 'default';

      if (session && session.canSendFreeFormMessage()) {
        // Send regular message
        if (message.messageType === 'text') {
          response = await whatsappService.sendTextMessage(
            sessionName,
            message.toNumber,
            message.content
          );
        } else {
          response = await whatsappService.sendMediaMessage(
            sessionName,
            message.toNumber,
            message.mediaUrl,
            message.content
          );
        }
      } else {
        // Outside 24-hour window - need to use template
        if (!message.templateName) {
          throw new Error('Template required for messages outside 24-hour window');
        }

        response = await whatsappService.sendTemplateMessage(
          sessionName,
          message.toNumber,
          {
            name: message.templateName,
            language: { code: 'id' },
            components: message.templateVariables
          }
        );
      }

      // Update message status
      await message.update({
        status: 'sent',
        sentAt: new Date(),
        whatsappMessageId: response.messageId,
        metadata: { ...message.metadata, response }
      });

      // Update conversation session
      if (session) {
        await session.increment('messagesSentCount');
      }

      return { success: true, messageId: response.messageId };
    } catch (error) {
      // Update message with error
      await message.update({
        status: 'failed',
        errorMessage: error.message
      });

      throw error;
    }
  }

  // Process incoming message from webhook
  async processIncomingMessage(webhookData) {
    try {
      const { message: whatsappMessage, contact } = webhookData;
      
      // Find or create contact
      let dbContact = await Contact.findOne({
        where: { phoneNumber: whatsappService.parsePhoneNumber(whatsappMessage.from) }
      });

      if (!dbContact) {
        dbContact = await Contact.create({
          phoneNumber: whatsappService.parsePhoneNumber(whatsappMessage.from),
          name: contact.name || contact.pushName,
          profilePicture: contact.profilePicture,
          source: 'whatsapp'
        });
      }

      // Find or create conversation
      let conversation = await dbContact.getConversations({
        where: { status: 'active' },
        order: [['updatedAt', 'DESC']],
        limit: 1
      });

      if (!conversation || conversation.length === 0) {
        conversation = await dbContact.createConversation({
          sessionId: webhookData.sessionId || 'default',
          status: 'active'
        });
      } else {
        conversation = conversation[0];
      }

      // Save message
      const message = await Message.create({
        conversationId: conversation.id,
        whatsappMessageId: whatsappMessage.id,
        fromNumber: whatsappService.parsePhoneNumber(whatsappMessage.from),
        toNumber: whatsappService.parsePhoneNumber(whatsappMessage.to),
        messageType: whatsappMessage.type || 'text',
        content: whatsappMessage.text || whatsappMessage.caption,
        mediaId: whatsappMessage.mediaId,
        status: 'received',
        direction: 'inbound',
        isForwarded: whatsappMessage.isForwarded || false,
        quotedMessageId: whatsappMessage.quotedMessageId,
        metadata: whatsappMessage
      });

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: message.content ? 
          message.content.substring(0, 100) : 
          `[${message.messageType}]`,
        unreadCount: conversation.unreadCount + 1
      });

      // Update or create conversation session
      let convSession = await ConversationSession.findOne({
        where: { 
          conversationId: conversation.id,
          phoneNumber: dbContact.phoneNumber
        },
        order: [['createdAt', 'DESC']]
      });

      if (!convSession || !convSession.canSendFreeFormMessage()) {
        // Create new session
        await ConversationSession.create({
          conversationId: conversation.id,
          phoneNumber: dbContact.phoneNumber,
          lastCustomerMessageAt: new Date(),
          initiatedBy: 'customer'
        });
      } else {
        // Extend existing session
        await convSession.extendSession();
      }

      // Update contact last seen
      await dbContact.update({ lastSeen: new Date() });

      return { success: true, messageId: message.id };
    } catch (error) {
      logger.error('Error processing incoming message:', error);
      throw error;
    }
  }

  // Update message status
  async updateMessageStatus(whatsappMessageId, status, timestamp) {
    try {
      const message = await Message.findOne({
        where: { whatsappMessageId }
      });

      if (!message) {
        logger.warn(`Message not found for ID: ${whatsappMessageId}`);
        return;
      }

      const updateData = { status };

      switch (status) {
        case 'delivered':
          updateData.deliveredAt = new Date(timestamp);
          break;
        case 'read':
          updateData.readAt = new Date(timestamp);
          break;
        case 'failed':
          updateData.errorMessage = 'Message delivery failed';
          break;
      }

      await message.update(updateData);

      return { success: true };
    } catch (error) {
      logger.error('Error updating message status:', error);
      throw error;
    }
  }

  // Queue status update
  async queueStatusUpdate(messageId, status, timestamp) {
    await this.queues.status.add(
      { messageId, status, timestamp },
      { removeOnComplete: true }
    );
  }

  // Queue incoming message
  async queueIncomingMessage(webhookData) {
    await this.queues.incoming.add(
      { webhookData },
      { 
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 1000
        }
      }
    );
  }

  // Get queue statistics
  async getQueueStats() {
    const stats = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      const counts = await queue.getJobCounts();
      stats[name] = counts;
    }

    return stats;
  }

  // Clean old completed jobs
  async cleanQueues(gracePeriod = 24 * 60 * 60 * 1000) {
    for (const queue of Object.values(this.queues)) {
      await queue.clean(gracePeriod, 'completed');
      await queue.clean(gracePeriod * 7, 'failed'); // Keep failed jobs longer
    }
  }
}

// Create singleton instance
const messageQueue = new MessageQueueService();

// Clean queues periodically
setInterval(() => {
  messageQueue.cleanQueues();
}, 60 * 60 * 1000); // Every hour

module.exports = messageQueue;

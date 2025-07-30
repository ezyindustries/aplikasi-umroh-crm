const { Message, ConversationSession, Contact, Conversation } = require('../models');
const whatsappService = require('./RealWAHAService');
const logger = require('../utils/logger');

class SimpleMessageQueueService {
  constructor() {
    // Simple in-memory queue for development
    this.outgoingQueue = [];
    this.incomingQueue = [];
    this.processing = false;
    
    // Start processing loop
    this.startProcessing();
  }

  startProcessing() {
    setInterval(() => {
      this.processQueues();
    }, 1000); // Process every second
  }

  async processQueues() {
    if (this.processing) return;
    this.processing = true;

    try {
      // Process outgoing messages
      if (this.outgoingQueue.length > 0) {
        const message = this.outgoingQueue.shift();
        await this.sendMessage(message);
      }

      // Process incoming messages
      if (this.incomingQueue.length > 0) {
        const data = this.incomingQueue.shift();
        await this.handleIncomingMessage(data);
      }
    } catch (error) {
      logger.error('Queue processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  // Queue outgoing message
  async queueOutgoingMessage(messageData) {
    try {
      const message = await Message.create({
        conversationId: messageData.conversationId,
        fromNumber: messageData.fromNumber,
        toNumber: messageData.toNumber,
        messageType: messageData.messageType || 'text',
        content: messageData.content,
        mediaUrl: messageData.mediaUrl,
        status: 'pending',
        direction: 'outbound'
      });

      this.outgoingQueue.push({
        id: message.id,
        ...messageData
      });

      logger.info('Message queued:', message.id);
      return message;
    } catch (error) {
      logger.error('Error queuing message:', error);
      throw error;
    }
  }

  // Send message via WAHA
  async sendMessage(messageData) {
    try {
      const message = await Message.findByPk(messageData.id);
      if (!message) return;

      logger.info('Sending message:', messageData.id);

      // Send via WAHA
      const result = await whatsappService.sendTextMessage(
        'default',
        messageData.toNumber,
        messageData.content
      );

      // Update message status
      await message.update({
        status: 'sent',
        sentAt: new Date(),
        whatsappMessageId: result.id
      });

      // Emit to frontend
      if (global.io) {
        global.io.emit('message:sent', {
          conversationId: message.conversationId,
          message: message.toJSON()
        });
      }

    } catch (error) {
      logger.error('Error sending message:', error);
      
      // Update message as failed
      const message = await Message.findByPk(messageData.id);
      if (message) {
        await message.update({
          status: 'failed',
          errorMessage: error.message
        });
      }
    }
  }

  // Process incoming message
  async processIncomingMessage(webhookData) {
    try {
      this.incomingQueue.push(webhookData);
      return { success: true };
    } catch (error) {
      logger.error('Error queueing incoming message:', error);
      throw error;
    }
  }

  // Handle incoming message
  async handleIncomingMessage(webhookData) {
    try {
      const { sessionId, message: whatsappMessage } = webhookData;
      
      logger.info('Processing message:', {
        from: whatsappMessage.from,
        to: whatsappMessage.to,
        type: whatsappMessage.type,
        fromMe: whatsappMessage.fromMe
      });

      // Parse phone numbers
      const fromNumber = whatsappService.parsePhoneNumber(whatsappMessage.from);
      const toNumber = whatsappService.parsePhoneNumber(whatsappMessage.to);
      
      // Determine which number is the contact (not our own number)
      const contactNumber = whatsappMessage.fromMe ? toNumber : fromNumber;

      // Find or create contact based on the contact number (not our own)
      let contact = await Contact.findOne({
        where: { phoneNumber: contactNumber }
      });

      if (!contact) {
        contact = await Contact.create({
          phoneNumber: contactNumber,
          name: whatsappMessage.pushname || contactNumber,
          source: 'whatsapp'
        });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        where: { contactId: contact.id }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          contactId: contact.id,
          sessionId: sessionId || 'default',
          status: 'active'
        });
      }

      // Save message with correct direction based on fromMe
      const message = await Message.create({
        conversationId: conversation.id,
        whatsappMessageId: whatsappMessage.id,
        fromNumber: fromNumber,
        toNumber: toNumber,
        messageType: whatsappMessage.type || 'text',
        content: whatsappMessage.text || whatsappMessage.caption || '',
        mediaId: whatsappMessage.mediaId,
        status: whatsappMessage.fromMe ? 'sent' : 'received',
        direction: whatsappMessage.fromMe ? 'outbound' : 'inbound',
        isForwarded: whatsappMessage.isForwarded || false,
        quotedMessageId: whatsappMessage.quotedMessageId
      });

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: message.content ? 
          message.content.substring(0, 100) : 
          `[${message.messageType}]`,
        unreadCount: conversation.unreadCount + 1
      });

      // Update contact last seen
      await contact.update({ lastSeen: new Date() });

      // Emit to frontend
      if (global.io) {
        global.io.emit('message:new', {
          conversationId: conversation.id,
          message: message.toJSON()
        });
        
        global.io.emit('conversation:updated', {
          conversation: conversation.toJSON(),
          contact: contact.toJSON()
        });
      }

      logger.info('Incoming message processed:', message.id);
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

      // Emit to frontend with whatsappMessageId for proper matching
      if (global.io) {
        global.io.emit('message:status', {
          messageId: whatsappMessageId,
          id: message.id,
          whatsappMessageId: whatsappMessageId,
          status: status
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error updating message status:', error);
      throw error;
    }
  }

  // Queue status update (called by WebhookHandler)
  async queueStatusUpdate(messageId, status, timestamp) {
    return this.updateMessageStatus(messageId, status, timestamp);
  }

  // Get queue stats
  async getQueueStats() {
    return {
      outgoing: {
        waiting: this.outgoingQueue.length,
        active: this.processing ? 1 : 0
      },
      incoming: {
        waiting: this.incomingQueue.length,
        active: this.processing ? 1 : 0
      }
    };
  }
}

// Export singleton instance
module.exports = new SimpleMessageQueueService();
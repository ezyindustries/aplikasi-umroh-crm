const { Message, Conversation, Contact } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class MessageService {
  // Save incoming message
  async saveIncomingMessage(data) {
    try {
      const {
        conversationId,
        waId,
        content,
        messageType = 'text',
        direction = 'inbound',
        status = 'received',
        timestamp
      } = data;
      
      // Check if message already exists
      const existingMessage = await Message.findOne({
        where: { waId }
      });
      
      if (existingMessage) {
        return existingMessage;
      }
      
      // Create new message
      const message = await Message.create({
        conversationId,
        waId,
        content,
        messageType,
        direction,
        status,
        timestamp: timestamp || new Date()
      });
      
      // Update conversation
      await Conversation.update(
        {
          lastMessageAt: message.timestamp,
          unreadCount: direction === 'inbound' ? 
            Conversation.sequelize.literal('unreadCount + 1') : 
            Conversation.sequelize.col('unreadCount')
        },
        { where: { id: conversationId } }
      );
      
      logger.info('New message saved:', message.id);
      return message;
      
    } catch (error) {
      logger.error('Error saving incoming message:', error);
      throw error;
    }
  }
  
  // Save outgoing message
  async saveOutgoingMessage(data) {
    try {
      const {
        conversationId,
        waId,
        content,
        messageType = 'text',
        status = 'pending'
      } = data;
      
      const message = await Message.create({
        conversationId,
        waId: waId || `msg_${Date.now()}`,
        content,
        messageType,
        direction: 'outbound',
        status,
        timestamp: new Date()
      });
      
      // Update conversation
      await Conversation.update(
        { lastMessageAt: message.timestamp },
        { where: { id: conversationId } }
      );
      
      logger.info('Outgoing message saved:', message.id);
      return message;
      
    } catch (error) {
      logger.error('Error saving outgoing message:', error);
      throw error;
    }
  }
  
  // Get messages for conversation
  async getMessages(conversationId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        order = 'DESC'
      } = options;
      
      const messages = await Message.findAll({
        where: { conversationId },
        order: [['timestamp', order]],
        limit,
        offset
      });
      
      return messages;
      
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }
  
  // Update message status
  async updateMessageStatus(messageId, status) {
    try {
      const message = await Message.findOne({
        where: { 
          [Op.or]: [
            { id: messageId },
            { waId: messageId }
          ]
        }
      });
      
      if (!message) {
        logger.warn('Message not found:', messageId);
        return null;
      }
      
      await message.update({ status });
      logger.info(`Message ${messageId} status updated to ${status}`);
      
      return message;
      
    } catch (error) {
      logger.error('Error updating message status:', error);
      throw error;
    }
  }
  
  // Search messages
  async searchMessages(query, options = {}) {
    try {
      const {
        conversationId,
        contactId,
        limit = 50
      } = options;
      
      const where = {
        content: { [Op.like]: `%${query}%` }
      };
      
      if (conversationId) {
        where.conversationId = conversationId;
      }
      
      const include = [];
      
      if (contactId) {
        include.push({
          model: Conversation,
          as: 'conversation',
          where: { contactId },
          include: [{
            model: Contact,
            as: 'contact'
          }]
        });
      }
      
      const messages = await Message.findAll({
        where,
        include,
        order: [['timestamp', 'DESC']],
        limit
      });
      
      return messages;
      
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw error;
    }
  }
}

module.exports = new MessageService();
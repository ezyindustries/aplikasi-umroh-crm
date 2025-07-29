const { Conversation, Contact, Message } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class ConversationService {
  // Get or create conversation
  async getOrCreateConversation(data) {
    try {
      const { contactId, sessionId, waId } = data;
      
      // Find existing conversation
      let conversation = await Conversation.findOne({
        where: {
          contactId,
          sessionId
        }
      });
      
      if (conversation) {
        return conversation;
      }
      
      // Create new conversation
      conversation = await Conversation.create({
        contactId,
        sessionId,
        waId,
        status: 'active',
        unreadCount: 0
      });
      
      logger.info('New conversation created:', conversation.id);
      return conversation;
      
    } catch (error) {
      logger.error('Error in getOrCreateConversation:', error);
      throw error;
    }
  }
  
  // Get all conversations
  async getConversations(filters = {}) {
    try {
      const where = {};
      
      if (filters.sessionId) {
        where.sessionId = filters.sessionId;
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.hasUnread) {
        where.unreadCount = { [Op.gt]: 0 };
      }
      
      const conversations = await Conversation.findAll({
        where,
        include: [
          {
            model: Contact,
            as: 'contact'
          },
          {
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']]
          }
        ],
        order: [['lastMessageAt', 'DESC']]
      });
      
      return conversations;
      
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  }
  
  // Get conversation by ID
  async getConversation(conversationId) {
    try {
      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          {
            model: Contact,
            as: 'contact'
          },
          {
            model: Message,
            as: 'messages',
            order: [['createdAt', 'DESC']]
          }
        ]
      });
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      return conversation;
      
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  }
  
  // Update conversation
  async updateConversation(conversationId, data) {
    try {
      const conversation = await Conversation.findByPk(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      await conversation.update(data);
      return conversation;
      
    } catch (error) {
      logger.error('Error updating conversation:', error);
      throw error;
    }
  }
  
  // Mark as read
  async markAsRead(conversationId) {
    try {
      const conversation = await Conversation.findByPk(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      await conversation.update({ unreadCount: 0 });
      
      // Mark all messages as read
      await Message.update(
        { status: 'read' },
        {
          where: {
            conversationId,
            direction: 'inbound',
            status: { [Op.ne]: 'read' }
          }
        }
      );
      
      return conversation;
      
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      throw error;
    }
  }
}

module.exports = new ConversationService();
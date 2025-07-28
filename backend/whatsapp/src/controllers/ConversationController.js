const { Conversation, Contact, Message, ConversationSession } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class ConversationController {
  // Get all conversations
  async getConversations(req, res) {
    try {
      const { 
        status = 'active',
        priority,
        assignedTo,
        hasUnread,
        limit = 20, 
        offset = 0 
      } = req.query;

      const whereClause = { status };

      if (priority) {
        whereClause.priority = priority;
      }

      if (assignedTo) {
        whereClause.assignedTo = assignedTo;
      }

      if (hasUnread === 'true') {
        whereClause.unreadCount = { [Op.gt]: 0 };
      }

      const conversations = await Conversation.findAll({
        where: whereClause,
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'phoneNumber', 'profilePicture', 'lastSeen']
          },
          {
            model: Message,
            as: 'messages',
            order: [['createdAt', 'DESC']],
            limit: 1,
            attributes: ['id', 'content', 'messageType', 'direction', 'createdAt', 'status']
          }
        ],
        order: [['lastMessageAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Add session info
      const conversationsWithSession = await Promise.all(
        conversations.map(async (conv) => {
          const session = await ConversationSession.findOne({
            where: { conversationId: conv.id },
            order: [['createdAt', 'DESC']]
          });

          return {
            ...conv.toJSON(),
            isWithin24hWindow: session ? session.canSendFreeFormMessage() : false
          };
        })
      );

      res.json({
        success: true,
        data: conversationsWithSession,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await Conversation.count({ where: whereClause })
        }
      });
    } catch (error) {
      logger.api.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get single conversation
  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;

      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          {
            model: Contact,
            as: 'contact'
          },
          {
            model: ConversationSession,
            as: 'sessions',
            order: [['createdAt', 'DESC']],
            limit: 1
          }
        ]
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // Check if within 24-hour window
      const currentSession = conversation.sessions[0];
      const isWithin24hWindow = currentSession ? 
        currentSession.canSendFreeFormMessage() : false;

      res.json({
        success: true,
        data: {
          ...conversation.toJSON(),
          isWithin24hWindow
        }
      });
    } catch (error) {
      logger.api.error('Error getting conversation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create conversation
  async createConversation(req, res) {
    try {
      const { contactId, sessionId = 'default', priority = 'medium' } = req.body;

      if (!contactId) {
        return res.status(400).json({
          success: false,
          error: 'Contact ID is required'
        });
      }

      // Check if active conversation exists
      const existingConversation = await Conversation.findOne({
        where: {
          contactId,
          status: 'active'
        }
      });

      if (existingConversation) {
        return res.json({
          success: true,
          data: existingConversation,
          existing: true
        });
      }

      // Create new conversation
      const conversation = await Conversation.create({
        contactId,
        sessionId,
        priority,
        status: 'active'
      });

      // Create conversation session
      const contact = await Contact.findByPk(contactId);
      await ConversationSession.create({
        conversationId: conversation.id,
        phoneNumber: contact.phoneNumber,
        initiatedBy: 'business'
      });

      res.json({
        success: true,
        data: conversation,
        created: true
      });
    } catch (error) {
      logger.api.error('Error creating conversation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update conversation
  async updateConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const updates = req.body;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      await conversation.update(updates);

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      logger.api.error('Error updating conversation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Close conversation
  async closeConversation(req, res) {
    try {
      const { conversationId } = req.params;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      await conversation.update({
        status: 'closed',
        closedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Conversation closed successfully'
      });
    } catch (error) {
      logger.api.error('Error closing conversation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Archive conversation
  async archiveConversation(req, res) {
    try {
      const { conversationId } = req.params;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      await conversation.update({
        status: 'archived'
      });

      res.json({
        success: true,
        message: 'Conversation archived successfully'
      });
    } catch (error) {
      logger.api.error('Error archiving conversation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Assign conversation to agent
  async assignConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const { agentId } = req.body;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      await conversation.update({
        assignedTo: agentId
      });

      res.json({
        success: true,
        message: 'Conversation assigned successfully'
      });
    } catch (error) {
      logger.api.error('Error assigning conversation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Add label to conversation
  async addLabel(req, res) {
    try {
      const { conversationId } = req.params;
      const { label } = req.body;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      const labels = conversation.labels || [];
      if (!labels.includes(label)) {
        labels.push(label);
        await conversation.update({ labels });
      }

      res.json({
        success: true,
        data: { labels }
      });
    } catch (error) {
      logger.api.error('Error adding label:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Remove label from conversation
  async removeLabel(req, res) {
    try {
      const { conversationId } = req.params;
      const { label } = req.body;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      const labels = conversation.labels || [];
      const index = labels.indexOf(label);
      if (index > -1) {
        labels.splice(index, 1);
        await conversation.update({ labels });
      }

      res.json({
        success: true,
        data: { labels }
      });
    } catch (error) {
      logger.api.error('Error removing label:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ConversationController();
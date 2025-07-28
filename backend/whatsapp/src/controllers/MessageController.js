const { Message, Conversation, Contact, ConversationSession } = require('../models');
const messageQueue = require('../services/MessageQueue');
const { canSendMessage, trackUniqueUser } = require('../config/rateLimiter');
const wahaComplianceService = require('../services/WAHAComplianceService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class MessageController {
  // Send message
  async sendMessage(req, res) {
    try {
      const {
        conversationId,
        toNumber,
        content,
        messageType = 'text',
        mediaUrl,
        templateName,
        templateVariables
      } = req.body;

      // Validate required fields
      if (!conversationId || !toNumber || (!content && !templateName)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Check rate limits
      const canSend = await canSendMessage(toNumber, !!templateName);
      if (!canSend.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: canSend.retryAfter
        });
      }

      // Track unique user
      await trackUniqueUser(toNumber);

      // Get conversation
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: Contact, as: 'contact' }]
      });
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      // WAHA Compliance Check
      const wahaCompliance = await wahaComplianceService.checkCompliance(
        toNumber,
        content,
        'default'
      );
      
      if (!wahaCompliance.passed) {
        return res.status(403).json({
          success: false,
          error: 'Compliance check failed',
          reasons: wahaCompliance.reasons
        });
      }

      // Show warnings if any
      if (wahaCompliance.warnings.length > 0) {
        logger.warn('Compliance warnings:', wahaCompliance.warnings);
      }

      // Add human delay to prevent ban
      await wahaComplianceService.addHumanDelay();

      // Update metrics after compliance
      await wahaComplianceService.updateMetrics(toNumber, true);

      // Queue message
      const result = await messageQueue.queueOutgoingMessage({
        conversationId,
        fromNumber: process.env.WHATSAPP_PHONE_NUMBER,
        toNumber,
        messageType,
        content,
        mediaUrl,
        templateName,
        templateVariables
      });

      res.json({
        success: true,
        data: result,
        message: 'Message queued for sending'
      });
    } catch (error) {
      logger.api.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get messages for conversation
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await Message.findAll({
        where: { conversationId },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Mark messages as read
      await Message.update(
        { status: 'read', readAt: new Date() },
        {
          where: {
            conversationId,
            direction: 'inbound',
            status: { [Op.ne]: 'read' }
          }
        }
      );

      // Update unread count
      await Conversation.update(
        { unreadCount: 0 },
        { where: { id: conversationId } }
      );

      res.json({
        success: true,
        data: messages.reverse(), // Return in chronological order
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await Message.count({ where: { conversationId } })
        }
      });
    } catch (error) {
      logger.api.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Search messages
  async searchMessages(req, res) {
    try {
      const { query, conversationId, limit = 20 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query required'
        });
      }

      const whereClause = {
        content: {
          [Op.like]: `%${query}%`
        }
      };

      if (conversationId) {
        whereClause.conversationId = conversationId;
      }

      const messages = await Message.findAll({
        where: whereClause,
        include: [{
          model: Conversation,
          as: 'conversation',
          include: [{
            model: Contact,
            as: 'contact'
          }]
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      logger.api.error('Error searching messages:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get message status
  async getMessageStatus(req, res) {
    try {
      const { messageId } = req.params;

      const message = await Message.findByPk(messageId, {
        attributes: ['id', 'status', 'sentAt', 'deliveredAt', 'readAt', 'errorMessage']
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      logger.api.error('Error getting message status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Star/unstar message
  async toggleStar(req, res) {
    try {
      const { messageId } = req.params;

      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      await message.update({
        isStarred: !message.isStarred
      });

      res.json({
        success: true,
        data: { isStarred: message.isStarred }
      });
    } catch (error) {
      logger.api.error('Error toggling star:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get queue status
  async getQueueStatus(req, res) {
    try {
      const stats = await messageQueue.getQueueStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.api.error('Error getting queue status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new MessageController();
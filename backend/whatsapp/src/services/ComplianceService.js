const { Contact, ConversationSession, Message, Conversation } = require('../models');
const compliance = require('../config/compliance');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class ComplianceService {
  constructor() {
    this.tier = process.env.WHATSAPP_TIER || 'tier2';
  }

  // Check if message can be sent
  async canSendMessage(contactId, messageType = 'text') {
    try {
      // 1. Check opt-in status
      const contact = await Contact.findByPk(contactId);
      if (!contact) {
        return { allowed: false, reason: 'Contact not found' };
      }

      if (compliance.contacts.requireOptIn && !contact.optInStatus) {
        return { allowed: false, reason: 'Contact has not opted in' };
      }

      // 2. Check conversation window
      const session = await ConversationSession.findOne({
        where: { contactId },
        order: [['lastCustomerMessageAt', 'DESC']]
      });

      const isWithinWindow = session && session.canSendFreeFormMessage();

      // 3. Check rate limits
      const rateLimit = await this.checkRateLimit(contactId);
      if (!rateLimit.allowed) {
        return rateLimit;
      }

      return {
        allowed: true,
        requiresTemplate: !isWithinWindow,
        window: isWithinWindow ? 'open' : 'closed'
      };
    } catch (error) {
      logger.error('Compliance check error:', error);
      return { allowed: false, reason: 'Compliance check failed' };
    }
  }

  // Check rate limits
  async checkRateLimit(contactId) {
    const limits = compliance.rateLimits[this.tier];
    
    // Check daily business-initiated limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const businessInitiatedCount = await Message.count({
      where: {
        direction: 'outbound',
        createdAt: { [Op.gte]: today },
        messageType: 'business_initiated'
      }
    });

    if (businessInitiatedCount >= limits.businessInitiated) {
      return {
        allowed: false,
        reason: 'Daily business-initiated message limit reached'
      };
    }

    // Check messages per user limit
    const userMessageCount = await Message.count({
      where: {
        contactId,
        direction: 'outbound',
        createdAt: { [Op.gte]: today }
      }
    });

    if (userMessageCount >= limits.messagesPerUser) {
      return {
        allowed: false,
        reason: 'Daily message limit per user reached'
      };
    }

    return { allowed: true };
  }

  // Process opt-in
  async processOptIn(contactId, method = 'message', metadata = {}) {
    try {
      const contact = await Contact.findByPk(contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      await contact.update({
        optInStatus: true,
        optInDate: new Date(),
        optInMethod: method,
        optInMetadata: metadata
      });

      logger.info(`Contact ${contactId} opted in via ${method}`);
      return true;
    } catch (error) {
      logger.error('Opt-in processing error:', error);
      return false;
    }
  }

  // Process opt-out
  async processOptOut(contactId) {
    try {
      const contact = await Contact.findByPk(contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      await contact.update({
        optInStatus: false,
        optOutDate: new Date()
      });

      // Close all active conversations
      await Conversation.update(
        { status: 'closed' },
        { where: { contactId, status: 'active' } }
      );

      logger.info(`Contact ${contactId} opted out`);
      return true;
    } catch (error) {
      logger.error('Opt-out processing error:', error);
      return false;
    }
  }

  // Check message content compliance
  checkMessageContent(content) {
    // Basic content filtering
    const prohibitedPatterns = [
      /\b(spam|scam|phishing)\b/i,
      /\b(click here now|urgent action required)\b/i,
      /\b(100% free|guaranteed winner)\b/i
    ];

    for (const pattern of prohibitedPatterns) {
      if (pattern.test(content)) {
        return {
          compliant: false,
          reason: 'Message contains prohibited content'
        };
      }
    }

    return { compliant: true };
  }

  // Update conversation window
  async updateConversationWindow(contactId, messageDirection) {
    try {
      if (messageDirection === 'inbound') {
        // Customer message - open/extend window
        await ConversationSession.upsert({
          contactId,
          lastCustomerMessageAt: new Date(),
          windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
    } catch (error) {
      logger.error('Error updating conversation window:', error);
    }
  }

  // Get compliance status
  async getComplianceStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      tier: this.tier,
      limits: compliance.rateLimits[this.tier],
      usage: {
        businessInitiated: await Message.count({
          where: {
            direction: 'outbound',
            createdAt: { [Op.gte]: today },
            messageType: 'business_initiated'
          }
        }),
        totalMessages: await Message.count({
          where: {
            direction: 'outbound',
            createdAt: { [Op.gte]: today }
          }
        })
      },
      optInStats: {
        total: await Contact.count(),
        optedIn: await Contact.count({ where: { optInStatus: true } }),
        optedOut: await Contact.count({ where: { optInStatus: false } })
      }
    };

    return stats;
  }
}

module.exports = new ComplianceService();
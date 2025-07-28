const { Contact, Conversation, Message } = require('../models');
// Use Baileys by default, fallback to WAHA
const USE_BAILEYS = process.env.USE_BAILEYS !== 'false';
const whatsappService = USE_BAILEYS 
  ? require('../services/BaileysService')
  : require('../services/WAHAService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class ContactController {
  // Get all contacts
  async getContacts(req, res) {
    try {
      const { 
        search, 
        status = 'active',
        hasUnread,
        limit = 50, 
        offset = 0 
      } = req.query;

      const whereClause = { status };

      // Search by name or phone
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { phoneNumber: { [Op.like]: `%${search}%` } }
        ];
      }

      // Include conversation data
      const contacts = await Contact.findAll({
        where: whereClause,
        include: [{
          model: Conversation,
          as: 'conversations',
          required: false,
          where: { status: 'active' },
          order: [['lastMessageAt', 'DESC']],
          limit: 1,
          include: [{
            model: Message,
            as: 'messages',
            order: [['createdAt', 'DESC']],
            limit: 1
          }]
        }],
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Filter by unread if requested
      let filteredContacts = contacts;
      if (hasUnread === 'true') {
        filteredContacts = contacts.filter(contact => 
          contact.conversations.some(conv => conv.unreadCount > 0)
        );
      }

      res.json({
        success: true,
        data: filteredContacts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await Contact.count({ where: whereClause })
        }
      });
    } catch (error) {
      logger.api.error('Error getting contacts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get single contact
  async getContact(req, res) {
    try {
      const { contactId } = req.params;

      const contact = await Contact.findByPk(contactId, {
        include: [{
          model: Conversation,
          as: 'conversations',
          include: [{
            model: Message,
            as: 'messages',
            order: [['createdAt', 'DESC']],
            limit: 1
          }]
        }]
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      logger.api.error('Error getting contact:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create or update contact
  async upsertContact(req, res) {
    try {
      const { phoneNumber, name, email, tags, metadata } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      // Check if number exists on WhatsApp
      const exists = await whatsappService.checkNumberExists('default', phoneNumber);
      if (!exists) {
        return res.status(400).json({
          success: false,
          error: 'Phone number not registered on WhatsApp'
        });
      }

      const [contact, created] = await Contact.upsert({
        phoneNumber: whatsappService.parsePhoneNumber(phoneNumber),
        name,
        email,
        tags,
        metadata,
        source: 'manual'
      });

      res.json({
        success: true,
        data: contact,
        created
      });
    } catch (error) {
      logger.api.error('Error upserting contact:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update contact
  async updateContact(req, res) {
    try {
      const { contactId } = req.params;
      const updates = req.body;

      const contact = await Contact.findByPk(contactId);
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      await contact.update(updates);

      res.json({
        success: true,
        data: contact
      });
    } catch (error) {
      logger.api.error('Error updating contact:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Sync contacts from WhatsApp
  async syncContacts(req, res) {
    try {
      const { sessionId = 'default' } = req.body;

      logger.api.info('Syncing contacts from WhatsApp...');

      const whatsappContacts = await whatsappService.getContacts(sessionId);
      
      let synced = 0;
      for (const waContact of whatsappContacts) {
        if (waContact.isMyContact || waContact.isGroup) continue;

        const [contact, created] = await Contact.upsert({
          phoneNumber: whatsappService.parsePhoneNumber(waContact.id),
          name: waContact.name || waContact.pushName,
          profilePicture: waContact.profilePicture,
          source: 'whatsapp',
          metadata: {
            pushName: waContact.pushName,
            shortName: waContact.shortName,
            isBlocked: waContact.isBlocked
          }
        });

        if (created) synced++;
      }

      res.json({
        success: true,
        message: `Synced ${synced} new contacts`,
        total: whatsappContacts.length
      });
    } catch (error) {
      logger.api.error('Error syncing contacts:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get conversations for contact
  async getContactConversations(req, res) {
    try {
      const { contactId } = req.params;
      const { status = 'active' } = req.query;

      const conversations = await Conversation.findAll({
        where: { 
          contactId,
          status 
        },
        include: [{
          model: Message,
          as: 'messages',
          order: [['createdAt', 'DESC']],
          limit: 1
        }],
        order: [['updatedAt', 'DESC']]
      });

      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      logger.api.error('Error getting contact conversations:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Block/unblock contact
  async toggleBlock(req, res) {
    try {
      const { contactId } = req.params;

      const contact = await Contact.findByPk(contactId);
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      const newStatus = contact.status === 'blocked' ? 'active' : 'blocked';
      await contact.update({ status: newStatus });

      res.json({
        success: true,
        data: { status: newStatus }
      });
    } catch (error) {
      logger.api.error('Error toggling block:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get contact statistics
  async getContactStats(req, res) {
    try {
      const { contactId } = req.params;

      const stats = await sequelize.query(`
        SELECT 
          COUNT(DISTINCT c.id) as total_conversations,
          COUNT(m.id) as total_messages,
          SUM(CASE WHEN m.direction = 'inbound' THEN 1 ELSE 0 END) as received_messages,
          SUM(CASE WHEN m.direction = 'outbound' THEN 1 ELSE 0 END) as sent_messages,
          MAX(m.created_at) as last_message_at
        FROM contacts ct
        LEFT JOIN conversations c ON ct.id = c.contact_id
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE ct.id = :contactId
        GROUP BY ct.id
      `, {
        replacements: { contactId },
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: stats[0] || {}
      });
    } catch (error) {
      logger.api.error('Error getting contact stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ContactController();
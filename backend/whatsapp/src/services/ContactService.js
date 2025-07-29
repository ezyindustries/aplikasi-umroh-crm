const { Contact, Conversation, Message } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class ContactService {
  // Get or create contact
  async getOrCreateContact(data) {
    try {
      const { phoneNumber, name, waId } = data;
      
      // Find existing contact
      let contact = await Contact.findOne({
        where: { phoneNumber }
      });
      
      if (contact) {
        // Update contact info if needed
        if (name && name !== contact.name) {
          await contact.update({ name, waId });
        }
        return contact;
      }
      
      // Create new contact
      contact = await Contact.create({
        phoneNumber,
        name: name || phoneNumber,
        waId: waId || `${phoneNumber}@c.us`,
        status: 'active'
      });
      
      logger.info('New contact created:', contact.phoneNumber);
      return contact;
      
    } catch (error) {
      logger.error('Error in getOrCreateContact:', error);
      throw error;
    }
  }
  
  // Get all contacts
  async getContacts(filters = {}) {
    try {
      const where = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { phoneNumber: { [Op.like]: `%${filters.search}%` } }
        ];
      }
      
      const contacts = await Contact.findAll({
        where,
        include: [{
          model: Conversation,
          as: 'conversations',
          limit: 1,
          order: [['lastMessageAt', 'DESC']],
          include: [{
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']]
          }]
        }],
        order: [['updatedAt', 'DESC']]
      });
      
      return contacts;
      
    } catch (error) {
      logger.error('Error getting contacts:', error);
      throw error;
    }
  }
  
  // Get contact by ID
  async getContact(contactId) {
    try {
      const contact = await Contact.findByPk(contactId, {
        include: [{
          model: Conversation,
          as: 'conversations',
          include: [{
            model: Message,
            as: 'messages',
            limit: 10,
            order: [['createdAt', 'DESC']]
          }]
        }]
      });
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      return contact;
      
    } catch (error) {
      logger.error('Error getting contact:', error);
      throw error;
    }
  }
  
  // Update contact
  async updateContact(contactId, data) {
    try {
      const contact = await Contact.findByPk(contactId);
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      await contact.update(data);
      return contact;
      
    } catch (error) {
      logger.error('Error updating contact:', error);
      throw error;
    }
  }
}

module.exports = new ContactService();
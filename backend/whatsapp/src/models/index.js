const sequelize = require('../config/database');
const Contact = require('./Contact');
const Conversation = require('./Conversation');
const Message = require('./Message');
const WhatsAppSession = require('./WhatsAppSession');
const ConversationSession = require('./ConversationSession');
const MessageTemplate = require('./MessageTemplate');

// Define associations
Contact.hasMany(Conversation, { foreignKey: 'contact_id', as: 'conversations' });
Conversation.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

Conversation.hasMany(ConversationSession, { foreignKey: 'conversation_id', as: 'sessions' });
ConversationSession.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

// Sync models with database
const initDatabase = async () => {
  try {
    // In production, use migrations instead of sync
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized successfully.');
    }
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Contact,
  Conversation,
  Message,
  WhatsAppSession,
  ConversationSession,
  MessageTemplate,
  initDatabase
};
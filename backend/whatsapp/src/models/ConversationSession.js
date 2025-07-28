const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConversationSession = sequelize.define('ConversationSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id',
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'phone_number'
  },
  sessionStart: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'session_start'
  },
  sessionEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'session_end'
  },
  lastCustomerMessageAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_customer_message_at'
  },
  isWithin24hWindow: {
    type: DataTypes.VIRTUAL,
    get() {
      const lastMessage = this.getDataValue('lastCustomerMessageAt');
      if (!lastMessage) return false;
      
      const hoursSinceLastMessage = (Date.now() - new Date(lastMessage)) / (1000 * 60 * 60);
      return hoursSinceLastMessage < 24;
    }
  },
  messagesSentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'messages_sent_count'
  },
  templateUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'template_used',
    comment: 'Whether template was used to initiate conversation'
  },
  initiatedBy: {
    type: DataTypes.ENUM('customer', 'business'),
    allowNull: false,
    defaultValue: 'customer',
    field: 'initiated_by'
  },
  category: {
    type: DataTypes.ENUM('service', 'marketing', 'utility', 'authentication'),
    defaultValue: 'service',
    comment: 'Conversation category for billing'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'conversation_sessions',
  indexes: [
    { fields: ['conversation_id'] },
    { fields: ['phone_number'] },
    { fields: ['session_start'] },
    { fields: ['last_customer_message_at'] }
  ]
});

// Instance method to check if can send free-form message
ConversationSession.prototype.canSendFreeFormMessage = function() {
  const hoursSinceLastMessage = (Date.now() - new Date(this.lastCustomerMessageAt)) / (1000 * 60 * 60);
  return hoursSinceLastMessage < 24;
};

// Instance method to extend session
ConversationSession.prototype.extendSession = async function() {
  this.lastCustomerMessageAt = new Date();
  await this.save();
};

module.exports = ConversationSession;
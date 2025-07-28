const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
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
  whatsappMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'whatsapp_message_id',
    comment: 'WhatsApp message ID for tracking'
  },
  fromNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'from_number'
  },
  toNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'to_number'
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'template'),
    defaultValue: 'text',
    field: 'message_type'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Text content or caption'
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'media_url'
  },
  mediaId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'media_id',
    comment: 'WhatsApp media ID'
  },
  mediaMimeType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'media_mime_type'
  },
  mediaSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'media_size',
    comment: 'File size in bytes'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
    defaultValue: 'pending'
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    allowNull: false
  },
  isForwarded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_forwarded'
  },
  isStarred: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_starred'
  },
  quotedMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'quoted_message_id',
    comment: 'ID of message being replied to'
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'template_name',
    comment: 'Template name if template message'
  },
  templateVariables: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'template_variables'
  },
  errorMessage: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'error_message'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'messages',
  indexes: [
    { fields: ['conversation_id'] },
    { fields: ['whatsapp_message_id'] },
    { fields: ['from_number'] },
    { fields: ['to_number'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['sent_at'] }
  ]
});

module.exports = Message;
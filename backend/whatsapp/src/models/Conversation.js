const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'contact_id',
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'session_id',
    comment: 'WAHA session ID'
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'archived', 'pending', 'converted', 'resolved'),
    defaultValue: 'active'
  },
  unreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'unread_count'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at'
  },
  lastMessagePreview: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'last_message_preview'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional conversation data'
  },
  labels: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Conversation labels/tags'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'assigned_to',
    comment: 'Agent handling this conversation'
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at'
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'closed_at'
  },
  resolvedBy: {
    type: DataTypes.ENUM('agent', 'ai', 'customer'),
    allowNull: true,
    field: 'resolved_by',
    comment: 'Who resolved this conversation'
  }
}, {
  tableName: 'conversations',
  indexes: [
    { fields: ['contact_id'] },
    { fields: ['session_id'] },
    { fields: ['status'] },
    { fields: ['assigned_to'] },
    { fields: ['last_message_at'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Conversation;
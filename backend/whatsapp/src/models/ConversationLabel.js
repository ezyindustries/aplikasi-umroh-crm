const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConversationLabel = sequelize.define('ConversationLabel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.INTEGER,
    field: 'conversation_id',
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Reference to conversation'
  },
  labelId: {
    type: DataTypes.STRING,
    field: 'label_id',
    allowNull: false,
    references: {
      model: 'whatsapp_labels',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Reference to WhatsApp label'
  },
  assignedBy: {
    type: DataTypes.STRING,
    field: 'assigned_by',
    comment: 'Who assigned this label (user/system/automation)'
  },
  assignedAt: {
    type: DataTypes.DATE,
    field: 'assigned_at',
    defaultValue: DataTypes.NOW,
    comment: 'When label was assigned'
  },
  reason: {
    type: DataTypes.STRING,
    comment: 'Reason for label assignment'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata'
  }
}, {
  tableName: 'conversation_labels',
  indexes: [
    { fields: ['conversation_id', 'label_id'], unique: true },
    { fields: ['conversation_id'] },
    { fields: ['label_id'] },
    { fields: ['assigned_at'] }
  ]
});

module.exports = ConversationLabel;
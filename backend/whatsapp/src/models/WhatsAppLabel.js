const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsAppLabel = sequelize.define('WhatsAppLabel', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    comment: 'WhatsApp label ID from WAHA'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Label name with emoji'
  },
  color: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 19
    },
    comment: 'Color ID (0-19)'
  },
  colorHex: {
    type: DataTypes.STRING,
    field: 'color_hex',
    comment: 'Hex color code'
  },
  sessionId: {
    type: DataTypes.STRING,
    field: 'session_id',
    defaultValue: 'default',
    comment: 'WhatsApp session ID'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    field: 'usage_count',
    defaultValue: 0,
    comment: 'Number of times this label is used'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    defaultValue: true,
    comment: 'Whether label is active'
  }
}, {
  tableName: 'whatsapp_labels',
  indexes: [
    { fields: ['session_id'] },
    { fields: ['name'] },
    { fields: ['is_active'] }
  ]
});

module.exports = WhatsAppLabel;
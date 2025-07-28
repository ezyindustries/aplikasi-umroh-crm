const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsAppSession = sequelize.define('WhatsAppSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'session_name'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'phone_number'
  },
  status: {
    type: DataTypes.ENUM('disconnected', 'connecting', 'qr', 'connected', 'failed'),
    defaultValue: 'disconnected'
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code'
  },
  qrCodeExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'qr_code_expires_at'
  },
  connectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'connected_at'
  },
  disconnectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'disconnected_at'
  },
  lastHealthCheck: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_health_check'
  },
  errorMessage: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'error_message'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Session metadata like battery level, platform, etc'
  },
  webhookUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'webhook_url'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_default'
  }
}, {
  tableName: 'whatsapp_sessions',
  indexes: [
    { fields: ['session_name'] },
    { fields: ['status'] },
    { fields: ['phone_number'] }
  ]
});

module.exports = WhatsAppSession;
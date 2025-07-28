const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageTemplate = sequelize.define('MessageTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'template_name',
    comment: 'Internal template name'
  },
  whatsappTemplateId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'whatsapp_template_id',
    comment: 'WhatsApp approved template ID'
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'id',
    comment: 'Language code (id for Indonesian)'
  },
  category: {
    type: DataTypes.ENUM('MARKETING', 'UTILITY', 'AUTHENTICATION'),
    allowNull: false
  },
  headerType: {
    type: DataTypes.ENUM('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'NONE'),
    defaultValue: 'NONE',
    field: 'header_type'
  },
  headerContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'header_content'
  },
  bodyContent: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'body_content'
  },
  footerContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'footer_content'
  },
  buttons: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of button configurations'
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Variable placeholders in template'
  },
  approvalStatus: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAUSED'),
    defaultValue: 'PENDING',
    field: 'approval_status'
  },
  rejectionReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'rejection_reason'
  },
  exampleValues: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'example_values',
    comment: 'Example values for variables'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'usage_count'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_used_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at'
  }
}, {
  tableName: 'message_templates',
  indexes: [
    { fields: ['template_name'] },
    { fields: ['category'] },
    { fields: ['approval_status'] },
    { fields: ['is_active'] }
  ]
});

module.exports = MessageTemplate;
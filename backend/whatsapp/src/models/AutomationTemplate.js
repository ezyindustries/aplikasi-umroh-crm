const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomationTemplate = sequelize.define('AutomationTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Template name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Template description'
  },
  category: {
    type: DataTypes.ENUM('welcome', 'sales', 'support', 'holiday', 'promotion', 'other'),
    defaultValue: 'other',
    comment: 'Template category'
  },
  ruleConfig: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'rule_config',
    comment: 'Complete rule configuration'
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: 'smart_toy',
    comment: 'Material icon name'
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_premium',
    comment: 'Whether this is a premium template'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'usage_count',
    comment: 'Number of times template has been used'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Search tags'
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'id',
    comment: 'Template language (id, en, ar)'
  },
  previewImage: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'preview_image',
    comment: 'URL to preview image'
  }
}, {
  tableName: 'automation_templates',
  indexes: [
    { fields: ['category'] },
    { fields: ['is_premium'] },
    { fields: ['usage_count'] }
  ]
});

module.exports = AutomationTemplate;
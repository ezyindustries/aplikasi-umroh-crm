const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomationAnalytics = sequelize.define('AutomationAnalytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ruleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'rule_id',
    references: {
      model: 'automation_rules',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Reference to automation rule'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Analytics date'
  },
  triggerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'trigger_count',
    comment: 'Number of times triggered'
  },
  successCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'success_count',
    comment: 'Number of successful executions'
  },
  failureCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'failure_count',
    comment: 'Number of failed executions'
  },
  avgResponseTime: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'avg_response_time',
    comment: 'Average response time in milliseconds'
  },
  conversionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'conversion_count',
    comment: 'Number of conversions (leads to next phase)'
  },
  conversionRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'conversion_rate',
    comment: 'Conversion rate percentage'
  },
  messagesSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'messages_sent',
    comment: 'Total messages sent'
  },
  imagesSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'images_sent',
    comment: 'Total images sent'
  },
  uniqueContacts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'unique_contacts',
    comment: 'Number of unique contacts triggered'
  },
  hourlyDistribution: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'hourly_distribution',
    comment: 'Triggers by hour of day'
  }
}, {
  tableName: 'automation_analytics',
  indexes: [
    { fields: ['rule_id', 'date'], unique: true },
    { fields: ['date'] },
    { fields: ['rule_id'] }
  ]
});

module.exports = AutomationAnalytics;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomationLog = sequelize.define('AutomationLog', {
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
    comment: 'Reference to the automation rule'
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'contact_id',
    references: {
      model: 'contacts',
      key: 'id'
    },
    comment: 'Contact that triggered the rule'
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'conversation_id',
    references: {
      model: 'conversations',
      key: 'id'
    },
    comment: 'Conversation where rule was triggered'
  },
  messageId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'message_id',
    references: {
      model: 'messages',
      key: 'id'
    },
    comment: 'Message that triggered the rule'
  },
  triggerType: {
    type: DataTypes.ENUM('new_contact', 'keyword', 'schedule', 'workflow', 'manual'),
    allowNull: false,
    field: 'trigger_type',
    comment: 'How the rule was triggered'
  },
  triggerData: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'trigger_data',
    comment: 'Data that caused the trigger (keywords, time, etc)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'skipped'),
    defaultValue: 'pending',
    comment: 'Execution status'
  },
  responseMessageId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'response_message_id',
    comment: 'ID of the message sent as response'
  },
  executionTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'execution_time',
    comment: 'Time taken to execute in milliseconds'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if execution failed'
  },
  skippedReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'skipped_reason',
    comment: 'Reason why rule was skipped (cooldown, max triggers, etc)'
  },
  workflowState: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'workflow_state',
    comment: 'Current state for workflow rules'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional execution metadata'
  }
}, {
  tableName: 'automation_logs',
  indexes: [
    { fields: ['rule_id'] },
    { fields: ['contact_id'] },
    { fields: ['conversation_id'] },
    { fields: ['status'] },
    { fields: ['trigger_type'] },
    { fields: ['created_at'] }
  ]
});

module.exports = AutomationLog;
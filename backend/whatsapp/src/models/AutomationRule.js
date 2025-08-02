const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomationRule = sequelize.define('AutomationRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Rule name for identification'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Rule description'
  },
  ruleType: {
    type: DataTypes.ENUM('welcome', 'away', 'keyword', 'workflow', 'llm_agent'),
    allowNull: false,
    field: 'rule_type',
    comment: 'Type of automation rule'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether the rule is currently active'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Rule priority (higher number = higher priority)'
  },
  // Trigger conditions
  triggerConditions: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'trigger_conditions',
    comment: 'JSON object containing trigger conditions'
  },
  // For keyword rules
  keywords: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of keywords that trigger this rule'
  },
  // For away messages
  schedule: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Schedule configuration for away messages'
  },
  // Response configuration
  responseMessage: {
    type: DataTypes.TEXT,
    allowNull: true, // Making it nullable since we'll use responseMessages array
    field: 'response_message',
    comment: 'The message to send as response (legacy, use responseMessages for multiple)'
  },
  responseMessages: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'response_messages',
    comment: 'Array of response messages with types (text/image) and content'
  },
  responseDelay: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    field: 'response_delay',
    comment: 'Delay in seconds before sending first response'
  },
  messageDelay: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'message_delay',
    comment: 'Delay in seconds between multiple messages'
  },
  responseType: {
    type: DataTypes.ENUM('text', 'template', 'media', 'button', 'sequence'),
    defaultValue: 'text',
    field: 'response_type',
    comment: 'Type of response message (use sequence for multiple messages)'
  },
  // Media attachments for responses (legacy)
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'media_url',
    comment: 'URL of media to attach to response (legacy, use responseMessages)'
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video', 'document', 'audio'),
    allowNull: true,
    field: 'media_type',
    comment: 'Type of media attachment (legacy, use responseMessages)'
  },
  // Button configuration for interactive messages
  buttons: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of button configurations'
  },
  // Template reference
  templateId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'template_id',
    references: {
      model: 'automation_templates',
      key: 'id'
    },
    comment: 'Reference to automation template if created from template'
  },
  // Variables for personalization
  variables: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Variables available for message personalization'
  },
  // Workflow configuration
  workflowSteps: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'workflow_steps',
    comment: 'Array of workflow step configurations'
  },
  // Analytics
  triggerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'trigger_count',
    comment: 'Number of times this rule has been triggered'
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
  lastTriggeredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_triggered_at',
    comment: 'Last time this rule was triggered'
  },
  // Configuration
  maxTriggersPerContact: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'max_triggers_per_contact',
    comment: 'Max times to trigger per contact (0 = unlimited)'
  },
  cooldownMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'cooldown_minutes',
    comment: 'Minutes to wait before rule can trigger again for same contact'
  },
  // Conditions
  contactConditions: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'contact_conditions',
    comment: 'Conditions that contact must meet'
  },
  // LLM Agent Configuration
  llmConfig: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'llm_config',
    comment: 'LLM configuration (model, temperature, max tokens, etc.)'
  },
  systemPrompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'system_prompt',
    comment: 'System prompt for LLM agent personality and behavior'
  },
  contextMode: {
    type: DataTypes.ENUM('conversation', 'customer_phase', 'both'),
    defaultValue: 'conversation',
    field: 'context_mode',
    comment: 'What context to include when generating LLM responses'
  },
  knowledgeBase: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'knowledge_base',
    comment: 'Knowledge base entries for the LLM agent'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata'
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'created_by',
    comment: 'User who created this rule'
  }
}, {
  tableName: 'automation_rules',
  indexes: [
    { fields: ['rule_type'] },
    { fields: ['is_active'] },
    { fields: ['priority'] },
    { fields: ['created_at'] }
  ]
});

module.exports = AutomationRule;
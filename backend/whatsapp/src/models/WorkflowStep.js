const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowStep = sequelize.define('WorkflowStep', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workflowId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'workflow_id',
    references: {
      model: 'workflow_templates',
      key: 'id'
    }
  },
  stepOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'step_order',
    comment: 'Order of execution (1, 2, 3...)'
  },
  stepType: {
    type: DataTypes.ENUM('template', 'keyword', 'ai_agent', 'conditional', 'input', 'action'),
    allowNull: false,
    field: 'step_type',
    comment: 'Type of step'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Step name for reference'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Step description'
  },
  config: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Step configuration based on type'
  },
  // For template type
  templateText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'template_text',
    comment: 'Template message with variables'
  },
  // For keyword type
  keywords: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Keywords to match'
  },
  // For AI type
  aiPrompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ai_prompt',
    comment: 'AI system prompt for this step'
  },
  aiConfig: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'ai_config',
    comment: 'AI configuration (model, temperature, etc)'
  },
  // For input type
  inputType: {
    type: DataTypes.ENUM('text', 'number', 'choice', 'date', 'location'),
    allowNull: true,
    field: 'input_type',
    comment: 'Type of input expected'
  },
  inputValidation: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'input_validation',
    comment: 'Validation rules for input'
  },
  // For storing data
  saveToVariable: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'save_to_variable',
    comment: 'Variable name to store response'
  },
  // Flow control
  nextStepConditions: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'next_step_conditions',
    comment: 'Conditions for next step routing'
  },
  defaultNextStep: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'default_next_step',
    comment: 'Default next step if no conditions match'
  },
  // Timing
  responseTimeout: {
    type: DataTypes.INTEGER,
    defaultValue: 300,
    field: 'response_timeout',
    comment: 'Timeout in seconds waiting for response'
  },
  delayBefore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'delay_before',
    comment: 'Delay in seconds before sending'
  },
  // UI positioning for visual builder
  position: {
    type: DataTypes.JSON,
    defaultValue: { x: 0, y: 0 },
    comment: 'Position in visual builder'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  tableName: 'workflow_steps',
  timestamps: true,
  underscored: true
});

module.exports = WorkflowStep;
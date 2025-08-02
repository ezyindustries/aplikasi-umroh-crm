const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowSession = sequelize.define('WorkflowSession', {
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
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_phone',
    comment: 'Customer WhatsApp number'
  },
  currentStepId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'current_step_id',
    comment: 'Current step in workflow'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'abandoned', 'timeout', 'error'),
    defaultValue: 'active',
    comment: 'Session status'
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_activity_at'
  },
  sessionData: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'session_data',
    comment: 'Session context and state'
  },
  collectedVariables: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'collected_variables',
    comment: 'Variables collected during workflow'
  },
  stepHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'step_history',
    comment: 'History of executed steps'
  },
  errorLog: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'error_log',
    comment: 'Any errors encountered'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional session metadata'
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
  tableName: 'workflow_sessions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['customer_phone', 'status']
    },
    {
      fields: ['workflow_id', 'status']
    }
  ]
});

module.exports = WorkflowSession;
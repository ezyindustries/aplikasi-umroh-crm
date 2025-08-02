const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowTemplate = sequelize.define('WorkflowTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ruleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rule_id',
    references: {
      model: 'automation_rules',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Workflow name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Workflow description'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Workflow version number'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether this workflow is active'
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Workflow settings (timeout, max steps, etc)'
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'List of variables used in this workflow'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional workflow metadata'
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
  tableName: 'workflow_templates',
  timestamps: true,
  underscored: true
});

module.exports = WorkflowTemplate;
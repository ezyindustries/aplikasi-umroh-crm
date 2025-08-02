const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowVariable = sequelize.define('WorkflowVariable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'session_id',
    references: {
      model: 'workflow_sessions',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Variable name'
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Variable value as text'
  },
  dataType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'date', 'array', 'object'),
    defaultValue: 'string',
    field: 'data_type',
    comment: 'Data type of variable'
  },
  stepId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'step_id',
    comment: 'Step that collected this variable'
  },
  collectedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'collected_at'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional variable metadata'
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
  tableName: 'workflow_variables',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['session_id', 'name'],
      unique: true
    }
  ]
});

module.exports = WorkflowVariable;
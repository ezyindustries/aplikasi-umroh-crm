const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomationContactLimit = sequelize.define('AutomationContactLimit', {
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
    comment: 'Contact being tracked'
  },
  triggerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'trigger_count',
    comment: 'Number of times rule triggered for this contact'
  },
  lastTriggeredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_triggered_at',
    comment: 'Last time rule was triggered for this contact'
  },
  cooldownUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cooldown_until',
    comment: 'Contact is in cooldown until this time'
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_blocked',
    comment: 'Whether this contact is blocked from this rule'
  },
  blockedReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'blocked_reason',
    comment: 'Reason for blocking'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional tracking data'
  }
}, {
  tableName: 'automation_contact_limits',
  indexes: [
    { 
      fields: ['rule_id', 'contact_id'],
      unique: true
    },
    { fields: ['cooldown_until'] },
    { fields: ['is_blocked'] }
  ]
});

module.exports = AutomationContactLimit;
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AutomationRule = sequelize.define('AutomationRule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    rule_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    trigger_type: {
      type: DataTypes.ENUM('new_lead', 'payment_reminder', 'follow_up', 'birthday', 'departure_reminder', 'custom'),
      allowNull: false
    },
    trigger_conditions: {
      type: DataTypes.TEXT // JSON object for conditions
    },
    action_type: {
      type: DataTypes.ENUM('send_message', 'create_task', 'update_status', 'send_email', 'schedule_call'),
      allowNull: false
    },
    message_template_id: {
      type: DataTypes.UUID,
      references: {
        model: 'message_templates',
        key: 'id'
      }
    },
    delay_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    execution_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_executed: {
      type: DataTypes.DATE
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    max_executions: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // 0 = unlimited
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'automation_rules',
    indexes: [
      { fields: ['trigger_type'] },
      { fields: ['is_active'] },
      { fields: ['priority'] },
      { fields: ['last_executed'] }
    ]
  });

  return AutomationRule;
};
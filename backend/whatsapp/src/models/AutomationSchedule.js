const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomationSchedule = sequelize.define('AutomationSchedule', {
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
  scheduleType: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'custom'),
    defaultValue: 'daily',
    field: 'schedule_type',
    comment: 'Type of schedule'
  },
  daysOfWeek: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'days_of_week',
    comment: 'Array of days [0-6] where 0 is Sunday'
  },
  daysOfMonth: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'days_of_month',
    comment: 'Array of days [1-31] for monthly schedules'
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'start_time',
    comment: 'Start time in HH:MM:SS format'
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'end_time',
    comment: 'End time in HH:MM:SS format'
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Jakarta',
    comment: 'Timezone for schedule'
  },
  excludeDates: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'exclude_dates',
    comment: 'Array of dates to exclude (holidays, etc)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether the schedule is active'
  },
  lastExecutedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_executed_at',
    comment: 'Last time this schedule was executed'
  },
  nextExecutionAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'next_execution_at',
    comment: 'Next scheduled execution time'
  }
}, {
  tableName: 'automation_schedules',
  indexes: [
    { fields: ['rule_id'] },
    { fields: ['is_active'] },
    { fields: ['next_execution_at'] }
  ]
});

module.exports = AutomationSchedule;
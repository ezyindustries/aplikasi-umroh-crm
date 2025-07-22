const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MessageQueue = sequelize.define('MessageQueue', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    recipient_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    message_content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    media_type: {
      type: DataTypes.ENUM('text', 'image', 'document', 'video'),
      defaultValue: 'text'
    },
    media_url: {
      type: DataTypes.STRING(500)
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    sent_at: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    error_message: {
      type: DataTypes.TEXT
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    max_retries: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    automation_rule_id: {
      type: DataTypes.UUID,
      references: {
        model: 'automation_rules',
        key: 'id'
      }
    },
    lead_id: {
      type: DataTypes.UUID,
      references: {
        model: 'leads',
        key: 'id'
      }
    },
    jamaah_id: {
      type: DataTypes.UUID,
      references: {
        model: 'jamaah',
        key: 'id'
      }
    },
    campaign_id: {
      type: DataTypes.UUID,
      references: {
        model: 'campaigns',
        key: 'id'
      }
    },
    waha_message_id: {
      type: DataTypes.STRING(255) // ID from WAHA response
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
    tableName: 'message_queue',
    indexes: [
      { fields: ['recipient_number'] },
      { fields: ['scheduled_at'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['automation_rule_id'] },
      { fields: ['lead_id'] },
      { fields: ['jamaah_id'] },
      { fields: ['campaign_id'] }
    ]
  });

  return MessageQueue;
};
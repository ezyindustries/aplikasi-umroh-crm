const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MessageTemplate = sequelize.define('MessageTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    template_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('welcome', 'follow_up', 'payment_reminder', 'promotion', 'information', 'custom'),
      allowNull: false
    },
    message_content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    variables: {
      type: DataTypes.TEXT // JSON array of available variables like {name}, {package}, etc.
    },
    media_type: {
      type: DataTypes.ENUM('text', 'image', 'document', 'video'),
      defaultValue: 'text'
    },
    media_url: {
      type: DataTypes.STRING(500)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_used: {
      type: DataTypes.DATE
    },
    success_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
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
    tableName: 'message_templates',
    indexes: [
      { fields: ['template_name'] },
      { fields: ['category'] },
      { fields: ['is_active'] },
      { fields: ['usage_count'] }
    ]
  });

  return MessageTemplate;
};
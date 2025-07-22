const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Campaign = sequelize.define('Campaign', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    campaign_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    campaign_type: {
      type: DataTypes.ENUM('whatsapp_blast', 'social_media', 'referral', 'event', 'other'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'cancelled'),
      defaultValue: 'draft'
    },
    target_package: {
      type: DataTypes.UUID,
      references: {
        model: 'packages',
        key: 'id'
      }
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    spent_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    target_leads: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    actual_leads: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    conversion_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    roi: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT
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
    tableName: 'campaigns',
    indexes: [
      { fields: ['campaign_name'] },
      { fields: ['campaign_type'] },
      { fields: ['status'] },
      { fields: ['start_date'] },
      { fields: ['target_package'] }
    ]
  });

  return Campaign;
};
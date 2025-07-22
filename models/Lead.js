const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lead = sequelize.define('Lead', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    whatsapp_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255)
    },
    source: {
      type: DataTypes.ENUM('direct', 'referral', 'social_media', 'website', 'advertisement', 'other'),
      defaultValue: 'direct'
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'interested', 'qualified', 'converted', 'lost'),
      defaultValue: 'new'
    },
    lead_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    first_contact_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    last_contact_date: {
      type: DataTypes.DATE
    },
    conversion_date: {
      type: DataTypes.DATE
    },
    jamaah_id: {
      type: DataTypes.UUID,
      references: {
        model: 'jamaah',
        key: 'id'
      }
    },
    interested_package: {
      type: DataTypes.UUID,
      references: {
        model: 'packages',
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
    notes: {
      type: DataTypes.TEXT
    },
    tags: {
      type: DataTypes.TEXT // JSON array of tags
    },
    assigned_to: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
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
    tableName: 'leads',
    indexes: [
      { fields: ['whatsapp_number'] },
      { fields: ['status'] },
      { fields: ['source'] },
      { fields: ['assigned_to'] },
      { fields: ['first_contact_date'] },
      { fields: ['conversion_date'] },
      { fields: ['campaign_id'] }
    ]
  });

  return Lead;
};
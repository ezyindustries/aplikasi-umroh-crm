const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupParticipant = sequelize.define('GroupParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'group_id'
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'contact_id',
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'phone_number'
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_admin'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'left_at'
  }
}, {
  tableName: 'group_participants',
  indexes: [
    { fields: ['group_id'] },
    { fields: ['contact_id'] },
    {
      unique: true,
      fields: ['group_id', 'phone_number']
    }
  ]
});

module.exports = GroupParticipant;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^\+?[1-9]\d{1,14}$/ // E.164 format
    },
    field: 'phone_number'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'profile_picture'
  },
  status: {
    type: DataTypes.ENUM('active', 'blocked', 'archived'),
    defaultValue: 'active'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_seen'
  },
  optInStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'opt_in_status'
  },
  optInDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'opt_in_date'
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'How this contact was added (manual, import, whatsapp, etc)'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'assigned_to',
    comment: 'Agent assigned to this contact'
  }
}, {
  tableName: 'contacts',
  indexes: [
    { fields: ['phone_number'] },
    { fields: ['status'] },
    { fields: ['assigned_to'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Contact;
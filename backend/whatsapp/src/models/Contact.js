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
      is: function(value) {
        // Allow E.164 format for regular contacts
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        // Allow group ID format (numbers-numbers)
        const groupRegex = /^\d+-\d+$/;
        // Allow simple group ID format
        const simpleGroupRegex = /^[a-zA-Z0-9-]+$/;
        
        if (phoneRegex.test(value) || groupRegex.test(value) || simpleGroupRegex.test(value)) {
          return true;
        }
        throw new Error('Invalid phone number format');
      }
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
  },
  // Group chat fields
  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_group'
  },
  groupId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'group_id',
    comment: 'WhatsApp group ID'
  },
  groupName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'group_name'
  },
  groupDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'group_description'
  },
  participantCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'participant_count'
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
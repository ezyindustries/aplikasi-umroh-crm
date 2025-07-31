const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'message_id',
    comment: 'WhatsApp message ID'
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Unique filename stored on disk'
  },
  originalFilename: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'original_filename',
    comment: 'Original filename from WhatsApp'
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Relative path from media directory'
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mime_type'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'File size in bytes'
  },
  downloadedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'downloaded_at'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional media metadata'
  }
}, {
  tableName: 'media',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['message_id']
    },
    {
      fields: ['filename']
    },
    {
      fields: ['downloaded_at']
    }
  ]
});

module.exports = Media;
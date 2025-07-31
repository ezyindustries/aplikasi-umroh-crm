const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MediaFile = sequelize.define('MediaFile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  messageId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'message_id',
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'file_path'
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'file_name'
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mime_type'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
    comment: 'File size in bytes'
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Image/video width in pixels'
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Image/video height in pixels'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Audio/video duration in seconds'
  },
  thumbnailPath: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'thumbnail_path'
  },
  whatsappMediaId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'whatsapp_media_id'
  },
  downloadStatus: {
    type: DataTypes.ENUM('pending', 'downloading', 'completed', 'failed'),
    defaultValue: 'pending',
    field: 'download_status'
  },
  downloadedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'downloaded_at'
  }
}, {
  tableName: 'media_files',
  indexes: [
    { fields: ['message_id'] },
    { fields: ['download_status'] }
  ]
});

module.exports = MediaFile;
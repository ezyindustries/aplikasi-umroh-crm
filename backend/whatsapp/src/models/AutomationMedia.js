const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutomationMedia = sequelize.define('AutomationMedia', {
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
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_name',
    comment: 'Original file name'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path',
    comment: 'Full file path on server'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
    comment: 'File size in bytes'
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mime_type',
    comment: 'MIME type of the file'
  },
  thumbnailPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'thumbnail_path',
    comment: 'Path to thumbnail image'
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'upload_date',
    comment: 'When the file was uploaded'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether the media is still in use'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata (dimensions, duration, etc)'
  }
}, {
  tableName: 'automation_media',
  indexes: [
    { fields: ['rule_id'] },
    { fields: ['upload_date'] },
    { fields: ['is_active'] }
  ]
});

module.exports = AutomationMedia;
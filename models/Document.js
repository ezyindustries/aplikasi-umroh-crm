const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    jamaah_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jamaah',
        key: 'id'
      }
    },
    document_type: {
      type: DataTypes.ENUM('passport', 'ktp', 'kk', 'photo', 'visa', 'other'),
      allowNull: false
    },
    document_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(500)
    },
    file_data: {
      type: DataTypes.TEXT // For base64 storage
    },
    file_size: {
      type: DataTypes.INTEGER
    },
    mime_type: {
      type: DataTypes.STRING(100)
    },
    status: {
      type: DataTypes.ENUM('uploaded', 'verified', 'rejected'),
      defaultValue: 'uploaded'
    },
    verified_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verified_at: {
      type: DataTypes.DATE
    },
    rejection_reason: {
      type: DataTypes.TEXT
    },
    notes: {
      type: DataTypes.TEXT
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'documents',
    indexes: [
      { fields: ['jamaah_id'] },
      { fields: ['document_type'] },
      { fields: ['status'] }
    ]
  });

  return Document;
};
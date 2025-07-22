const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reference_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    jamaah_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jamaah',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'transfer', 'credit_card', 'debit_card', 'virtual_account'),
      allowNull: false
    },
    bank_name: {
      type: DataTypes.STRING(100)
    },
    account_number: {
      type: DataTypes.STRING(50)
    },
    receipt_image: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
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
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'payments',
    indexes: [
      { fields: ['reference_number'], unique: true },
      { fields: ['jamaah_id'] },
      { fields: ['status'] },
      { fields: ['payment_date'] },
      { fields: ['payment_method'] }
    ]
  });

  return Payment;
};
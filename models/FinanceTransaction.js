const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FinanceTransaction = sequelize.define('FinanceTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transaction_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    transaction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    reference_type: {
      type: DataTypes.ENUM('payment', 'expense', 'manual', 'adjustment'),
      allowNull: false
    },
    reference_id: {
      type: DataTypes.UUID // Link to payment or other reference
    },
    debit_account: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id'
      }
    },
    credit_account: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chart_of_accounts',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('posted', 'pending', 'reversed'),
      defaultValue: 'posted'
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
    },
    approved_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'finance_transactions',
    indexes: [
      { fields: ['transaction_number'], unique: true },
      { fields: ['transaction_date'] },
      { fields: ['debit_account'] },
      { fields: ['credit_account'] },
      { fields: ['reference_type', 'reference_id'] },
      { fields: ['status'] }
    ]
  });

  return FinanceTransaction;
};
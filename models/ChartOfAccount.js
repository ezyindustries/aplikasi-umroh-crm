const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChartOfAccount = sequelize.define('ChartOfAccount', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    account_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    account_type: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
      allowNull: false
    },
    account_subtype: {
      type: DataTypes.STRING(100)
    },
    parent_id: {
      type: DataTypes.UUID,
      references: {
        model: 'chart_of_accounts',
        key: 'id'
      }
    },
    normal_balance: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'chart_of_accounts',
    indexes: [
      { fields: ['account_code'], unique: true },
      { fields: ['account_type'] },
      { fields: ['parent_id'] },
      { fields: ['is_active'] }
    ]
  });

  return ChartOfAccount;
};
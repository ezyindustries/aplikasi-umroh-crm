const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubGroup = sequelize.define('SubGroup', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      }
    },
    subgroup_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    max_capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    current_capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
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
    tableName: 'subgroups',
    indexes: [
      { fields: ['group_id'] },
      { fields: ['status'] }
    ]
  });

  return SubGroup;
};
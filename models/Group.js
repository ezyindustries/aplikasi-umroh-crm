const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Group = sequelize.define('Group', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    group_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    package_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'packages',
        key: 'id'
      }
    },
    departure_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    return_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'full', 'canceled', 'depart', 'arrival'),
      defaultValue: 'open'
    },
    max_capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    current_capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tour_leader: {
      type: DataTypes.STRING(100)
    },
    muthawif: {
      type: DataTypes.STRING(100)
    },
    flight_details: {
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
    tableName: 'groups',
    indexes: [
      { fields: ['package_id'] },
      { fields: ['departure_date'] },
      { fields: ['status'] },
      { fields: ['group_name'] }
    ]
  });

  return Group;
};
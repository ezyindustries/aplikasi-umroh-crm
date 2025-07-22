const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Package = sequelize.define('Package', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    departure_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    return_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quota: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    booked: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    makkah_hotel: {
      type: DataTypes.STRING(100)
    },
    madinah_hotel: {
      type: DataTypes.STRING(100)
    },
    makkah_nights: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    madinah_nights: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    airline: {
      type: DataTypes.STRING(100)
    },
    airline_code: {
      type: DataTypes.STRING(10)
    },
    flight_details: {
      type: DataTypes.JSON
    },
    facilities: {
      type: DataTypes.JSON
    },
    brochure_images: {
      type: DataTypes.JSON
    },
    description: {
      type: DataTypes.TEXT
    },
    terms_conditions: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'closed', 'cancelled'),
      defaultValue: 'draft'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    tableName: 'packages',
    indexes: [
      { fields: ['code'], unique: true },
      { fields: ['status'] },
      { fields: ['is_active'] },
      { fields: ['departure_date'] },
      { fields: ['price'] }
    ]
  });

  return Package;
};
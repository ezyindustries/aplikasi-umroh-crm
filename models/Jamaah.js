const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Jamaah = sequelize.define('Jamaah', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    nik: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
      validate: {
        len: [16, 16],
        isNumeric: true
      }
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    birth_place: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('L', 'P'),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    kabupaten: {
      type: DataTypes.STRING(100)
    },
    kecamatan: {
      type: DataTypes.STRING(100)
    },
    kelurahan: {
      type: DataTypes.STRING(100)
    },
    marital_status: {
      type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'),
      allowNull: false
    },
    education: {
      type: DataTypes.ENUM('sd', 'smp', 'sma', 'diploma', 'sarjana', 'magister', 'doktor'),
      allowNull: false
    },
    occupation: {
      type: DataTypes.STRING(100)
    },
    family_role: {
      type: DataTypes.ENUM('main', 'spouse', 'child', 'parent', 'sibling', 'relative'),
      allowNull: false,
      defaultValue: 'main'
    },
    main_family_id: {
      type: DataTypes.UUID,
      references: {
        model: 'jamaah',
        key: 'id'
      }
    },
    room_preference: {
      type: DataTypes.ENUM('quad', 'triple', 'double'),
      allowNull: false
    },
    family_room_request: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    passport_name: {
      type: DataTypes.STRING(100)
    },
    passport_number: {
      type: DataTypes.STRING(20),
      unique: true
    },
    passport_issue_city: {
      type: DataTypes.STRING(100)
    },
    passport_issue_date: {
      type: DataTypes.DATEONLY
    },
    passport_expire_date: {
      type: DataTypes.DATEONLY
    },
    passport_image: {
      type: DataTypes.TEXT
    },
    ktp_image: {
      type: DataTypes.TEXT
    },
    kk_image: {
      type: DataTypes.TEXT
    },
    photo: {
      type: DataTypes.TEXT
    },
    package_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'packages',
        key: 'id'
      }
    },
    group_id: {
      type: DataTypes.UUID,
      references: {
        model: 'groups',
        key: 'id'
      }
    },
    sub_group: {
      type: DataTypes.STRING(50)
    },
    room_number: {
      type: DataTypes.STRING(20)
    },
    room_type: {
      type: DataTypes.ENUM('quad', 'triple', 'double')
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected', 'cancelled'),
      defaultValue: 'pending'
    },
    total_paid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
      defaultValue: 'unpaid'
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
    tableName: 'jamaah',
    indexes: [
      { fields: ['nik'], unique: true },
      { fields: ['passport_number'], unique: true },
      { fields: ['package_id'] },
      { fields: ['group_id'] },
      { fields: ['status'] },
      { fields: ['payment_status'] },
      { fields: ['phone'] },
      { fields: ['family_role', 'main_family_id'] }
    ]
  });

  return Jamaah;
};
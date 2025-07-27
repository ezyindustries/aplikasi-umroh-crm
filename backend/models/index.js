const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Database configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'vauza_tamma_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 10000
  },
  dialectOptions: {
    connectTimeout: 60000,
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

const db = {};

// Define models
// User model
db.User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

// Lead model
db.Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  lead_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: DataTypes.STRING,
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: DataTypes.STRING,
  city: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'new'
  },
  interest_level: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  budget_range: DataTypes.STRING,
  estimated_departure: DataTypes.DATE,
  notes: DataTypes.TEXT,
  converted_to_jamaah_id: DataTypes.UUID,
  converted_at: DataTypes.DATE,
  assigned_to: DataTypes.UUID
}, {
  tableName: 'leads',
  timestamps: true,
  underscored: true
});

// WhatsApp Conversation model
db.WaConversation = sequelize.define('WaConversation', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  phone_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  lead_id: DataTypes.UUID,
  jamaah_id: DataTypes.UUID,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  last_message_at: DataTypes.DATE,
  last_message_preview: DataTypes.TEXT,
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  assigned_to: DataTypes.UUID,
  wa_session_id: DataTypes.STRING
}, {
  tableName: 'wa_conversations',
  timestamps: true,
  underscored: true
});

// WhatsApp Message model
db.WaMessage = sequelize.define('WaMessage', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  conversation_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'text'
  },
  content: DataTypes.TEXT,
  media_url: DataTypes.STRING,
  is_from_bot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bot_confidence: DataTypes.FLOAT,
  bot_intent: DataTypes.STRING,
  handled_by: DataTypes.UUID,
  wa_message_id: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'sent'
  },
  error_message: DataTypes.TEXT
}, {
  tableName: 'wa_messages',
  timestamps: true,
  underscored: true
});

// Bot Template model
db.BotTemplate = sequelize.define('BotTemplate', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  keywords: DataTypes.ARRAY(DataTypes.STRING),
  response_template: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variables: DataTypes.JSONB,
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: DataTypes.UUID
}, {
  tableName: 'bot_templates',
  timestamps: true,
  underscored: true
});

// Bot Config model
db.BotConfig = sequelize.define('BotConfig', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  parameter: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: DataTypes.TEXT,
  updated_by: DataTypes.UUID
}, {
  tableName: 'bot_configs',
  timestamps: true,
  underscored: true
});

// Lead Activity model
db.LeadActivity = sequelize.define('LeadActivity', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  lead_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  activity_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  performed_by: DataTypes.UUID,
  metadata: DataTypes.JSONB
}, {
  tableName: 'lead_activities',
  timestamps: true,
  underscored: true
});

// Campaign model
db.Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'broadcast'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft'
  },
  message_template_id: DataTypes.UUID,
  target_criteria: DataTypes.JSONB,
  scheduled_at: DataTypes.DATE,
  launched_at: DataTypes.DATE,
  completed_at: DataTypes.DATE,
  total_recipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  delivered_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  read_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  response_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_by: DataTypes.UUID
}, {
  tableName: 'campaigns',
  timestamps: true,
  underscored: true
});

// LeadSource model (for CRM)
db.LeadSource = sequelize.define('LeadSource', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: DataTypes.STRING,
  description: DataTypes.TEXT
}, {
  tableName: 'lead_sources',
  timestamps: true,
  underscored: true
});

// LeadTag model
db.LeadTag = sequelize.define('LeadTag', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: DataTypes.STRING
}, {
  tableName: 'lead_tags',
  timestamps: true,
  underscored: true
});

// Package model (existing)
db.Package = sequelize.define('Package', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  price: DataTypes.DECIMAL(12, 2),
  duration_days: DataTypes.INTEGER,
  tier: DataTypes.STRING,
  quota: DataTypes.INTEGER,
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'packages',
  timestamps: true,
  underscored: true
});

// Jamaah model (existing)
db.Jamaah = sequelize.define('Jamaah', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  registration_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  nik: {
    type: DataTypes.STRING(16),
    unique: true,
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  package_id: DataTypes.UUID,
  group_id: DataTypes.UUID,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'registered'
  }
}, {
  tableName: 'jamaah',
  timestamps: true,
  underscored: true
});

// MessageTemplate model (for campaigns)
db.MessageTemplate = sequelize.define('MessageTemplate', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variables: DataTypes.ARRAY(DataTypes.STRING),
  type: {
    type: DataTypes.STRING,
    defaultValue: 'text'
  }
}, {
  tableName: 'message_templates',
  timestamps: true,
  underscored: true
});

// Define associations
db.Lead.belongsTo(db.User, { as: 'assignedUser', foreignKey: 'assigned_to' });
db.Lead.belongsTo(db.Package, { as: 'interestedPackage', foreignKey: 'interested_package_id' });
db.Lead.belongsTo(db.LeadSource, { as: 'source', foreignKey: 'source_id' });
db.Lead.belongsToMany(db.LeadTag, { as: 'tags', through: 'lead_tag_mappings' });
db.Lead.hasMany(db.LeadActivity, { as: 'activities', foreignKey: 'lead_id' });

db.WaConversation.belongsTo(db.Lead, { as: 'lead', foreignKey: 'lead_id' });
db.WaConversation.belongsTo(db.Jamaah, { as: 'jamaah', foreignKey: 'jamaah_id' });
db.WaConversation.hasMany(db.WaMessage, { as: 'messages', foreignKey: 'conversation_id' });

db.WaMessage.belongsTo(db.WaConversation, { as: 'conversation', foreignKey: 'conversation_id' });
db.WaMessage.belongsTo(db.User, { as: 'handler', foreignKey: 'handled_by' });

db.Campaign.belongsTo(db.MessageTemplate, { as: 'template', foreignKey: 'message_template_id' });
db.Campaign.belongsTo(db.User, { as: 'creator', foreignKey: 'created_by' });

// Add instance methods
db.Lead.prototype.addActivity = async function(type, description, userId, metadata = {}) {
  return await db.LeadActivity.create({
    lead_id: this.id,
    activity_type: type,
    description,
    performed_by: userId,
    metadata
  });
};

db.WaConversation.prototype.addMessage = async function(messageData) {
  const message = await db.WaMessage.create({
    conversation_id: this.id,
    ...messageData
  });
  
  await this.update({
    last_message_at: new Date(),
    last_message_preview: messageData.content?.substring(0, 100)
  });
  
  return message;
};

// Static method for WaConversation
db.WaConversation.getOrCreateForPhone = async function(phoneNumber) {
  const [conversation, created] = await this.findOrCreate({
    where: { phone_number: phoneNumber },
    defaults: {
      phone_number: phoneNumber,
      status: 'active',
      last_message_at: new Date()
    }
  });
  
  return conversation;
};

// Export everything
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Add Op for queries
const Op = Sequelize.Op;
db.Op = Op;

module.exports = db;
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vauza_tamma_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+07:00', // Jakarta timezone
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig);

// Import models
const User = require('../models/User')(sequelize);
const Jamaah = require('../models/Jamaah')(sequelize);
const Package = require('../models/Package')(sequelize);
const Payment = require('../models/Payment')(sequelize);
const Group = require('../models/Group')(sequelize);
const SubGroup = require('../models/SubGroup')(sequelize);
const Document = require('../models/Document')(sequelize);
const FinanceTransaction = require('../models/FinanceTransaction')(sequelize);
const ChartOfAccount = require('../models/ChartOfAccount')(sequelize);
const Lead = require('../models/Lead')(sequelize);
const Campaign = require('../models/Campaign')(sequelize);
const AutomationRule = require('../models/AutomationRule')(sequelize);
const MessageTemplate = require('../models/MessageTemplate')(sequelize);
const MessageQueue = require('../models/MessageQueue')(sequelize);

// Define associations
const models = {
  User,
  Jamaah,
  Package,
  Payment,
  Group,
  SubGroup,
  Document,
  FinanceTransaction,
  ChartOfAccount,
  Lead,
  Campaign,
  AutomationRule,
  MessageTemplate,
  MessageQueue
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Jamaah - Package relationship
Jamaah.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });
Package.hasMany(Jamaah, { foreignKey: 'package_id', as: 'jamaah' });

// Jamaah - Group relationship
Jamaah.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
Group.hasMany(Jamaah, { foreignKey: 'group_id', as: 'jamaah' });

// Payment - Jamaah relationship
Payment.belongsTo(Jamaah, { foreignKey: 'jamaah_id', as: 'jamaah' });
Jamaah.hasMany(Payment, { foreignKey: 'jamaah_id', as: 'payments' });

// Document - Jamaah relationship
Document.belongsTo(Jamaah, { foreignKey: 'jamaah_id', as: 'jamaah' });
Jamaah.hasMany(Document, { foreignKey: 'jamaah_id', as: 'documents' });

// Group - Package relationship
Group.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });
Package.hasMany(Group, { foreignKey: 'package_id', as: 'groups' });

// SubGroup - Group relationship
SubGroup.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
Group.hasMany(SubGroup, { foreignKey: 'group_id', as: 'subgroups' });

// Jamaah - SubGroup relationship
Jamaah.belongsTo(SubGroup, { foreignKey: 'subgroup_id', as: 'subgroup' });
SubGroup.hasMany(Jamaah, { foreignKey: 'subgroup_id', as: 'jamaah' });

// Finance - ChartOfAccount relationship
FinanceTransaction.belongsTo(ChartOfAccount, { foreignKey: 'debit_account', as: 'debitAccount' });
FinanceTransaction.belongsTo(ChartOfAccount, { foreignKey: 'credit_account', as: 'creditAccount' });

// Lead - Campaign relationship
Lead.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });
Campaign.hasMany(Lead, { foreignKey: 'campaign_id', as: 'leads' });

// Lead - Jamaah relationship (conversion)
Lead.belongsTo(Jamaah, { foreignKey: 'jamaah_id', as: 'jamaah' });
Jamaah.hasOne(Lead, { foreignKey: 'jamaah_id', as: 'lead' });

// AutomationRule - MessageTemplate relationship
AutomationRule.belongsTo(MessageTemplate, { foreignKey: 'message_template_id', as: 'template' });
MessageTemplate.hasMany(AutomationRule, { foreignKey: 'message_template_id', as: 'rules' });

// MessageQueue relationships
MessageQueue.belongsTo(AutomationRule, { foreignKey: 'automation_rule_id', as: 'rule' });
AutomationRule.hasMany(MessageQueue, { foreignKey: 'automation_rule_id', as: 'queueItems' });

MessageQueue.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Lead.hasMany(MessageQueue, { foreignKey: 'lead_id', as: 'messages' });

MessageQueue.belongsTo(Jamaah, { foreignKey: 'jamaah_id', as: 'jamaah' });
Jamaah.hasMany(MessageQueue, { foreignKey: 'jamaah_id', as: 'messages' });

MessageQueue.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });
Campaign.hasMany(MessageQueue, { foreignKey: 'campaign_id', as: 'messages' });

module.exports = {
  sequelize,
  models
};
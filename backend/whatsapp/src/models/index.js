const sequelize = require('../config/database');
const Contact = require('./Contact');
const Conversation = require('./Conversation');
const Message = require('./Message');
const WhatsAppSession = require('./WhatsAppSession');
const ConversationSession = require('./ConversationSession');
const MessageTemplate = require('./MessageTemplate');
const GroupParticipant = require('./GroupParticipant');
const MediaFile = require('./MediaFile');
const AutomationRule = require('./AutomationRule');
const AutomationLog = require('./AutomationLog');
const AutomationContactLimit = require('./AutomationContactLimit');
const CustomerPhase = require('./CustomerPhase');
const AutomationTemplate = require('./AutomationTemplate');
const AutomationAnalytics = require('./AutomationAnalytics');
const AutomationMedia = require('./AutomationMedia');
const AutomationSchedule = require('./AutomationSchedule');
const WorkflowTemplate = require('./WorkflowTemplate');
const WorkflowStep = require('./WorkflowStep');
const WorkflowSession = require('./WorkflowSession');
const WorkflowVariable = require('./WorkflowVariable');
const CustomTemplate = require('./CustomTemplate');

// Define associations
Contact.hasMany(Conversation, { foreignKey: 'contact_id', as: 'conversations' });
Conversation.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

Conversation.hasMany(ConversationSession, { foreignKey: 'conversation_id', as: 'sessions' });
ConversationSession.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

// Group associations
Contact.hasMany(GroupParticipant, { foreignKey: 'contact_id', as: 'groupParticipations' });
GroupParticipant.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

// Media associations
Message.hasMany(MediaFile, { foreignKey: 'message_id', as: 'mediaFiles' });
MediaFile.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

// Automation associations
AutomationRule.hasMany(AutomationLog, { foreignKey: 'rule_id', as: 'logs' });
AutomationLog.belongsTo(AutomationRule, { foreignKey: 'rule_id', as: 'rule' });

AutomationLog.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
AutomationLog.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
AutomationLog.belongsTo(Message, { foreignKey: 'message_id', as: 'triggerMessage' });

AutomationRule.hasMany(AutomationContactLimit, { foreignKey: 'rule_id', as: 'contactLimits' });
AutomationContactLimit.belongsTo(AutomationRule, { foreignKey: 'rule_id', as: 'rule' });
AutomationContactLimit.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

// Customer Phase associations
Contact.hasOne(CustomerPhase, { foreignKey: 'contact_id', as: 'phase' });
CustomerPhase.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
CustomerPhase.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

// Automation Template associations
AutomationRule.belongsTo(AutomationTemplate, { foreignKey: 'template_id', as: 'template' });
AutomationTemplate.hasMany(AutomationRule, { foreignKey: 'template_id', as: 'rules' });

// Automation Analytics associations
AutomationRule.hasMany(AutomationAnalytics, { foreignKey: 'rule_id', as: 'analytics' });
AutomationAnalytics.belongsTo(AutomationRule, { foreignKey: 'rule_id', as: 'rule' });

// Automation Media associations
AutomationRule.hasMany(AutomationMedia, { foreignKey: 'rule_id', as: 'media' });
AutomationMedia.belongsTo(AutomationRule, { foreignKey: 'rule_id', as: 'rule' });

// Automation Schedule associations
AutomationRule.hasOne(AutomationSchedule, { foreignKey: 'rule_id', as: 'automationSchedule' });
AutomationSchedule.belongsTo(AutomationRule, { foreignKey: 'rule_id', as: 'rule' });

// Workflow associations
AutomationRule.hasOne(WorkflowTemplate, { foreignKey: 'rule_id', as: 'workflowTemplate' });
WorkflowTemplate.belongsTo(AutomationRule, { foreignKey: 'rule_id', as: 'rule' });

WorkflowTemplate.hasMany(WorkflowStep, { foreignKey: 'workflow_id', as: 'steps' });
WorkflowStep.belongsTo(WorkflowTemplate, { foreignKey: 'workflow_id', as: 'workflow' });

WorkflowTemplate.hasMany(WorkflowSession, { foreignKey: 'workflow_id', as: 'sessions' });
WorkflowSession.belongsTo(WorkflowTemplate, { foreignKey: 'workflow_id', as: 'workflow' });

WorkflowSession.hasMany(WorkflowVariable, { foreignKey: 'session_id', as: 'variables' });
WorkflowVariable.belongsTo(WorkflowSession, { foreignKey: 'session_id', as: 'session' });

// Sync models with database
const initDatabase = async () => {
  try {
    // In production, use migrations instead of sync
    if (process.env.NODE_ENV !== 'production') {
      // Use force: false to avoid dropping tables
      await sequelize.sync({ force: false });
      console.log('Database models synchronized successfully.');
    }
  } catch (error) {
    console.error('Error synchronizing database:', error);
    // If sync fails, try to continue anyway
    console.log('Continuing despite sync error...');
  }
};

module.exports = {
  sequelize,
  Contact,
  Conversation,
  Message,
  WhatsAppSession,
  ConversationSession,
  MessageTemplate,
  GroupParticipant,
  MediaFile,
  AutomationRule,
  AutomationLog,
  AutomationContactLimit,
  CustomerPhase,
  AutomationTemplate,
  AutomationAnalytics,
  AutomationMedia,
  AutomationSchedule,
  WorkflowTemplate,
  WorkflowStep,
  WorkflowSession,
  WorkflowVariable,
  CustomTemplate,
  initDatabase
};
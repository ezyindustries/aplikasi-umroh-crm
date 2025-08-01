const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerPhase = sequelize.define('CustomerPhase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'contact_id',
    references: {
      model: 'contacts',
      key: 'id'
    },
    comment: 'Reference to the contact'
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'conversation_id',
    references: {
      model: 'conversations',
      key: 'id'
    },
    comment: 'Reference to the conversation'
  },
  currentPhase: {
    type: DataTypes.ENUM('LEADS', 'INTEREST', 'CLOSING'),
    allowNull: false,
    field: 'current_phase',
    defaultValue: 'LEADS',
    comment: 'Current phase in the customer journey'
  },
  previousPhase: {
    type: DataTypes.ENUM('LEADS', 'INTEREST', 'CLOSING'),
    allowNull: true,
    field: 'previous_phase',
    comment: 'Previous phase for tracking progression'
  },
  phaseEnteredAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'phase_entered_at',
    defaultValue: DataTypes.NOW,
    comment: 'When the contact entered current phase'
  },
  phaseSource: {
    type: DataTypes.ENUM('instagram', 'facebook', 'whatsapp', 'referral', 'direct', 'other'),
    allowNull: true,
    field: 'phase_source',
    comment: 'How the contact entered the pipeline'
  },
  // Customer interests and preferences
  interestedPackages: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'interested_packages',
    comment: 'Package codes or types customer showed interest in'
  },
  budget: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Customer budget range (e.g., "25-30jt")'
  },
  preferredMonth: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'preferred_month',
    comment: 'Preferred departure month'
  },
  partySize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'party_size',
    comment: 'Number of travelers (pax)'
  },
  departureCity: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'departure_city',
    comment: 'Preferred departure city'
  },
  concerns: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of customer concerns or objections'
  },
  // Payment and booking information (for CLOSING phase)
  paymentStatus: {
    type: DataTypes.ENUM('none', 'dp_pending', 'dp_received', 'partial', 'full'),
    defaultValue: 'none',
    field: 'payment_status',
    comment: 'Payment status'
  },
  dpAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'dp_amount',
    comment: 'Down payment amount received'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'total_amount',
    comment: 'Total package amount'
  },
  paymentDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'payment_deadline',
    comment: 'Final payment deadline'
  },
  documentsReceived: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'documents_received',
    comment: 'Array of documents received (passport, ktp, etc)'
  },
  bookingConfirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'booking_confirmed',
    comment: 'Whether booking is confirmed'
  },
  // Interaction tracking
  lastInteractionAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_interaction_at',
    comment: 'Last interaction timestamp'
  },
  interactionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'interaction_count',
    comment: 'Number of interactions in current phase'
  },
  responseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'response_count',
    comment: 'Number of responses sent in current phase'
  },
  // Automation tracking
  lastAutomationRuleId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'last_automation_rule_id',
    comment: 'Last automation rule that was triggered'
  },
  automationPaused: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'automation_paused',
    comment: 'Whether automation is paused for this contact'
  },
  // Conversion tracking
  convertedToNextPhase: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'converted_to_next_phase',
    comment: 'Whether contact successfully moved to next phase'
  },
  conversionTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'conversion_time',
    comment: 'Time spent in phase before converting (minutes)'
  },
  dropoutReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'dropout_reason',
    comment: 'Reason if contact dropped out'
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional phase-specific data'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin notes about this contact'
  }
}, {
  tableName: 'customer_phases',
  indexes: [
    { fields: ['contact_id'] },
    { fields: ['conversation_id'] },
    { fields: ['current_phase'] },
    { fields: ['phase_entered_at'] },
    { fields: ['last_interaction_at'] },
    { fields: ['payment_status'] },
    { fields: ['phase_source'] }
  ]
});

// Instance methods
CustomerPhase.prototype.moveToNextPhase = async function() {
  const phaseProgression = {
    'LEADS': 'INTEREST',
    'INTEREST': 'CLOSING',
    'CLOSING': null // No next phase
  };
  
  const nextPhase = phaseProgression[this.currentPhase];
  if (!nextPhase) {
    throw new Error('Already in final phase');
  }
  
  // Calculate time spent in current phase
  const timeSpentMinutes = Math.floor((new Date() - this.phase_entered_at) / (1000 * 60));
  
  // Update phase
  await this.update({
    previousPhase: this.currentPhase,
    currentPhase: nextPhase,
    phaseEnteredAt: new Date(),
    convertedToNextPhase: true,
    conversionTime: timeSpentMinutes,
    interactionCount: 0, // Reset for new phase
    responseCount: 0
  });
  
  return this;
};

CustomerPhase.prototype.addInteraction = async function(automationRuleId = null) {
  await this.update({
    lastInteractionAt: new Date(),
    interactionCount: this.interactionCount + 1,
    lastAutomationRuleId: automationRuleId
  });
  
  return this;
};

CustomerPhase.prototype.addResponse = async function() {
  await this.update({
    responseCount: this.responseCount + 1
  });
  
  return this;
};

module.exports = CustomerPhase;
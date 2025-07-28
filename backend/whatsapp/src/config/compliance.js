// WhatsApp Business API Compliance Configuration
module.exports = {
  // Message Rate Limits per Tier
  rateLimits: {
    tier1: {
      businessInitiated: 1000, // per day
      uniqueUsers: 1000, // per day
      messagesPerSecond: 80, // messages per second
      messagesPerUser: 30 // per user per day
    },
    tier2: {
      businessInitiated: 10000,
      uniqueUsers: 10000,
      messagesPerSecond: 80,
      messagesPerUser: 30
    },
    tier3: {
      businessInitiated: 100000,
      uniqueUsers: 100000,
      messagesPerSecond: 80,
      messagesPerUser: 30
    },
    tier4: {
      businessInitiated: 'unlimited',
      uniqueUsers: 'unlimited',
      messagesPerSecond: 1000,
      messagesPerUser: 'unlimited'
    }
  },

  // Conversation Window Rules
  conversationWindow: {
    customerServiceWindow: 24, // hours
    templateRequired: true, // outside window
    freeFormAllowed: true // inside window
  },

  // Contact Management Rules
  contacts: {
    requireOptIn: true, // Contacts must opt-in
    optInMethods: ['message', 'api', 'import'],
    autoSyncAllowed: false, // Don't auto-sync all contacts
    syncOnlyWithConversation: true // Only sync contacts who message you
  },

  // Message Types
  messageTypes: {
    customerInitiated: {
      rateLimit: false,
      templateRequired: false,
      window: 'unlimited'
    },
    businessInitiated: {
      rateLimit: true,
      templateRequired: true, // outside 24h window
      window: '24hours'
    }
  },

  // Data Retention
  dataRetention: {
    messages: 90, // days
    conversations: 365, // days
    contacts: 'unlimited',
    media: 30 // days
  },

  // Privacy Rules
  privacy: {
    encryptionRequired: true,
    personalDataMinimization: true,
    explicitConsent: true,
    rightToDelete: true,
    dataPortability: true
  },

  // Prohibited Use Cases
  prohibited: {
    spam: true,
    phishing: true,
    malware: true,
    harassment: true,
    illegalContent: true,
    automatedCalls: true,
    excessiveMarketing: true
  },

  // Business Verification Requirements
  businessVerification: {
    required: true,
    documents: ['business_license', 'tax_id', 'bank_statement'],
    displayName: true,
    category: true,
    description: true,
    website: true,
    email: true,
    address: true
  },

  // Template Message Rules
  templates: {
    approvalRequired: true,
    languages: ['en', 'id'], // English, Indonesian
    categories: [
      'ACCOUNT_UPDATE',
      'PAYMENT_UPDATE', 
      'PERSONAL_FINANCE_UPDATE',
      'SHIPPING_UPDATE',
      'RESERVATION_UPDATE',
      'ISSUE_RESOLUTION',
      'APPOINTMENT_UPDATE',
      'TRANSPORTATION_UPDATE',
      'TICKET_UPDATE',
      'ALERT_UPDATE',
      'AUTO_REPLY'
    ],
    reviewTime: '24hours'
  },

  // Opt-in/Opt-out Rules
  optIn: {
    required: true,
    methods: {
      website: true,
      whatsapp: true,
      sms: true,
      ivr: true,
      inPerson: true
    },
    documentation: true,
    timestamp: true
  },

  // Quality Rating Protection
  qualityRating: {
    monitorBlocking: true,
    monitorReporting: true,
    warningThreshold: 'MEDIUM',
    actionThreshold: 'LOW',
    factors: [
      'response_time',
      'block_rate', 
      'report_rate',
      'message_quality'
    ]
  }
};
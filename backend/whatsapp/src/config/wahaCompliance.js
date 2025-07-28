// WAHA (WhatsApp Web) Compliance Configuration
// PENTING: WAHA bukan API resmi WhatsApp, risiko banned lebih tinggi

module.exports = {
  // WAHA Specific Limitations
  wahaLimitations: {
    isOfficialAPI: false,
    disclaimer: 'WAHA tidak berafiliasi dengan WhatsApp. Risiko banned ada.',
    requiresPhoneConnected: true, // Phone harus online
    noVoiceVideoCalls: true, // Tidak support voice/video calls
    sessionCanExpire: true, // Session bisa expired kapan saja
  },

  // WhatsApp Web Anti-Ban Rules
  antiBanRules: {
    // Message Sending Limits
    messaging: {
      maxContactsPerDay: 50, // Sangat konservatif untuk safety
      maxMessagesPerContact: 5, // Per hari
      delayBetweenMessages: 5000, // 5 detik minimum
      randomDelayRange: [3000, 8000], // Random 3-8 detik
      maxBulkRecipients: 5, // Max kirim ke 5 orang sekaligus
      cooldownAfterBulk: 60000, // 1 menit cooldown
    },

    // New Number Warming
    newNumberWarming: {
      enabled: true,
      days: 14, // 2 minggu warming period
      limits: {
        day1to3: { contacts: 5, messages: 10 },
        day4to7: { contacts: 10, messages: 20 },
        day8to14: { contacts: 20, messages: 40 },
        afterDay14: { contacts: 50, messages: 100 }
      }
    },

    // Activity Patterns (Mimic Human Behavior)
    humanBehavior: {
      activeHours: {
        start: 0, // 24/7 operation
        end: 24, // 24/7 operation
        timezone: 'Asia/Jakarta'
      },
      typingDelay: true, // Simulate typing
      readDelay: [1000, 3000], // Read message 1-3 detik
      onlinePresence: true, // Show online status
      maxSessionHours: 24, // 24 jam per hari
    },

    // Content Rules
    contentRules: {
      prohibitedWords: [
        'gratis', 'menang', 'hadiah', 'promo gila',
        'click here', 'klik disini', 'urgent',
        'bitcoin', 'crypto', 'forex', 'trading',
        'judi', 'togel', 'slot', 'casino'
      ],
      maxMessageLength: 1000, // Characters
      maxMediaSize: 16 * 1024 * 1024, // 16MB
      allowedMediaTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxUrlsPerMessage: 1, // Max 1 URL per message
      requirePersonalization: true, // Harus ada nama
    },

    // Contact Management
    contacts: {
      requireMutualContact: true, // Hanya yang save nomor kita
      requirePriorConversation: true, // Harus ada chat sebelumnya
      respectBlockedStatus: true,
      checkLastInteraction: 30, // Days - jangan message yang >30 hari tidak aktif
    }
  },

  // Session Management
  sessionManagement: {
    maxConcurrentSessions: 1, // WAHA best practice
    sessionTimeout: 3600000, // 1 hour idle timeout
    autoReconnect: true,
    maxReconnectAttempts: 3,
    reconnectDelay: 30000, // 30 seconds
    healthCheckInterval: 60000, // 1 minute
  },

  // Quality Monitoring
  qualityMonitoring: {
    trackMetrics: {
      messagesSent: true,
      messagesDelivered: true,
      messagesRead: true,
      blockedCount: true,
      reportedCount: true,
      failedMessages: true,
    },
    
    // Thresholds for alerts
    alertThresholds: {
      blockRate: 0.05, // 5% block rate
      failureRate: 0.1, // 10% failure rate
      undeliveredRate: 0.2, // 20% undelivered
    },

    // Auto-pause if threshold reached
    autoPause: {
      enabled: true,
      pauseDuration: 86400000, // 24 hours
      notifyAdmin: true,
    }
  },

  // Compliance Actions
  complianceActions: {
    // Pre-send checks
    preSendChecks: [
      'checkUserOptIn',
      'checkMessageContent',
      'checkRateLimit',
      'checkRecipientStatus',
      'checkTimeWindow',
      'checkSessionHealth'
    ],

    // Post-send actions
    postSendActions: [
      'logMessage',
      'updateMetrics',
      'checkDeliveryStatus',
      'updateContactActivity'
    ],

    // Daily maintenance
    dailyMaintenance: [
      'cleanupOldSessions',
      'analyzeMetrics',
      'generateComplianceReport',
      'checkAccountHealth'
    ]
  },

  // Emergency Procedures
  emergencyProcedures: {
    onHighBlockRate: {
      action: 'PAUSE_ALL_SENDING',
      duration: 86400000, // 24 hours
      notify: ['admin@email.com'],
      review: true
    },
    
    onSessionBanned: {
      action: 'STOP_SESSION',
      preventReconnect: true,
      quarantineDuration: 604800000, // 7 days
      requireManualReview: true
    },

    onAbnormalActivity: {
      action: 'REDUCE_LIMITS',
      reductionFactor: 0.5, // Reduce limits by 50%
      monitoringPeriod: 259200000, // 3 days
    }
  },

  // Best Practices Reminders
  bestPractices: [
    'SELALU minta consent eksplisit sebelum kirim pesan',
    'JANGAN kirim pesan promosi tanpa diminta',
    'GUNAKAN nama personal di setiap pesan',
    'TUNGGU minimal 5 detik antar pesan',
    'HINDARI kirim pesan di luar jam kerja',
    'MONITOR block rate dan delivery rate',
    'BACKUP session data secara regular',
    'SIAPKAN nomor backup jika banned',
    'DOKUMENTASI semua opt-in/opt-out',
    'TRAINING staff tentang compliance'
  ]
};
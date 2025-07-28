# WhatsApp Business Compliance & Security Guide

## 🚨 PENTING: Aturan WhatsApp Business yang WAJIB Dipatuhi

### 1. Rate Limits (Batas Pengiriman Pesan)

#### Per Nomor:
- **Pesan ke Kontak Baru**: Max 20 conversations/hari untuk nomor baru
- **Pesan Follow-up**: Unlimited dalam 24-hour window setelah customer reply
- **Business-Initiated**: Harus pakai template yang approved (untuk skala besar)

#### Timing Rules:
- **Minimum Gap**: 1-2 detik antar pesan ke nomor berbeda
- **Bulk Messages**: Max 100 pesan per batch dengan delay
- **Daily Limit**: Tergantung tier (Tier 1: 1K/day, Tier 2: 10K/day, dst)

### 2. Content Policy (Yang DILARANG)

❌ **Strictly Prohibited:**
- Spam atau pesan massal tanpa consent
- Konten ilegal, penipuan, atau menyesatkan
- Automated messages tanpa konteks
- Harvesting phone numbers
- Selling atau sharing data pengguna
- Impersonation (menyamar sebagai orang lain)

✅ **Best Practices:**
- Hanya kirim ke yang opt-in
- Provide clear opt-out mechanism
- Respect user privacy
- Keep messages relevant and timely
- Use templates for broadcast

### 3. Technical Compliance

#### Message Types:
1. **Session Messages** (Free)
   - Customer-initiated conversations
   - 24-hour window untuk reply
   - No template required

2. **Template Messages** (Paid)
   - Business-initiated after 24 hours
   - Must be pre-approved
   - Used for notifications

#### Quality Rating:
- WhatsApp tracks quality rating based on:
  - User blocks
  - User reports
  - Message read rates
- Low quality = reduced messaging limits

### 4. Security Best Practices

#### Data Protection:
- Encrypt sensitive data
- Don't store messages longer than necessary
- Implement access controls
- Regular security audits

#### API Security:
- Secure API keys
- Use environment variables
- Implement request signing
- Monitor for unusual activity

## 🛡️ Implementasi Rate Limiting di Sistem

### 1. Message Queue System
```javascript
// Implementasi queue dengan delay
class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.messagesSent = new Map(); // Track per number
  }

  async add(phoneNumber, message) {
    // Check daily limit per number
    const today = new Date().toDateString();
    const key = `${phoneNumber}-${today}`;
    const count = this.messagesSent.get(key) || 0;
    
    if (count >= 20 && !this.isExistingContact(phoneNumber)) {
      throw new Error('Daily limit reached for new contact');
    }

    this.queue.push({ phoneNumber, message, timestamp: Date.now() });
    this.process();
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const msg = this.queue.shift();
      
      // Enforce minimum delay
      await this.delay(1500); // 1.5 seconds between messages
      
      try {
        await this.sendMessage(msg);
        this.trackMessage(msg.phoneNumber);
      } catch (error) {
        // Handle errors, maybe retry
        console.error('Failed to send:', error);
      }
    }
    
    this.processing = false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Rate Limiter Middleware
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Per-user rate limiting
const messageLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:message:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute per user
  message: 'Too many messages, please slow down',
  keyGenerator: (req) => req.user.id + ':' + req.body.phoneNumber
});

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 total messages per minute
  message: 'System busy, please try again later'
});
```

### 3. Anti-Spam Detection
```javascript
class AntiSpam {
  static async checkMessage(content, phoneNumber) {
    // Check for spam patterns
    const spamPatterns = [
      /viagra|cialis/i,
      /click here now/i,
      /congratulations you won/i,
      /limited time offer/i
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        throw new Error('Message blocked: Spam detected');
      }
    }

    // Check message frequency
    const recentMessages = await this.getRecentMessages(phoneNumber);
    if (recentMessages.length > 5) {
      const lastMessage = recentMessages[0];
      if (lastMessage.content === content) {
        throw new Error('Duplicate message detected');
      }
    }

    // Check for URL shorteners (often used in spam)
    const urlShorteners = ['bit.ly', 'tinyurl.com', 'goo.gl'];
    for (const shortener of urlShorteners) {
      if (content.includes(shortener)) {
        throw new Error('URL shorteners not allowed');
      }
    }

    return true;
  }
}
```

### 4. Consent Management
```javascript
// Database schema for consent
CREATE TABLE consent_records (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  opt_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opt_in_method VARCHAR(50), -- 'website', 'whatsapp', 'form'
  opt_out_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'opted_out', 'blocked'
  consent_text TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Check consent before sending
async function checkConsent(phoneNumber) {
  const consent = await db.query(
    'SELECT * FROM consent_records WHERE phone_number = $1 AND status = $2',
    [phoneNumber, 'active']
  );
  
  if (!consent.rows.length) {
    throw new Error('No active consent for this number');
  }
  
  return consent.rows[0];
}
```

### 5. Message Scheduling
```javascript
// Respect timezone and business hours
class MessageScheduler {
  static async scheduleMessage(phoneNumber, message, timezone = 'Asia/Jakarta') {
    const now = moment().tz(timezone);
    const hour = now.hour();
    
    // Business hours: 8 AM - 8 PM
    if (hour < 8 || hour >= 20) {
      // Schedule for next business day at 9 AM
      const scheduledTime = now.add(1, 'day').hour(9).minute(0);
      
      await db.query(
        'INSERT INTO scheduled_messages (phone_number, message, scheduled_at) VALUES ($1, $2, $3)',
        [phoneNumber, message, scheduledTime.toDate()]
      );
      
      return { scheduled: true, time: scheduledTime };
    }
    
    // Send immediately during business hours
    return { scheduled: false };
  }
}
```

## 🔒 Security Implementation Checklist

### Backend Security:
- [ ] Implement rate limiting per user
- [ ] Add message queue with delays
- [ ] Create anti-spam filters
- [ ] Log all message activities
- [ ] Monitor for unusual patterns
- [ ] Implement consent management
- [ ] Add message scheduling
- [ ] Create abuse reporting system

### Frontend Security:
- [ ] Limit bulk operations UI
- [ ] Add confirmation for mass messages
- [ ] Show rate limit warnings
- [ ] Implement CAPTCHA for bulk actions
- [ ] Display consent status
- [ ] Add opt-out handling

### Monitoring & Alerts:
- [ ] Track message success/failure rates
- [ ] Monitor block rates
- [ ] Alert on quality rating drops
- [ ] Daily/hourly limit tracking
- [ ] Abuse pattern detection

## 📊 Recommended Limits for Our System

### Safe Operating Limits:
1. **New Conversations**: Max 15/day per number (75% of limit)
2. **Message Frequency**: 1 message per 2 seconds
3. **Bulk Campaigns**: Max 50 recipients per batch
4. **Daily Total**: 500 messages/day initially
5. **Per User Limit**: 20 messages/hour

### Progressive Scaling:
- Week 1-2: 100 messages/day
- Week 3-4: 250 messages/day  
- Month 2: 500 messages/day
- Month 3+: Based on quality rating

## ⚠️ Warning Signs to Monitor

1. **High Block Rate**: > 5% users blocking
2. **Low Read Rate**: < 70% messages read
3. **Spam Reports**: Any spam reports
4. **Failed Deliveries**: > 10% failure rate
5. **API Errors**: Rate limit responses

## 🚀 Implementation Priority

1. **Immediate** (Must have):
   - Basic rate limiting
   - Message queue with delays
   - Consent checking

2. **Short-term** (1 week):
   - Anti-spam filters
   - Monitoring dashboard
   - Scheduling system

3. **Long-term** (1 month):
   - Advanced analytics
   - ML-based spam detection
   - Automated quality management

## 📝 Legal Compliance

### Required Documentation:
1. Privacy Policy mentioning WhatsApp
2. Terms of Service
3. Opt-in/Opt-out procedures
4. Data retention policy
5. User consent records

### User Rights:
- Right to opt-out anytime
- Right to data deletion
- Right to access their data
- Right to report abuse

Remember: **Better safe than banned!** Always err on the side of caution when implementing WhatsApp messaging features.
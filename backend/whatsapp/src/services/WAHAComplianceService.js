const { Contact, Message, WhatsAppSession } = require('../models');
const wahaCompliance = require('../config/wahaCompliance');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class WAHAComplianceService {
  constructor() {
    this.sessionStartTime = new Date();
    this.dailyMetrics = {
      messagesSent: 0,
      uniqueContacts: new Set(),
      blockedCount: 0,
      failedCount: 0
    };
  }

  // Main compliance check before sending any message
  async checkCompliance(phoneNumber, messageContent, sessionName = 'default') {
    const checks = {
      passed: true,
      reasons: [],
      warnings: []
    };

    try {
      // 1. Check session health
      const sessionCheck = await this.checkSessionHealth(sessionName);
      if (!sessionCheck.healthy) {
        checks.passed = false;
        checks.reasons.push(sessionCheck.reason);
        return checks;
      }

      // 2. Check active hours
      if (!this.isWithinActiveHours()) {
        checks.passed = false;
        checks.reasons.push('Outside active hours (8AM-9PM)');
        return checks;
      }

      // 3. Check rate limits
      const rateCheck = await this.checkRateLimits(phoneNumber);
      if (!rateCheck.allowed) {
        checks.passed = false;
        checks.reasons.push(rateCheck.reason);
        return checks;
      }

      // 4. Check content compliance
      const contentCheck = this.checkContentCompliance(messageContent);
      if (!contentCheck.compliant) {
        checks.passed = false;
        checks.reasons.push(contentCheck.reason);
        return checks;
      }

      // 5. Check contact status
      const contactCheck = await this.checkContactStatus(phoneNumber);
      if (!contactCheck.allowed) {
        checks.passed = false;
        checks.reasons.push(contactCheck.reason);
        return checks;
      }

      // 6. Check warming period
      const warmingCheck = await this.checkWarmingPeriod();
      if (!warmingCheck.allowed) {
        checks.warnings.push(warmingCheck.warning);
      }

      return checks;
    } catch (error) {
      logger.error('WAHA Compliance check error:', error);
      checks.passed = false;
      checks.reasons.push('Compliance check failed');
      return checks;
    }
  }

  // Check if within active hours
  isWithinActiveHours() {
    const rules = wahaCompliance.antiBanRules.humanBehavior.activeHours;
    const now = new Date();
    const hour = now.getHours();
    
    return hour >= rules.start && hour <= rules.end;
  }

  // Check session health
  async checkSessionHealth(sessionName) {
    try {
      const session = await WhatsAppSession.findOne({
        where: { sessionName }
      });

      if (!session || session.status !== 'connected') {
        return { healthy: false, reason: 'Session not connected' };
      }

      // Check session duration
      const sessionHours = (Date.now() - new Date(session.connectedAt)) / (1000 * 60 * 60);
      if (sessionHours > wahaCompliance.antiBanRules.humanBehavior.maxSessionHours) {
        return { healthy: false, reason: 'Session active too long, needs rest' };
      }

      // Check metrics
      const metrics = await this.getSessionMetrics(sessionName);
      if (metrics.blockRate > wahaCompliance.qualityMonitoring.alertThresholds.blockRate) {
        return { healthy: false, reason: 'High block rate detected' };
      }

      return { healthy: true };
    } catch (error) {
      logger.error('Session health check error:', error);
      return { healthy: false, reason: 'Health check failed' };
    }
  }

  // Check rate limits
  async checkRateLimits(phoneNumber) {
    const limits = wahaCompliance.antiBanRules.messaging;
    
    // Check daily unique contacts
    if (this.dailyMetrics.uniqueContacts.size >= limits.maxContactsPerDay) {
      return { allowed: false, reason: `Daily contact limit reached (${limits.maxContactsPerDay})` };
    }

    // Check messages per contact
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const messageCount = await Message.count({
      where: {
        phoneNumber,
        direction: 'outbound',
        createdAt: { [Op.gte]: today }
      }
    });

    if (messageCount >= limits.maxMessagesPerContact) {
      return { allowed: false, reason: `Daily message limit per contact reached (${limits.maxMessagesPerContact})` };
    }

    // Check last message timing
    const lastMessage = await Message.findOne({
      where: { direction: 'outbound' },
      order: [['createdAt', 'DESC']]
    });

    if (lastMessage) {
      const timeSinceLastMessage = Date.now() - new Date(lastMessage.createdAt);
      if (timeSinceLastMessage < limits.delayBetweenMessages) {
        return { 
          allowed: false, 
          reason: `Too fast, wait ${Math.ceil((limits.delayBetweenMessages - timeSinceLastMessage) / 1000)} seconds` 
        };
      }
    }

    return { allowed: true };
  }

  // Check content compliance
  checkContentCompliance(content) {
    const rules = wahaCompliance.antiBanRules.contentRules;
    
    // Check prohibited words
    const contentLower = content.toLowerCase();
    for (const word of rules.prohibitedWords) {
      if (contentLower.includes(word)) {
        return { compliant: false, reason: `Contains prohibited word: ${word}` };
      }
    }

    // Check message length
    if (content.length > rules.maxMessageLength) {
      return { compliant: false, reason: 'Message too long' };
    }

    // Check URLs
    const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > rules.maxUrlsPerMessage) {
      return { compliant: false, reason: 'Too many URLs' };
    }

    // Check personalization
    if (rules.requirePersonalization && !this.hasPersonalization(content)) {
      return { compliant: false, reason: 'Message lacks personalization' };
    }

    return { compliant: true };
  }

  // Check if message has personalization
  hasPersonalization(content) {
    // Simple check for name patterns
    return /\b(pak|bu|bapak|ibu|saudara|kak|mas|mbak)\b/i.test(content);
  }

  // Check contact status
  async checkContactStatus(phoneNumber) {
    try {
      const contact = await Contact.findOne({
        where: { phoneNumber }
      });

      if (!contact) {
        return { allowed: false, reason: 'Contact not found' };
      }

      // Check blocked status
      if (contact.status === 'blocked') {
        return { allowed: false, reason: 'Contact is blocked' };
      }

      // Check opt-in
      if (!contact.optInStatus) {
        return { allowed: false, reason: 'Contact has not opted in' };
      }

      // Check last interaction
      const rules = wahaCompliance.antiBanRules.contacts;
      if (contact.lastMessageAt) {
        const daysSinceLastMessage = (Date.now() - new Date(contact.lastMessageAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastMessage > rules.checkLastInteraction) {
          return { allowed: false, reason: 'Contact inactive for too long' };
        }
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Contact status check error:', error);
      return { allowed: false, reason: 'Contact check failed' };
    }
  }

  // Check warming period for new numbers
  async checkWarmingPeriod() {
    const warming = wahaCompliance.antiBanRules.newNumberWarming;
    if (!warming.enabled) return { allowed: true };

    const session = await WhatsAppSession.findOne({
      where: { sessionName: 'default' }
    });

    if (!session || !session.createdAt) return { allowed: true };

    const daysSinceCreation = (Date.now() - new Date(session.createdAt)) / (1000 * 60 * 60 * 24);
    
    let limits;
    if (daysSinceCreation <= 3) {
      limits = warming.limits.day1to3;
    } else if (daysSinceCreation <= 7) {
      limits = warming.limits.day4to7;
    } else if (daysSinceCreation <= 14) {
      limits = warming.limits.day8to14;
    } else {
      limits = warming.limits.afterDay14;
    }

    if (this.dailyMetrics.uniqueContacts.size >= limits.contacts) {
      return { 
        allowed: false, 
        warning: `Warming period limit: ${limits.contacts} contacts/day` 
      };
    }

    return { allowed: true };
  }

  // Add delay to mimic human behavior
  async addHumanDelay() {
    const range = wahaCompliance.antiBanRules.messaging.randomDelayRange;
    const delay = Math.random() * (range[1] - range[0]) + range[0];
    
    logger.info(`Adding human delay: ${Math.round(delay/1000)}s`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Update metrics after sending
  async updateMetrics(phoneNumber, success) {
    this.dailyMetrics.messagesSent++;
    this.dailyMetrics.uniqueContacts.add(phoneNumber);
    
    if (!success) {
      this.dailyMetrics.failedCount++;
    }

    // Check if we need emergency pause
    await this.checkEmergencyThresholds();
  }

  // Check emergency thresholds
  async checkEmergencyThresholds() {
    const thresholds = wahaCompliance.qualityMonitoring.alertThresholds;
    
    // Calculate rates
    const failureRate = this.dailyMetrics.failedCount / this.dailyMetrics.messagesSent;
    
    if (failureRate > thresholds.failureRate) {
      logger.error('High failure rate detected, pausing operations');
      await this.emergencyPause('HIGH_FAILURE_RATE');
    }
  }

  // Emergency pause
  async emergencyPause(reason) {
    const procedures = wahaCompliance.emergencyProcedures;
    
    logger.error(`EMERGENCY PAUSE: ${reason}`);
    
    // Update session status
    await WhatsAppSession.update(
      { 
        status: 'paused',
        pausedReason: reason,
        pausedAt: new Date()
      },
      { where: { sessionName: 'default' } }
    );

    // Notify admin
    // TODO: Implement notification system
  }

  // Get session metrics
  async getSessionMetrics(sessionName) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messages = await Message.findAll({
      where: {
        direction: 'outbound',
        createdAt: { [Op.gte]: today }
      },
      include: [{ model: Contact, as: 'contact' }]
    });

    const blockedCount = messages.filter(m => m.contact?.status === 'blocked').length;
    const totalCount = messages.length;

    return {
      blockRate: totalCount > 0 ? blockedCount / totalCount : 0,
      messagesSent: totalCount,
      uniqueContacts: new Set(messages.map(m => m.phoneNumber)).size
    };
  }

  // Reset daily metrics (should be called by cron job)
  resetDailyMetrics() {
    this.dailyMetrics = {
      messagesSent: 0,
      uniqueContacts: new Set(),
      blockedCount: 0,
      failedCount: 0
    };
    logger.info('Daily metrics reset');
  }

  // Generate compliance report
  async generateComplianceReport() {
    const report = {
      date: new Date(),
      metrics: this.dailyMetrics,
      sessionHealth: await this.checkSessionHealth('default'),
      recommendations: []
    };

    // Add recommendations based on metrics
    if (this.dailyMetrics.failedCount > 5) {
      report.recommendations.push('High failure rate - check message content and recipient status');
    }

    if (this.dailyMetrics.uniqueContacts.size < 10) {
      report.recommendations.push('Low activity - consider gradual increase if within warming period');
    }

    return report;
  }
}

module.exports = new WAHAComplianceService();
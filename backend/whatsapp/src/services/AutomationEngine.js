const { AutomationRule, AutomationLog, AutomationContactLimit, Contact, Message, Conversation, CustomerPhase, CustomTemplate } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const LLMService = require('./LLMService');
const WorkflowEngine = require('./WorkflowEngine');
const IntentDetectionService = require('./IntentDetectionService');
const EntityExtractionService = require('./EntityExtractionService');

class AutomationEngine {
  constructor() {
    // Don't import message queue to avoid circular dependency
    this.masterEnabled = true; // Master switch state
  }
  
  /**
   * Set master automation enabled state
   */
  setMasterEnabled(enabled) {
    this.masterEnabled = enabled;
    logger.info(`Master automation switch set to: ${enabled ? 'ON' : 'OFF'}`);
  }
  
  /**
   * Get master automation enabled state
   */
  getMasterEnabled() {
    return this.masterEnabled;
  }

  /**
   * Process incoming message for automation triggers
   */
  async processMessage(message, contact, conversation) {
    try {
      logger.info('=== AUTOMATION ENGINE: PROCESSING MESSAGE FOR AUTOMATION ===');
      logger.info('Message details:', {
        messageId: message.id,
        contactId: contact.id,
        contactPhone: contact.phoneNumber,
        content: message.content || message.body,
        direction: message.direction,
        messageType: message.messageType,
        fromMe: message.direction === 'outbound',
        isGroupMessage: message.isGroupMessage || false
      });
      
      // Check master switch first
      if (!this.masterEnabled) {
        logger.info('Automation is disabled by master switch');
        return;
      }
      
      // Skip automation for group messages
      if (message.isGroupMessage || conversation.isGroup) {
        logger.info('Skipping automation for group message');
        return;
      }
      
      // Get or create customer phase
      const customerPhase = await this.getOrCreateCustomerPhase(contact, conversation, message);
      
      // Detect intent from message
      let detectedIntent = null;
      if (message.direction === 'inbound' && message.content) {
        try {
          detectedIntent = await IntentDetectionService.detectIntent(message.content);
          logger.info('Intent detected:', detectedIntent);
          
          // Log intent detection for analytics (skip if ruleId required)
          // await AutomationLog.create({
          //   ruleId: null, // No specific rule, just intent detection
          //   contactId: contact.id,
          //   conversationId: conversation.id,
          //   messageId: message.id,
          //   triggerType: 'intent_detection',
          //   triggerData: {
          //     messageContent: message.content.substring(0, 100),
          //     detectedIntent: detectedIntent
          //   },
          //   metadata: {
          //     detectedIntent: detectedIntent,
          //     intent: detectedIntent.intent,
          //     confidence: detectedIntent.confidence
          //   },
          //   status: 'success',
          //   executionTime: 0
          // });
          
          // Auto-label based on intent (only if confidence is high enough)
          if (detectedIntent.confidence >= 0.7) {
            await this.autoLabelByIntent(conversation, contact, detectedIntent);
          }
        } catch (error) {
          logger.error('Error detecting intent:', error);
          detectedIntent = { intent: 'other', confidence: 0.5, reason: 'Detection failed' };
          
          // Log failed intent detection (skip if ruleId required)
          // await AutomationLog.create({
          //   ruleId: null,
          //   contactId: contact.id,
          //   conversationId: conversation.id,
          //   messageId: message.id,
          //   triggerType: 'intent_detection',
          //   triggerData: {
          //     messageContent: message.content.substring(0, 100),
          //     error: error.message
          //   },
          //   metadata: {
          //     fallback: true,
          //     detectedIntent: detectedIntent,
          //     intent: 'other',
          //     confidence: 0
          //   },
          //   status: 'failed',
          //   executionTime: 0
          // });
        }
      }
      
      // Detect and update phase based on message content
      await this.detectAndUpdatePhase(customerPhase, message, contact, conversation);
      
      // Get all active automation rules
      const rules = await AutomationRule.findAll({
        where: { isActive: true },
        order: [['priority', 'DESC']]
      });
      
      logger.info(`Found ${rules.length} active automation rules`);
      
      for (const rule of rules) {
        try {
          logger.info(`Evaluating rule: ${rule.name} (${rule.ruleType})`);
          await this.evaluateRule(rule, message, contact, conversation, customerPhase);
        } catch (error) {
          logger.error(`Error evaluating rule ${rule.id}:`, error);
        }
      }
      
      // Update interaction tracking
      await customerPhase.addInteraction();
      
    } catch (error) {
      logger.error('Error processing message for automation:', error);
    }
  }
  
  /**
   * Get or create customer phase record
   */
  async getOrCreateCustomerPhase(contact, conversation, message) {
    try {
      // Try to find existing phase record
      let customerPhase = await CustomerPhase.findOne({
        where: { contactId: contact.id }
      });
      
      if (!customerPhase) {
        // Detect initial phase source
        const phaseSource = await this.detectPhaseSource(message, contact);
        
        // Create new phase record
        customerPhase = await CustomerPhase.create({
          contactId: contact.id,
          conversationId: conversation.id,
          currentPhase: 'LEADS',
          phaseSource: phaseSource,
          phaseEnteredAt: new Date()
        });
        
        logger.info(`Created new customer phase for contact ${contact.id}: LEADS`);
      }
      
      return customerPhase;
    } catch (error) {
      logger.error('Error getting/creating customer phase:', error);
      throw error;
    }
  }
  
  /**
   * Detect phase source from message context
   */
  async detectPhaseSource(message, contact) {
    const messageContent = (message.body || '').toLowerCase();
    
    // Check for common sources
    if (messageContent.includes('instagram') || messageContent.includes('ig')) {
      return 'instagram';
    }
    if (messageContent.includes('facebook') || messageContent.includes('fb')) {
      return 'facebook';
    }
    if (messageContent.includes('referral') || messageContent.includes('rekomendasi')) {
      return 'referral';
    }
    
    // Default to WhatsApp if no specific source detected
    return 'whatsapp';
  }
  
  /**
   * Detect and update customer phase based on message content
   */
  async detectAndUpdatePhase(customerPhase, message, contact, conversation) {
    try {
      const messageContent = (message.body || '').toLowerCase();
      const currentPhase = customerPhase.currentPhase;
      
      // Phase transition patterns based on context.md
      const phasePatterns = {
        'LEADS_TO_INTEREST': [
          /yang.*hari.*berapa/i,  // "Yang 12 hari berapa?"
          /bedanya.*apa/i,        // "Bedanya apa?"
          /hotel.*apa/i,          // "Hotel nya apa?"
          /detail/i,              // "Detail dong"
          /info.*lengkap/i,       // "Info lengkap"
          /#\d{4}_\d+H_/i        // Package code pattern
        ],
        'INTEREST_TO_CLOSING': [
          /mau.*booking/i,        // "Mau booking"
          /gimana.*daftar/i,      // "Gimana cara daftarnya?"
          /transfer.*kemana/i,    // "Transfer kemana?"
          /dp.*berapa/i,          // "DP berapa?"
          /bayar.*gimana/i        // "Bayar gimana?"
        ],
        'PACKAGE_INTEREST': [
          /paket.*umroh/i,
          /harga.*umroh/i,
          /#\d{4}_\d+H_/i,       // Package codes
          /\d+.*hari/i           // Duration patterns
        ],
        'PAYMENT_INTENT': [
          /transfer/i,
          /bayar/i,
          /dp/i,
          /down.*payment/i,
          /pelunasan/i
        ]
      };
      
      let shouldTransition = false;
      let newPhase = currentPhase;
      let extractedData = {};
      
      // Check for phase transitions
      if (currentPhase === 'LEADS') {
        // Check if should move to INTEREST
        for (const pattern of phasePatterns.LEADS_TO_INTEREST) {
          if (pattern.test(messageContent)) {
            shouldTransition = true;
            newPhase = 'INTEREST';
            break;
          }
        }
        
        // Extract package interests
        const packageMatch = messageContent.match(/#(\d{4})_(\d+H)_([A-Z]{3})_([A-Z]{3})(\d{2})/);
        if (packageMatch) {
          extractedData.interestedPackages = [packageMatch[0]];
          extractedData.preferredMonth = packageMatch[4];
          shouldTransition = true;
          newPhase = 'INTEREST';
        }
        
      } else if (currentPhase === 'INTEREST') {
        // Check if should move to CLOSING
        for (const pattern of phasePatterns.INTEREST_TO_CLOSING) {
          if (pattern.test(messageContent)) {
            shouldTransition = true;
            newPhase = 'CLOSING';
            break;
          }
        }
      }
      
      // Extract additional customer data
      await this.extractCustomerData(customerPhase, message, extractedData);
      
      // Perform phase transition if needed
      if (shouldTransition && newPhase !== currentPhase) {
        await customerPhase.moveToNextPhase();
        logger.info(`Customer ${contact.id} moved from ${currentPhase} to ${newPhase}`);
        
        // Log phase transition
        await AutomationLog.create({
          ruleId: null, // System-generated transition
          contactId: contact.id,
          conversationId: conversation.id,
          messageId: message.id,
          triggerType: 'phase_transition',
          triggerData: {
            fromPhase: currentPhase,
            toPhase: newPhase,
            reason: 'message_pattern_match'
          },
          status: 'success'
        });
      }
      
    } catch (error) {
      logger.error('Error detecting/updating phase:', error);
    }
  }
  
  /**
   * Extract customer data from message
   */
  async extractCustomerData(customerPhase, message, additionalData = {}) {
    try {
      const messageContent = (message.body || '').toLowerCase();
      const updates = { ...additionalData };
      
      // Extract party size
      const partyMatch = messageContent.match(/(\d+)\s*(orang|pax|jamaah|person)/i);
      if (partyMatch) {
        updates.partySize = parseInt(partyMatch[1]);
      }
      
      // Extract budget mentions
      const budgetMatch = messageContent.match(/budget.*?(\d+).*?juta/i);
      if (budgetMatch) {
        updates.budget = `${budgetMatch[1]}jt`;
      }
      
      // Extract departure city
      const cityMatch = messageContent.match(/dari\s*(jakarta|surabaya|bandung|medan|jogja|solo)/i);
      if (cityMatch) {
        updates.departureCity = cityMatch[1].toLowerCase();
      }
      
      // Extract concerns/objections
      const concerns = [];
      if (messageContent.includes('mahal')) concerns.push('price_concern');
      if (messageContent.includes('jauh')) concerns.push('hotel_distance');
      if (messageContent.includes('mikir')) concerns.push('needs_consideration');
      
      if (concerns.length > 0) {
        updates.concerns = [...(customerPhase.concerns || []), ...concerns];
      }
      
      // Update customer phase with extracted data
      if (Object.keys(updates).length > 0) {
        await customerPhase.update(updates);
      }
      
    } catch (error) {
      logger.error('Error extracting customer data:', error);
    }
  }
  
  /**
   * Evaluate if a rule should trigger
   */
  async evaluateRule(rule, message, contact, conversation, customerPhase = null) {
    // Check if rule should trigger
    const shouldTrigger = await this.shouldRuleTrigger(rule, message, contact, conversation);
    
    if (!shouldTrigger.trigger) {
      logger.debug(`Rule ${rule.name} did not trigger: ${shouldTrigger.reason}`);
      return;
    }
    
    // Check rate limits
    const canTrigger = await this.checkRateLimits(rule, contact);
    
    if (!canTrigger.allowed) {
      // Log skipped execution
      await this.logExecution(
        rule, 
        contact, 
        conversation, 
        message, 
        'skipped', 
        null, 
        canTrigger.reason, 
        0,
        {},
        {}
      );
      return;
    }
    
    // Execute the rule with trigger context
    await this.executeRule(rule, message, contact, conversation, shouldTrigger);
  }
  
  /**
   * Check if rule should trigger based on conditions
   */
  async shouldRuleTrigger(rule, message, contact, conversation) {
    // Don't trigger on outgoing messages (unless specifically configured)
    if (message.direction === 'outbound') {
      return { trigger: false, reason: 'Message is outgoing' };
    }
    
    switch (rule.ruleType) {
      case 'welcome':
        return await this.checkWelcomeConditions(rule, contact, conversation);
        
      case 'away':
        return await this.checkAwayConditions(rule);
        
      case 'keyword':
        return await this.checkKeywordConditions(rule, message);
        
      case 'workflow':
        return await this.checkWorkflowConditions(rule, message, contact, conversation);
        
      case 'llm_agent':
        return await this.checkLLMAgentConditions(rule, message, contact, conversation);
        
      case 'template':
        return await this.checkTemplateConditions(rule, message, contact, conversation);
        
      default:
        return { trigger: false, reason: 'Unknown rule type' };
    }
  }
  
  /**
   * Check welcome message conditions
   */
  async checkWelcomeConditions(rule, contact, conversation) {
    const conditions = rule.triggerConditions || {};
    
    // Check if this is a new contact
    if (conditions.triggerFor === 'new_contact' || !conditions.triggerFor) {
      // Count previous messages from this contact
      const messageCount = await Message.count({
        where: {
          conversationId: conversation.id,
          fromMe: false
        }
      });
      
      // Only trigger for first message
      if (messageCount === 1) {
        return { trigger: true, reason: 'First message from new contact' };
      }
    }
    
    // Check if contact joined group
    if (conditions.triggerFor === 'group_join' && conversation.isGroup) {
      // Would need to check group participant events
      return { trigger: false, reason: 'Group join detection not implemented' };
    }
    
    return { trigger: false, reason: 'Welcome conditions not met' };
  }
  
  /**
   * Check away message conditions
   */
  async checkAwayConditions(rule) {
    const schedule = rule.schedule || {};
    const now = new Date();
    
    // Check day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    
    if (schedule.days && !schedule.days.includes(currentDay)) {
      return { trigger: false, reason: 'Not scheduled for today' };
    }
    
    // Check time
    if (schedule.startTime && schedule.endTime) {
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      // Check if current time is outside business hours
      if (currentTime >= startMinutes && currentTime <= endMinutes) {
        return { trigger: false, reason: 'Within business hours' };
      }
    }
    
    return { trigger: true, reason: 'Outside business hours' };
  }
  
  /**
   * Check keyword conditions
   */
  async checkKeywordConditions(rule, message) {
    const keywords = rule.keywords || [];
    const messageText = (message.body || message.content || '').toLowerCase();
    
    logger.info(`Checking keywords for rule ${rule.name}:`, {
      ruleId: rule.id,
      keywords: keywords,
      messageText: messageText,
      hasKeywords: keywords.length > 0
    });
    
    if (keywords.length === 0) {
      return { trigger: false, reason: 'No keywords configured' };
    }
    
    // Check if any keyword matches
    const matchedKeywords = [];
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      if (messageText.includes(keywordLower)) {
        matchedKeywords.push(keyword);
      }
    }
    
    if (matchedKeywords.length > 0) {
      logger.info(`Keywords matched! Rule: ${rule.name}, Keywords: ${matchedKeywords.join(', ')}`);
      return { 
        trigger: true, 
        reason: `Keywords matched: ${matchedKeywords.join(', ')}`,
        matchedKeywords: matchedKeywords
      };
    }
    
    logger.debug(`No keywords matched for rule ${rule.name}`);
    return { trigger: false, reason: 'No keywords matched' };
  }
  
  /**
   * Check workflow conditions
   */
  async checkWorkflowConditions(rule, message, contact, conversation) {
    // Check if there's an active workflow for this contact
    const activeLog = await AutomationLog.findOne({
      where: {
        ruleId: rule.id,
        contactId: contact.id,
        status: 'pending',
        triggerType: 'workflow'
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (activeLog) {
      // Continue existing workflow
      return { trigger: true, reason: 'Continuing workflow', existingLog: activeLog };
    }
    
    // Check if workflow should start
    const startConditions = rule.triggerConditions || {};
    if (startConditions.startKeyword) {
      const messageText = (message.body || '').toLowerCase();
      if (messageText.includes(startConditions.startKeyword.toLowerCase())) {
        return { trigger: true, reason: 'Workflow start keyword matched' };
      }
    }
    
    return { trigger: false, reason: 'No workflow conditions met' };
  }
  
  /**
   * Check LLM agent conditions
   */
  async checkLLMAgentConditions(rule, message, contact, conversation) {
    const conditions = rule.triggerConditions || {};
    const messageText = (message.body || message.content || '').toLowerCase();
    
    logger.info(`Checking LLM agent conditions for rule ${rule.name}:`, {
      ruleId: rule.id,
      hasKeywords: conditions.keywords?.length > 0,
      customerPhases: conditions.customerPhases,
      messageText: messageText.substring(0, 50) + '...'
    });
    
    // Check trigger keywords if specified
    if (conditions.keywords && conditions.keywords.length > 0) {
      let keywordMatched = false;
      for (const keyword of conditions.keywords) {
        if (messageText.includes(keyword.toLowerCase())) {
          keywordMatched = true;
          break;
        }
      }
      
      if (!keywordMatched) {
        return { trigger: false, reason: 'No trigger keywords matched' };
      }
    }
    
    // Check customer phase if specified
    if (conditions.customerPhases && conditions.customerPhases.length > 0) {
      const customerPhase = await CustomerPhase.findOne({
        where: { contactId: contact.id }
      });
      
      if (!customerPhase || !conditions.customerPhases.includes(customerPhase.currentPhase)) {
        return { trigger: false, reason: 'Customer phase not matched' };
      }
    }
    
    // Check minimum message length (avoid responding to very short messages)
    if (messageText.length < 3) {
      return { trigger: false, reason: 'Message too short' };
    }
    
    // Default: trigger for all messages if no specific conditions
    return { trigger: true, reason: 'LLM agent conditions met' };
  }
  
  /**
   * Check template conditions
   */
  async checkTemplateConditions(rule, message, contact, conversation) {
    const conditions = rule.triggerConditions || {};
    const messageText = (message.body || message.content || '').toLowerCase();
    
    logger.info(`Checking template conditions for rule ${rule.name}:`, {
      ruleId: rule.id,
      templateCategory: conditions.templateCategory,
      messageText: messageText.substring(0, 50) + '...'
    });
    
    // Always trigger for template rules (matching will be done during execution)
    return { trigger: true, reason: 'Template rule active' };
  }
  
  /**
   * Check rate limits for contact
   */
  async checkRateLimits(rule, contact) {
    // Find or create contact limit record
    const [limit, created] = await AutomationContactLimit.findOrCreate({
      where: {
        ruleId: rule.id,
        contactId: contact.id
      },
      defaults: {
        triggerCount: 0
      }
    });
    
    // Check if blocked
    if (limit.isBlocked) {
      return { allowed: false, reason: `Contact blocked: ${limit.blockedReason}` };
    }
    
    // Check cooldown
    if (limit.cooldownUntil && new Date() < limit.cooldownUntil) {
      return { allowed: false, reason: 'Contact in cooldown period' };
    }
    
    // Check max triggers
    if (rule.maxTriggersPerContact > 0 && limit.triggerCount >= rule.maxTriggersPerContact) {
      return { allowed: false, reason: 'Max triggers reached for contact' };
    }
    
    return { allowed: true };
  }
  
  /**
   * Execute automation rule
   */
  async executeRule(rule, message, contact, conversation, triggerContext = {}) {
    const startTime = Date.now();
    let responseMessageId = null;
    let status = 'pending';
    let error = null;
    const processingDetails = {
      startTime: new Date(),
      templateUsed: null,
      responseContent: null,
      detectedIntent: null,
      extractedEntities: null
    };
    
    try {
      logger.info(`=== EXECUTING AUTOMATION RULE ===`);
      logger.info(`Rule: ${rule.name} (ID: ${rule.id})`);
      logger.info(`Contact: ${contact.phoneNumber}`);
      logger.info(`Response Messages:`, rule.responseMessages);
      
      // Update contact limits
      await this.updateContactLimits(rule, contact);
      
      // Apply response delay
      if (rule.responseDelay > 0) {
        logger.info(`Applying response delay: ${rule.responseDelay} seconds`);
        await new Promise(resolve => setTimeout(resolve, rule.responseDelay * 1000));
      }
      
      // Check rule type
      if (rule.ruleType === 'llm_agent') {
        logger.info('Executing LLM agent response');
        const llmResult = await this.sendLLMResponse(rule, message, contact, conversation);
        if (llmResult) {
          responseMessageId = llmResult.messageId;
          processingDetails.aiModel = llmResult.aiModel;
          processingDetails.temperature = llmResult.temperature;
          processingDetails.tokensUsed = llmResult.tokensUsed;
          processingDetails.tokensPerSecond = llmResult.tokensPerSecond;
          processingDetails.promptTokens = llmResult.promptTokens;
          processingDetails.completionTokens = llmResult.completionTokens;
          processingDetails.aiResponsePreview = llmResult.aiResponsePreview;
          processingDetails.responseContent = llmResult.responseContent;
        }
      } else if (rule.ruleType === 'workflow') {
        logger.info('Executing workflow');
        responseMessageId = await this.executeWorkflow(rule, message, contact, conversation);
      } else if (rule.ruleType === 'template') {
        logger.info('Executing template-based response');
        const templateResult = await this.sendTemplateBasedResponse(rule, message, contact, conversation);
        if (templateResult) {
          responseMessageId = templateResult.messageId;
          processingDetails.templateUsed = templateResult.templateUsed;
          processingDetails.detectedIntent = templateResult.detectedIntent;
          processingDetails.extractedEntities = templateResult.extractedEntities;
          processingDetails.responseContent = templateResult.responseContent;
        }
      } else if (rule.responseType === 'sequence' && rule.responseMessages && rule.responseMessages.length > 0) {
        // Check if using new sequence type with multiple messages
        logger.info(`Sending sequence response with ${rule.responseMessages.length} messages`);
        responseMessageId = await this.sendSequenceResponse(rule, contact, conversation, message);
      } else if (rule.responseMessages && rule.responseMessages.length > 0) {
        // Handle responseMessages even if responseType is not 'sequence'
        logger.info(`Sending response messages (${rule.responseMessages.length} messages)`);
        responseMessageId = await this.sendSequenceResponse(rule, contact, conversation, message);
      } else {
        // Legacy single message handling
        const processedMessage = this.processMessageVariables(rule.responseMessage, contact, message);
        
        // Send response based on type
        switch (rule.responseType) {
          case 'text':
            responseMessageId = await this.sendTextResponse(processedMessage, contact, conversation);
            break;
            
          case 'template':
            responseMessageId = await this.sendTemplateResponse(rule, contact, conversation);
            break;
            
          case 'media':
            responseMessageId = await this.sendMediaResponse(rule, processedMessage, contact, conversation);
            break;
            
          case 'button':
            responseMessageId = await this.sendButtonResponse(rule, processedMessage, contact, conversation);
            break;
            
          default:
            responseMessageId = await this.sendTextResponse(processedMessage, contact, conversation);
        }
      }
      
      // Update rule statistics
      await rule.increment(['triggerCount', 'successCount']);
      await rule.update({ lastTriggeredAt: new Date() });
      
      status = 'success';
      logger.info(`Rule execution successful! Response message ID: ${responseMessageId}`);
      
    } catch (err) {
      logger.error(`Error executing rule ${rule.id}:`, err);
      error = err.message;
      status = 'failed';
      
      // Update failure count
      await rule.increment('failureCount');
    }
    
    // Log execution with detailed information
    const executionTime = Date.now() - startTime;
    processingDetails.endTime = new Date();
    processingDetails.totalTime = executionTime;
    
    await this.logExecution(
      rule, 
      contact, 
      conversation, 
      message, 
      status, 
      responseMessageId, 
      error, 
      executionTime,
      triggerContext,
      processingDetails
    );
    
    // Emit completion event
    if (global.io) {
      global.io.emit('autoreply:complete', {
        messageId: message.id,
        ruleId: rule.id,
        status,
        executionTime
      });
    }
  }
  
  /**
   * Update contact limits after execution
   */
  async updateContactLimits(rule, contact) {
    const limit = await AutomationContactLimit.findOne({
      where: {
        ruleId: rule.id,
        contactId: contact.id
      }
    });
    
    if (limit) {
      const updates = {
        triggerCount: limit.triggerCount + 1,
        lastTriggeredAt: new Date()
      };
      
      // Set cooldown if configured
      if (rule.cooldownMinutes > 0) {
        const cooldownUntil = new Date();
        cooldownUntil.setMinutes(cooldownUntil.getMinutes() + rule.cooldownMinutes);
        updates.cooldownUntil = cooldownUntil;
      }
      
      await limit.update(updates);
    }
  }
  
  /**
   * Process message variables
   */
  processMessageVariables(message, contact, triggerMessage) {
    let processed = message;
    
    // Replace contact variables
    processed = processed.replace(/{name}/g, contact.name || contact.phoneNumber);
    processed = processed.replace(/{phone}/g, contact.phoneNumber);
    processed = processed.replace(/{firstName}/g, contact.name?.split(' ')[0] || '');
    
    // Replace time variables
    const now = new Date();
    processed = processed.replace(/{time}/g, now.toLocaleTimeString('id-ID'));
    processed = processed.replace(/{date}/g, now.toLocaleDateString('id-ID'));
    processed = processed.replace(/{day}/g, now.toLocaleDateString('id-ID', { weekday: 'long' }));
    
    // Replace message variables
    if (triggerMessage) {
      processed = processed.replace(/{message}/g, triggerMessage.body || '');
    }
    
    return processed;
  }
  
  /**
   * Create and queue an outgoing message directly
   */
  async createOutgoingMessage(messageData) {
    try {
      logger.info('=== CREATING OUTGOING MESSAGE ===');
      logger.info('Message data:', {
        to: messageData.toNumber,
        type: messageData.messageType,
        content: messageData.content?.substring(0, 50) + '...'
      });
      
      // Direct database creation and WAHA sending
      const { Message, Conversation } = require('../models');
      const wahaService = require('./RealWAHAService');
      
      // Create message in database
      const message = await Message.create({
        conversationId: messageData.conversationId,
        whatsappMessageId: `auto_${Date.now()}`,
        fromNumber: messageData.fromNumber,
        toNumber: messageData.toNumber,
        messageType: messageData.messageType || 'text',
        content: messageData.content,
        body: messageData.content,
        mediaUrl: messageData.mediaUrl,
        status: 'pending',
        direction: 'outbound',
        isAutomated: true
      });
      
      logger.info(`Message created in DB: ${message.id}`);
      
      // Send via WAHA
      try {
        let wahaResult;
        const chatId = messageData.toNumber.includes('@') ? 
          messageData.toNumber : `${messageData.toNumber}@c.us`;
        
        if (messageData.messageType === 'text') {
          wahaResult = await wahaService.sendTextMessage(
            'default',
            chatId,
            messageData.content
          );
        } else if (messageData.messageType === 'image' && messageData.mediaUrl) {
          wahaResult = await wahaService.sendImageMessage(
            'default',
            chatId,
            messageData.mediaUrl,
            messageData.content // caption
          );
        }
        
        logger.info('WAHA send result:', wahaResult);
        
        // Update message status
        if (wahaResult && wahaResult.id) {
          // Extract the string ID from the WAHA result
          const messageId = typeof wahaResult.id === 'object' 
            ? (wahaResult.id._serialized || wahaResult.id.id || JSON.stringify(wahaResult.id))
            : wahaResult.id;
            
          await message.update({
            whatsappMessageId: messageId,
            status: 'sent'
          });
        }
        
        // Emit to frontend
        if (global.io) {
          global.io.emit('message:new', {
            conversationId: messageData.conversationId,
            message: message.toJSON()
          });
        }
        
      } catch (sendError) {
        logger.error('Error sending via WAHA:', sendError);
        await message.update({ status: 'failed' });
      }

      logger.info(`Automation message processed: ${message.id}`);
      return message;
    } catch (error) {
      logger.error('Error creating automation message:', error);
      throw error;
    }
  }

  /**
   * Send text response
   */
  async sendTextResponse(message, contact, conversation) {
    logger.info('Sending text response:', {
      message: message,
      to: contact.phoneNumber,
      conversationId: conversation.id
    });
    
    // Get our bot's phone number from environment or use conversation session phone
    const fromNumber = conversation.sessionPhoneNumber || process.env.WHATSAPP_PHONE_NUMBER || '6281234567890';
    
    const result = await this.createOutgoingMessage({
      conversationId: conversation.id,
      fromNumber: fromNumber,
      toNumber: contact.phoneNumber,
      messageType: 'text',
      content: message
    });
    
    // Check if result has the message object
    if (result && result.id) {
      return result.id;
    } else if (result && result.messageId) {
      return result.messageId;
    }
    
    logger.error('No message ID returned from createOutgoingMessage');
    return null;
  }
  
  /**
   * Send template response
   */
  async sendTemplateResponse(rule, contact, conversation) {
    try {
      logger.info('=== SENDING TEMPLATE RESPONSE ===');
      logger.info('Template rule details:', {
        ruleName: rule.name,
        ruleId: rule.id,
        contactPhone: contact.phoneNumber,
        isGroup: conversation.isGroup || false
      });
      
      // Skip template response for group conversations
      if (conversation.isGroup) {
        logger.info('Skipping template response for group conversation');
        return;
      }
      
      // Get the last message from conversation to analyze
      const lastMessage = await Message.findOne({
        where: {
          conversationId: conversation.id,
          direction: 'inbound'
        },
        order: [['createdAt', 'DESC']]
      });
      
      if (!lastMessage) {
        logger.error('No inbound message found in conversation');
        throw new Error('No message to respond to');
      }
      
      const messageText = lastMessage.content || lastMessage.body || '';
      logger.info(`Analyzing message: "${messageText}"`);
      
      // Use intent detection if enabled
      const conditions = rule.triggerConditions || {};
      let detectedIntent = null;
      let entities = {};
      
      if (conditions.useIntentDetection) {
        const intentService = new IntentDetectionService();
        const entityService = new EntityExtractionService();
        
        detectedIntent = await intentService.detectIntent(messageText);
        entities = await entityService.extractEntities(messageText, detectedIntent.intent);
        
        logger.info(`Intent detected: ${detectedIntent.intent} (${detectedIntent.confidence})`);
        logger.info(`Entities extracted:`, entities);
      }
      
      // Find best matching template
      const category = detectedIntent ? 
        new IntentDetectionService().mapIntentToCategory(detectedIntent.intent) : 
        null;
        
      const template = await CustomTemplate.findBestMatch(
        messageText, 
        category,
        detectedIntent?.intent
      );
      
      if (!template) {
        logger.warn('No matching template found');
        
        // Fallback to LLM if enabled
        if (conditions.fallbackToLLM) {
          return await this.sendLLMResponse(rule, lastMessage, contact, conversation);
        }
        
        throw new Error('No template found and LLM fallback disabled');
      }
      
      logger.info(`Template matched: ${template.templateName} (${template.category})`);
      
      // Prepare variables for template
      const variables = {
        nama: entities.nama || contact.name || 'Bapak/Ibu',
        nomor: contact.phoneNumber,
        kota: entities.kota || '',
        tanggal: entities.tanggal || new Date().toLocaleDateString('id-ID'),
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        hari: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
        phoneNumber: contact.phoneNumber,
        ...entities
      };
      
      // Fill template
      const filledContent = template.fillTemplate(variables);
      logger.info(`Template filled: ${filledContent.substring(0, 100)}...`);
      
      // Send the response
      const botPhoneNumber = process.env.BOT_PHONE_NUMBER || '628113032232';
      const result = await this.createOutgoingMessage({
        conversationId: conversation.id,
        fromNumber: botPhoneNumber,
        toNumber: contact.phoneNumber,
        messageType: 'text',
        content: filledContent,
        isAutomated: true,
        templateId: template.id
      });
      
      // Update template usage count
      await template.increment('usageCount');
      
      logger.info(`Template response sent successfully! Message ID: ${result.id}`);
      return result.id;
      
    } catch (error) {
      logger.error('Error sending template response:', error);
      throw error;
    }
  }
  
  /**
   * Send media response
   */
  async sendMediaResponse(rule, message, contact, conversation) {
    // Get our bot's phone number from environment or use default
    const botPhoneNumber = process.env.BOT_PHONE_NUMBER || '6281234567890';
    
    const result = await this.createOutgoingMessage({
      conversationId: conversation.id,
      fromNumber: botPhoneNumber,
      toNumber: contact.phoneNumber,
      messageType: 'image', // Default to image, could be enhanced
      content: message,
      mediaUrl: rule.mediaUrl
    });
    
    return result.id;
  }
  
  /**
   * Send button response
   */
  async sendButtonResponse(rule, message, contact, conversation) {
    // Get our bot's phone number from environment or use default
    const botPhoneNumber = process.env.BOT_PHONE_NUMBER || '6281234567890';
    
    // Would need WAHA button message support
    const result = await this.createOutgoingMessage({
      conversationId: conversation.id,
      fromNumber: botPhoneNumber,
      toNumber: contact.phoneNumber,
      messageType: 'text', // Fallback to text for now
      content: message
      // buttons: rule.buttons, // Not supported yet
    });
    
    return result.id;
  }
  
  /**
   * Send sequence of messages (text and images)
   */
  async sendSequenceResponse(rule, contact, conversation, triggerMessage) {
    logger.info('=== SENDING SEQUENCE RESPONSE ===');
    const messageIds = [];
    const responseMessages = rule.responseMessages || [];
    
    logger.info(`Processing ${responseMessages.length} messages in sequence`);
    
    for (let i = 0; i < responseMessages.length; i++) {
      const msg = responseMessages[i];
      logger.info(`Message ${i + 1}:`, msg);
      
      // Apply delay between messages (except for first one)
      if (i > 0 && rule.messageDelay > 0) {
        logger.info(`Applying message delay: ${rule.messageDelay} seconds`);
        await new Promise(resolve => setTimeout(resolve, rule.messageDelay * 1000));
      }
      
      try {
        let messageId;
        
        if (msg.type === 'text') {
          // Process variables in text message
          const processedText = this.processMessageVariables(msg.content || msg.text, contact, triggerMessage);
          logger.info(`Sending text message: ${processedText}`);
          messageId = await this.sendTextResponse(processedText, contact, conversation);
          
        } else if (msg.type === 'image') {
          // Send image with optional caption
          const caption = msg.caption ? this.processMessageVariables(msg.caption, contact, triggerMessage) : '';
          logger.info(`Sending image: ${msg.mediaUrl || msg.url} with caption: ${caption}`);
          messageId = await this.sendImageResponse(msg.mediaUrl || msg.url, caption, contact, conversation);
          
        } else {
          logger.warn(`Unknown message type in sequence: ${msg.type}`);
          continue;
        }
        
        if (messageId) {
          messageIds.push(messageId);
          logger.info(`Message sent successfully with ID: ${messageId}`);
        }
        
      } catch (error) {
        logger.error(`Error sending sequence message ${i}:`, error);
        // Continue with next message even if one fails
      }
    }
    
    logger.info(`Sequence complete. Sent ${messageIds.length} messages`);
    // Return the first message ID as the primary response
    return messageIds[0] || null;
  }
  
  /**
   * Send image response
   */
  async sendImageResponse(imageUrl, caption, contact, conversation) {
    try {
      logger.info('Sending image response:', {
        imageUrl: imageUrl,
        caption: caption,
        to: contact.phoneNumber
      });
      
      // Ensure full URL for image
      let fullImageUrl = imageUrl;
      if (imageUrl && !imageUrl.startsWith('http')) {
        // Convert relative URL to full URL
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
        fullImageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
      
      // Get our bot's phone number from environment or use conversation session phone
      const fromNumber = conversation.sessionPhoneNumber || process.env.WHATSAPP_PHONE_NUMBER || '6281234567890';
      
      // Send image via WAHA
      const result = await this.createOutgoingMessage({
        conversationId: conversation.id,
        fromNumber: fromNumber,
        toNumber: contact.phoneNumber,
        messageType: 'image',
        content: caption || '',
        mediaUrl: fullImageUrl
      });
      
      // Check if result has the message object
      if (result && result.id) {
        return result.id;
      } else if (result && result.messageId) {
        return result.messageId;
      }
      
      logger.error('No message ID returned from createOutgoingMessage for image');
      return null;
    } catch (error) {
      logger.error('Error sending image response:', error);
      throw error;
    }
  }
  
  /**
   * Send LLM-generated response
   */
  async sendLLMResponse(rule, message, contact, conversation) {
    try {
      logger.info('=== SENDING LLM RESPONSE ===');
      logger.info(`Rule: ${rule.name}, Contact: ${contact.phoneNumber}`);
      
      // Build context for LLM
      const context = await this.buildLLMContext(rule, message, contact, conversation);
      
      // Get LLM configuration
      const llmConfig = rule.llmConfig || {};
      const systemPrompt = rule.systemPrompt || 'You are a helpful assistant.';
      
      // Find relevant knowledge base entries
      const relevantKnowledge = LLMService.findRelevantKnowledge(
        message.body || message.content,
        rule.knowledgeBase || []
      );
      
      if (relevantKnowledge.length > 0) {
        context.knowledgeBase = relevantKnowledge;
      }
      
      // Generate response from LLM
      const llmResult = await LLMService.generateResponse(
        message.body || message.content,
        context,
        systemPrompt,
        llmConfig
      );
      
      if (!llmResult.success) {
        logger.error('LLM response generation failed:', llmResult.error);
        // Fallback to a default response
        const fallbackMessage = 'Maaf, saya sedang mengalami kendala teknis. Silakan coba lagi beberapa saat.';
        return await this.sendTextResponse(fallbackMessage, contact, conversation);
      }
      
      // Validate response
      if (!LLMService.validateResponse(llmResult.response)) {
        logger.warn('LLM response failed validation');
        const safeMessage = 'Maaf, saya tidak bisa memberikan respons yang sesuai. Silakan hubungi admin kami.';
        return await this.sendTextResponse(safeMessage, contact, conversation);
      }
      
      // Format response with variables
      const variables = {
        name: contact.name || contact.phoneNumber,
        firstName: contact.name?.split(' ')[0] || '',
        phone: contact.phoneNumber
      };
      
      const formattedResponse = LLMService.formatResponse(llmResult.response, variables);
      
      // Send the LLM response
      const messageId = await this.sendTextResponse(formattedResponse, contact, conversation);
      
      // Calculate tokens per second
      const tokensPerSecond = llmResult.totalDuration > 0 
        ? Math.round((llmResult.evalCount / (llmResult.totalDuration / 1000000000)) * 100) / 100
        : 0;
      
      // Log LLM usage stats
      logger.info('LLM response sent successfully:', {
        messageId,
        model: llmResult.model,
        tokens: llmResult.evalCount,
        duration: llmResult.totalDuration,
        tokensPerSecond
      });
      
      // Return detailed response information
      return {
        messageId: messageId,
        aiModel: llmResult.model || 'Unknown',
        temperature: llmConfig.temperature || 0.7,
        tokensUsed: llmResult.evalCount || 0,
        tokensPerSecond: tokensPerSecond,
        promptTokens: llmResult.promptEvalCount || 0,
        completionTokens: llmResult.evalCount || 0,
        aiResponsePreview: formattedResponse.substring(0, 100) + (formattedResponse.length > 100 ? '...' : ''),
        responseContent: formattedResponse
      };
    } catch (error) {
      logger.error('Error sending LLM response:', error);
      throw error;
    }
  }
  
  /**
   * Execute workflow rule
   */
  async executeWorkflow(rule, message, contact, conversation) {
    try {
      logger.info('=== EXECUTING WORKFLOW ===');
      logger.info(`Rule: ${rule.name}, Contact: ${contact.phoneNumber}`);
      
      // Check if contact already has an active workflow session
      const existingSession = await WorkflowEngine.processMessage(contact.phoneNumber, message);
      
      if (existingSession) {
        logger.info(`Continuing existing workflow session: ${existingSession.id}`);
        return `workflow_session_${existingSession.id}`;
      }
      
      // Get workflow template associated with this rule
      const { WorkflowTemplate } = require('../models');
      const workflowTemplate = await WorkflowTemplate.findOne({
        where: { ruleId: rule.id, isActive: true }
      });
      
      if (!workflowTemplate) {
        logger.error(`No active workflow template found for rule ${rule.id}`);
        throw new Error('Workflow template not found');
      }
      
      // Start new workflow session
      logger.info(`Starting new workflow: ${workflowTemplate.name}`);
      const session = await WorkflowEngine.startWorkflow(
        workflowTemplate.id,
        contact.phoneNumber,
        message
      );
      
      logger.info(`Workflow session started: ${session.id}`);
      return `workflow_session_${session.id}`;
      
    } catch (error) {
      logger.error('Error executing workflow:', error);
      throw error;
    }
  }
  
  /**
   * Build context for LLM
   */
  async buildLLMContext(rule, message, contact, conversation) {
    const context = {};
    
    // Add customer phase if context mode includes it
    if (rule.contextMode === 'customer_phase' || rule.contextMode === 'both') {
      const customerPhase = await CustomerPhase.findOne({
        where: { contactId: contact.id }
      });
      
      if (customerPhase) {
        context.customerPhase = {
          currentPhase: customerPhase.currentPhase,
          phaseSource: customerPhase.phaseSource,
          interestedPackages: customerPhase.interestedPackages,
          preferredMonth: customerPhase.preferredMonth,
          concerns: customerPhase.concerns,
          partySize: customerPhase.partySize,
          budget: customerPhase.budget
        };
      }
    }
    
    // Add conversation history if context mode includes it
    if (rule.contextMode === 'conversation' || rule.contextMode === 'both') {
      // Get last 10 messages from conversation
      const conversationHistory = await Message.findAll({
        where: {
          conversationId: conversation.id
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      
      // Reverse to get chronological order
      context.conversationHistory = conversationHistory.reverse().map(msg => ({
        fromMe: msg.fromMe,
        body: msg.body || msg.content,
        timestamp: msg.createdAt
      }));
    }
    
    return context;
  }
  
  /**
   * Log rule execution
   */
  async logExecution(rule, contact, conversation, message, status, responseMessageId, error, executionTime, triggerContext = {}, processingDetails = {}) {
    try {
      // Prepare metadata with all necessary display information
      const metadata = {
        ruleName: rule.name,
        ruleType: rule.ruleType,
        rulePriority: rule.priority || 0,
        matchedKeywords: triggerContext.matchedKeywords || [],
        intentDetection: message.detectedIntent || processingDetails.detectedIntent || null,
        templateUsed: processingDetails.templateUsed || null,
        responseContent: processingDetails.responseContent || null,
        entities: processingDetails.extractedEntities || null,
        // AI-specific metadata
        aiModel: processingDetails.aiModel || null,
        temperature: processingDetails.temperature || null,
        tokensUsed: processingDetails.tokensUsed || null,
        tokensPerSecond: processingDetails.tokensPerSecond || null,
        promptTokens: processingDetails.promptTokens || null,
        completionTokens: processingDetails.completionTokens || null,
        aiResponsePreview: processingDetails.aiResponsePreview || null
      };
      
      // Prepare trigger data with message content
      const triggerData = {
        messageContent: message.body || message.content || '',
        timestamp: new Date(),
        phoneNumber: contact.phoneNumber,
        contactName: contact.name || null,
        conversationType: conversation.isGroup ? 'group' : 'direct'
      };
      
      await AutomationLog.create({
        ruleId: rule.id,
        contactId: contact.id,
        conversationId: conversation.id,
        messageId: message.id,
        triggerType: rule.ruleType,
        triggerData: triggerData,
        metadata: metadata,
        status,
        responseMessageId,
        executionTime,
        error,
        skippedReason: error
      });
      
      logger.info('Automation execution logged:', {
        ruleId: rule.id,
        ruleName: rule.name,
        status,
        executionTime,
        hasMetadata: true,
        hasTriggerData: true
      });
    } catch (err) {
      logger.error('Error logging automation execution:', err);
    }
  }
  
  /**
   * Send template-based response
   */
  async sendTemplateBasedResponse(rule, message, contact, conversation) {
    try {
      logger.info('=== SENDING TEMPLATE-BASED RESPONSE ===');
      logger.info(`Rule: ${rule.name}, Contact: ${contact.phoneNumber}`);
      
      const conditions = rule.triggerConditions || {};
      const messageText = (message.body || message.content || '');
      
      // Step 1: Detect intent if AI enhancement is enabled
      let detectedIntent = null;
      let extractedEntities = {};
      
      if (conditions.useIntentDetection !== false) {
        logger.info('Detecting intent for better template matching...');
        detectedIntent = await IntentDetectionService.detectIntent(messageText);
        
        // If no category specified, use intent to suggest category
        if (!conditions.templateCategory && detectedIntent.intent !== 'other') {
          const suggestedCategory = IntentDetectionService.mapIntentToCategory(detectedIntent.intent);
          if (suggestedCategory) {
            logger.info(`Intent suggests category: ${suggestedCategory}`);
            conditions.templateCategory = suggestedCategory;
          }
        }
        
        // Extract entities
        extractedEntities = await EntityExtractionService.extractEntities(messageText, detectedIntent.intent);
      }
      
      // Step 2: Find matching template with intent support
      const template = await CustomTemplate.findBestMatch(
        messageText, 
        conditions.templateCategory,
        detectedIntent
      );
      
      if (!template) {
        logger.info('No matching template found, falling back to LLM if configured');
        
        // If fallback to LLM is enabled
        if (conditions.fallbackToLLM && rule.llmConfig) {
          // Pass extracted entities to LLM for better context
          rule.extractedEntities = extractedEntities;
          rule.detectedIntent = detectedIntent;
          return await this.sendLLMResponse(rule, message, contact, conversation);
        }
        
        // No template and no fallback
        logger.warn('No template match and no fallback configured');
        return null;
      }
      
      logger.info(`Found matching template: ${template.templateName} (ID: ${template.id})`);
      if (detectedIntent) {
        logger.info(`Matched via intent: ${detectedIntent.intent} (confidence: ${detectedIntent.confidence})`);
      }
      
      // Step 3: Prepare variables with extracted entities
      const baseVariables = await this.extractTemplateVariables(message, contact, conversation);
      const variables = EntityExtractionService.prepareTemplateVariables(
        extractedEntities,
        baseVariables
      );
      
      // Step 4: Fill template with enriched variables
      const filledContent = template.fillTemplate(variables);
      
      // Step 5: Check if template has media files
      let lastResponseId = null;
      
      if (template.mediaFiles && template.mediaFiles.length > 0) {
        logger.info(`Template has ${template.mediaFiles.length} media files to send`);
        
        // Send each media file
        for (let i = 0; i < template.mediaFiles.length; i++) {
          const mediaPath = template.mediaFiles[i];
          
          // Encode the path for URL
          const encodedPath = Buffer.from(mediaPath).toString('base64');
          const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3003}`;
          const mediaUrl = `${baseUrl}/api/media/local/${encodedPath}`;
          
          logger.info(`Sending media ${i + 1}/${template.mediaFiles.length}: ${mediaPath}`);
          
          const mediaResponse = await this.createOutgoingMessage({
            conversationId: conversation.id,
            fromNumber: process.env.BOT_PHONE_NUMBER || '628113032232',
            toNumber: contact.phoneNumber,
            messageType: 'image',
            content: '', // Empty content for media
            mediaUrl: mediaUrl,
            templateId: template.id
          });
          
          lastResponseId = mediaResponse?.id;
          
          // Add delay between media messages if configured
          if (i < template.mediaFiles.length - 1 && rule.messageDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, rule.messageDelay * 1000));
          }
        }
        
        // Add delay before text message if configured
        if (rule.messageDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, rule.messageDelay * 1000));
        }
      }
      
      // Send the text response
      logger.info(`Sending template response: "${filledContent}"`);
      
      const response = await this.createOutgoingMessage({
        conversationId: conversation.id,
        fromNumber: process.env.BOT_PHONE_NUMBER || '628113032232',
        toNumber: contact.phoneNumber,
        messageType: 'text',
        content: filledContent,
        templateId: template.id
      });
      
      // Update template usage stats
      await template.incrementUsage();
      
      // Log template usage with intent info
      logger.info(`Template response sent successfully`, {
        templateId: template.id,
        templateName: template.templateName,
        intent: detectedIntent?.intent,
        confidence: detectedIntent?.confidence,
        entitiesExtracted: Object.keys(extractedEntities).length,
        responseId: response?.id
      });
      
      // Return detailed response information
      return {
        messageId: lastResponseId || response?.id,
        templateUsed: template.templateName,
        detectedIntent: detectedIntent,
        extractedEntities: extractedEntities,
        responseContent: filledContent,
        mediaFilesSent: template.mediaFiles?.length || 0
      };
      
    } catch (error) {
      logger.error('Error sending template-based response:', error);
      throw error;
    }
  }
  
  /**
   * Extract variables for template filling
   */
  async extractTemplateVariables(message, contact, conversation) {
    const variables = {
      nama: contact.name || contact.phoneNumber,
      nomor: contact.phoneNumber,
      tanggal: new Date().toLocaleDateString('id-ID'),
      waktu: new Date().toLocaleTimeString('id-ID'),
      hari: new Date().toLocaleDateString('id-ID', { weekday: 'long' })
    };
    
    // Extract customer phase data if available
    const customerPhase = await CustomerPhase.findOne({
      where: { contactId: contact.id }
    });
    
    if (customerPhase) {
      variables.fase = customerPhase.currentPhase;
      variables.jumlah_orang = customerPhase.partySize || '';
      variables.kota_keberangkatan = customerPhase.departureCity || '';
      variables.budget = customerPhase.budget || '';
    }
    
    return variables;
  }
  
  /**
   * Process scheduled rules (for away messages)
   */
  async processScheduledRules() {
    try {
      const awayRules = await AutomationRule.findAll({
        where: {
          ruleType: 'away',
          isActive: true
        }
      });
      
      // Check each rule's schedule
      for (const rule of awayRules) {
        // This would be called periodically to check schedules
        // Implementation depends on how schedules are stored
      }
    } catch (error) {
      logger.error('Error processing scheduled rules:', error);
    }
  }
  
  /**
   * Auto-label conversation based on detected intent
   */
  async autoLabelByIntent(conversation, contact, detectedIntent) {
    try {
      const wahaService = require('./RealWAHAService');
      const { WhatsAppLabel, ConversationLabel } = require('../models');
      
      // Map intents to label names
      const intentLabelMap = {
        'greeting': '🔍 New Lead',
        'inquiry_price': '💰 Price Inquiry',
        'inquiry_package': '📦 Package Info',
        'booking_intent': '✅ Ready to Book',
        'inquiry_document': '📦 Package Info',
        'inquiry_payment': '💰 Price Inquiry',
        'inquiry_schedule': '📦 Package Info',
        'inquiry_facility': '📦 Package Info',
        'complaint': '⚠️ Need Attention',
        'thanks': '🤔 Considering',
        'general_question': '🔍 New Lead'
      };
      
      const labelName = intentLabelMap[detectedIntent.intent];
      if (!labelName) {
        logger.info('No label mapping for intent:', detectedIntent.intent);
        return;
      }
      
      // Get or create label in WhatsApp
      const labels = await wahaService.getLabels('default');
      let targetLabel = labels.find(l => l.name === labelName);
      
      if (!targetLabel) {
        // Initialize CRM labels if not exists
        const initializedLabels = await wahaService.initializeCRMLabels('default');
        targetLabel = initializedLabels.find(l => l.name === labelName);
      }
      
      if (!targetLabel) {
        logger.error('Could not find or create label:', labelName);
        return;
      }
      
      // Sync label to local database
      const [localLabel] = await WhatsAppLabel.findOrCreate({
        where: { id: targetLabel.id },
        defaults: {
          name: targetLabel.name,
          color: targetLabel.color,
          colorHex: targetLabel.colorHex,
          sessionId: 'default'
        }
      });
      
      // Check if label already assigned
      const existingLabel = await ConversationLabel.findOne({
        where: {
          conversationId: conversation.id,
          labelId: localLabel.id
        }
      });
      
      if (existingLabel) {
        logger.info('Label already assigned to conversation');
        return;
      }
      
      // Add label to WhatsApp chat
      const chatId = contact.phoneNumber.includes('@') ? 
        contact.phoneNumber : `${contact.phoneNumber}@c.us`;
      
      const result = await wahaService.addLabelToChat('default', chatId, targetLabel.id);
      
      if (result.success) {
        // Save to database
        await ConversationLabel.create({
          conversationId: conversation.id,
          labelId: localLabel.id,
          assignedBy: 'automation',
          reason: `Intent: ${detectedIntent.intent} (${Math.round(detectedIntent.confidence * 100)}%)`,
          metadata: {
            intent: detectedIntent.intent,
            confidence: detectedIntent.confidence,
            autoLabeled: true
          }
        });
        
        logger.info('Auto-labeled conversation:', {
          conversationId: conversation.id,
          label: labelName,
          intent: detectedIntent.intent,
          confidence: detectedIntent.confidence
        });
        
        // Emit event for real-time update
        if (global.io) {
          global.io.emit('conversation:labeled', {
            conversationId: conversation.id,
            label: {
              id: localLabel.id,
              name: localLabel.name,
              color: localLabel.color
            },
            reason: 'auto-intent'
          });
        }
      }
    } catch (error) {
      logger.error('Error in auto-labeling:', error);
    }
  }
}

module.exports = new AutomationEngine();
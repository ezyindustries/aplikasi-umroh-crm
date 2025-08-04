const { AutomationRule, Message, Contact, Conversation } = require('./backend/whatsapp/src/models');
const AutomationEngine = require('./backend/whatsapp/src/services/AutomationEngine');
const logger = require('./backend/whatsapp/src/utils/logger');

async function testKeywordRule() {
  try {
    console.log('=== TESTING KEYWORD RULE MANUALLY ===\n');
    
    // Get the test123 keyword rule
    const rule = await AutomationRule.findOne({
      where: { name: 'Test Rule - test123' }
    });
    
    if (!rule) {
      console.log('❌ Test rule not found');
      return;
    }
    
    console.log('Rule found:', {
      id: rule.id,
      name: rule.name,
      ruleType: rule.ruleType,
      isActive: rule.isActive,
      keywords: rule.keywords,
      responseMessages: rule.responseMessages
    });
    
    // Create a mock message, contact, and conversation
    const mockMessage = {
      id: 'test_msg_' + Date.now(),
      body: 'test123',
      content: 'test123',
      fromMe: false,
      isGroupMessage: false,
      direction: 'inbound',
      messageType: 'text'
    };
    
    const mockContact = {
      id: 'test_contact_' + Date.now(),
      phoneNumber: '6281234567890',
      name: 'Test Contact'
    };
    
    const mockConversation = {
      id: 'test_conv_' + Date.now(),
      isGroup: false,
      sessionPhoneNumber: '628113032232'
    };
    
    console.log('\nTesting shouldRuleTrigger...');
    
    // Test shouldRuleTrigger
    const shouldTrigger = await AutomationEngine.shouldRuleTrigger(rule, mockMessage, mockContact, mockConversation);
    console.log('shouldRuleTrigger result:', shouldTrigger);
    
    if (!shouldTrigger.trigger) {
      console.log('❌ Rule should not trigger:', shouldTrigger.reason);
      return;
    }
    
    console.log('✅ Rule should trigger!');
    
    // Test rate limits
    console.log('\nTesting rate limits...');
    const canTrigger = await AutomationEngine.checkRateLimits(rule, mockContact);
    console.log('Rate limits result:', canTrigger);
    
    if (!canTrigger.allowed) {
      console.log('❌ Rate limit blocked:', canTrigger.reason);
      return;
    }
    
    console.log('✅ Rate limits passed!');
    
    // Test the complete evaluation
    console.log('\nTesting complete rule evaluation...');
    await AutomationEngine.evaluateRule(rule, mockMessage, mockContact, mockConversation);
    
    console.log('✅ Rule evaluation completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testKeywordRule();
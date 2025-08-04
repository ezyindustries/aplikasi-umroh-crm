const { AutomationRule, Message, Contact, Conversation } = require('./backend/whatsapp/src/models');
const AutomationEngine = require('./backend/whatsapp/src/services/AutomationEngine');

async function testWithRealData() {
  try {
    console.log('=== TESTING WITH REAL DATABASE DATA ===\n');
    
    // Get a real contact and conversation
    const contact = await Contact.findOne();
    const conversation = await Conversation.findOne();
    
    if (!contact || !conversation) {
      console.log('❌ No real contact or conversation found in database');
      return;
    }
    
    console.log('Using real contact:', {
      id: contact.id,
      phoneNumber: contact.phoneNumber,
      name: contact.name
    });
    
    console.log('Using real conversation:', {
      id: conversation.id,
      isGroup: conversation.isGroup
    });
    
    // Get the test123 keyword rule
    const rule = await AutomationRule.findOne({
      where: { name: 'Test Rule - test123' }
    });
    
    if (!rule) {
      console.log('❌ Test rule not found');
      return;
    }
    
    console.log('Using rule:', {
      id: rule.id,
      name: rule.name,
      keywords: rule.keywords
    });
    
    // Create a test message that should trigger the rule
    const testMessage = await Message.create({
      conversationId: conversation.id,
      whatsappMessageId: `test_${Date.now()}`,
      fromNumber: contact.phoneNumber,
      toNumber: conversation.sessionPhoneNumber || '628113032232',
      messageType: 'text',
      content: 'test123',
      body: 'test123',
      status: 'received',
      direction: 'inbound',
      fromMe: false,
      isGroupMessage: false
    });
    
    console.log('Created test message:', {
      id: testMessage.id,
      content: testMessage.content,
      fromMe: testMessage.fromMe
    });
    
    // Test the shouldRuleTrigger method
    console.log('\n--- Testing shouldRuleTrigger ---');
    const shouldTrigger = await AutomationEngine.shouldRuleTrigger(rule, testMessage, contact, conversation);
    console.log('Result:', shouldTrigger);
    
    if (!shouldTrigger.trigger) {
      console.log('❌ Rule should not trigger:', shouldTrigger.reason);
      return;
    }
    
    console.log('✅ Rule should trigger!');
    
    // Test rate limits
    console.log('\n--- Testing rate limits ---');
    const canTrigger = await AutomationEngine.checkRateLimits(rule, contact);
    console.log('Rate limits result:', canTrigger);
    
    if (!canTrigger.allowed) {
      console.log('❌ Rate limit blocked:', canTrigger.reason);
      return;
    }
    
    console.log('✅ Rate limits OK!');
    
    // Now test the complete evaluation (this will also send the message)
    console.log('\n--- Testing complete rule evaluation ---');
    console.log('This will actually send a message...');
    
    await AutomationEngine.evaluateRule(rule, testMessage, contact, conversation);
    
    console.log('✅ Rule evaluation completed successfully!');
    
    // Clean up - delete the test message
    await testMessage.destroy();
    console.log('Test message cleaned up');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testWithRealData();
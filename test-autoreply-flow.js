// Test script to check autoreply flow manually
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/whatsapp/.env') });

// Import required modules
const { AutomationRule, Message, Contact, Conversation } = require('./backend/whatsapp/src/models');
const automationEngine = require('./backend/whatsapp/src/services/AutomationEngine');
const logger = require('./backend/whatsapp/src/utils/logger');

async function testAutoreplyFlow() {
    try {
        console.log('=== TESTING AUTOREPLY FLOW ===\n');
        
        // 1. Check active rules
        console.log('1. Checking active automation rules...');
        const rules = await AutomationRule.findAll({
            where: { isActive: true, ruleType: 'keyword' }
        });
        
        console.log(`Found ${rules.length} active keyword rules:`);
        rules.forEach(rule => {
            console.log(`  - ${rule.name}: keywords = ${JSON.stringify(rule.keywords)}`);
        });
        
        if (rules.length === 0) {
            console.log('\n❌ No active keyword rules found!');
            console.log('Please create a keyword rule with keyword "123" first.');
            return;
        }
        
        // 2. Create a mock message
        const testKeyword = '123';
        const testPhone = '6281234567890';
        
        console.log(`\n2. Creating mock message with keyword "${testKeyword}"...`);
        
        // Find or create contact
        const [contact] = await Contact.findOrCreate({
            where: { phoneNumber: testPhone },
            defaults: {
                name: 'Test Contact',
                isBlocked: false
            }
        });
        console.log(`Contact: ${contact.phoneNumber} (${contact.name})`);
        
        // Find or create conversation
        const [conversation] = await Conversation.findOrCreate({
            where: { contactId: contact.id },
            defaults: {
                sessionId: 'default',
                isGroup: false,
                status: 'active'
            }
        });
        console.log(`Conversation ID: ${conversation.id}`);
        
        // Create mock message
        const mockMessage = {
            id: 'test-' + Date.now(),
            content: testKeyword,
            body: testKeyword,
            messageType: 'text',
            conversationId: conversation.id,
            fromNumber: testPhone,
            direction: 'inbound',
            status: 'received'
        };
        
        console.log('\n3. Processing message through automation engine...');
        
        // Process message
        await automationEngine.processMessage(mockMessage, contact, conversation);
        
        console.log('\n✅ Message processed! Check console logs above for details.');
        console.log('If autoreply worked, you should see logs about:');
        console.log('  - Rule evaluation');
        console.log('  - Keyword matching');
        console.log('  - Message sending');
        
    } catch (error) {
        console.error('\n❌ Error testing autoreply:', error);
    }
}

// Run test
testAutoreplyFlow();
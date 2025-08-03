// Direct test automation engine
// This bypasses webhook and directly tests if automation engine works

const path = require('path');
const sequelize = require('./backend/whatsapp/src/config/database');

// Initialize database and models
async function init() {
    // Import models
    const { AutomationRule, Contact, Conversation, Message } = require('./backend/whatsapp/src/models');
    const automationEngine = require('./backend/whatsapp/src/services/AutomationEngine');
    const logger = require('./backend/whatsapp/src/utils/logger');
    
    console.log('=== DIRECT AUTOMATION ENGINE TEST ===\n');
    
    try {
        // Step 1: Check active rules
        console.log('1. Checking active keyword rules...');
        const rules = await AutomationRule.findAll({
            where: { 
                ruleType: 'keyword',
                isActive: true 
            }
        });
        
        console.log(`Found ${rules.length} active keyword rules:`);
        rules.forEach(rule => {
            console.log(`  - ${rule.name}: keywords = ${JSON.stringify(rule.keywords)}`);
        });
        
        if (rules.length === 0) {
            console.log('\n❌ No active keyword rules! Create one with keyword "123" first.');
            process.exit(1);
        }
        
        // Step 2: Create test contact and conversation
        console.log('\n2. Creating test contact and conversation...');
        
        const [contact] = await Contact.findOrCreate({
            where: { phoneNumber: '6281234567890' },
            defaults: {
                name: 'Test User',
                isBlocked: false
            }
        });
        console.log(`Contact: ${contact.phoneNumber}`);
        
        const [conversation] = await Conversation.findOrCreate({
            where: { 
                contactId: contact.id,
                sessionId: 'default'
            },
            defaults: {
                isGroup: false,
                status: 'active'
            }
        });
        console.log(`Conversation: ${conversation.id}`);
        
        // Step 3: Create test message
        console.log('\n3. Creating test message with body "123"...');
        const testMessage = await Message.create({
            conversationId: conversation.id,
            whatsappMessageId: 'test-' + Date.now(),
            fromNumber: contact.phoneNumber,
            toNumber: 'default',
            messageType: 'text',
            content: '123',
            body: '123',  // Make sure body is set
            status: 'received',
            direction: 'inbound'
        });
        console.log(`Message created: ${testMessage.id}`);
        
        // Step 4: Process through automation engine
        console.log('\n4. Processing message through automation engine...');
        console.log('Calling automationEngine.processMessage()...');
        
        await automationEngine.processMessage(testMessage, contact, conversation);
        
        console.log('\n✅ Automation engine processing complete!');
        
        // Step 5: Check for outgoing messages
        console.log('\n5. Checking for outgoing messages...');
        const outgoingMessages = await Message.findAll({
            where: {
                conversationId: conversation.id,
                direction: 'outbound'
            },
            order: [['createdAt', 'DESC']],
            limit: 5
        });
        
        if (outgoingMessages.length > 0) {
            console.log(`\n✅ Found ${outgoingMessages.length} outgoing message(s):`);
            outgoingMessages.forEach(msg => {
                console.log(`  - [${msg.status}] ${msg.content}`);
            });
        } else {
            console.log('\n❌ No outgoing messages found!');
            console.log('Check backend console for error logs.');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        // Close database connection
        await sequelize.close();
        process.exit(0);
    }
}

// Run test
init();
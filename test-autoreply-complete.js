// Complete autoreply test - simulates webhook → WebhookHandler → MessageQueue → AutomationEngine flow
const path = require('path');

// Initialize environment
process.env.NODE_ENV = 'development';

async function testCompleteAutoreplyFlow() {
    console.log('=== TESTING COMPLETE AUTOREPLY FLOW ===\n');
    
    try {
        // Initialize database
        const sequelize = require('./backend/whatsapp/src/config/database');
        await sequelize.authenticate();
        console.log('✓ Database connected');
        
        // Import all required modules
        const webhookHandler = require('./backend/whatsapp/src/services/WebhookHandler');
        const { AutomationRule, Contact, Conversation, Message } = require('./backend/whatsapp/src/models');
        
        // Check if we have a keyword rule
        const keywordRule = await AutomationRule.findOne({
            where: { 
                is_active: true,
                rule_type: 'keyword'
            }
        });
        
        if (!keywordRule) {
            console.log('❌ No active keyword rule found!');
            process.exit(1);
        }
        
        console.log(`\n✓ Found active keyword rule: "${keywordRule.keywords}" → "${keywordRule.response_message}"`);
        
        // Create test webhook event
        const testPhoneNumber = '6281234567890';
        const testEvent = {
            event: 'message',
            session: 'default',
            payload: {
                id: 'test-complete-' + Date.now(),
                from: testPhoneNumber + '@c.us',
                to: 'default@c.us',
                type: 'text',
                body: keywordRule.keywords.split(',')[0].trim(), // Use first keyword
                timestamp: Math.floor(Date.now() / 1000),
                fromMe: false,
                pushname: 'Test User'
            }
        };
        
        console.log(`\n1. Created test event with message: "${testEvent.payload.body}"`);
        
        // Call webhook handler
        console.log('\n2. Processing through webhook handler...');
        await webhookHandler.handleWebhook(testEvent);
        
        // Wait for processing
        console.log('\n3. Waiting for processing to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check results
        console.log('\n4. Checking results...');
        
        // Find contact
        const contact = await Contact.findOne({
            where: { phoneNumber: testPhoneNumber }
        });
        
        if (!contact) {
            console.log('❌ Contact not created!');
            process.exit(1);
        }
        console.log(`✓ Contact found: ${contact.name} (${contact.phoneNumber})`);
        
        // Find conversation
        const conversation = await Conversation.findOne({
            where: { contactId: contact.id }
        });
        
        if (!conversation) {
            console.log('❌ Conversation not created!');
            process.exit(1);
        }
        console.log(`✓ Conversation found: ${conversation.id}`);
        
        // Find messages
        const messages = await Message.findAll({
            where: { conversationId: conversation.id },
            order: [['createdAt', 'DESC']]
        });
        
        console.log(`\n✓ Found ${messages.length} messages:`);
        messages.forEach((msg, index) => {
            console.log(`  ${index + 1}. [${msg.direction}] ${msg.content} (${msg.status})`);
        });
        
        // Check for autoreply
        const autoreplyMessage = messages.find(msg => 
            msg.direction === 'outbound' && 
            msg.content === keywordRule.response_message
        );
        
        if (autoreplyMessage) {
            console.log('\n✅ SUCCESS! Autoreply message was created!');
            console.log(`   Content: "${autoreplyMessage.content}"`);
            console.log(`   Status: ${autoreplyMessage.status}`);
            console.log(`   Created: ${autoreplyMessage.createdAt}`);
        } else {
            console.log('\n❌ FAILED! No autoreply message found!');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

// Run test
testCompleteAutoreplyFlow();
// Direct test webhook handler
const http = require('http');
const path = require('path');

// Initialize environment
process.env.NODE_ENV = 'development';
const sequelize = require('./backend/whatsapp/src/config/database');

async function testWebhookHandler() {
    console.log('=== TESTING WEBHOOK HANDLER DIRECTLY ===\n');
    
    try {
        // Import handlers
        const webhookHandler = require('./backend/whatsapp/src/services/WebhookHandler');
        const { Contact, Conversation, Message } = require('./backend/whatsapp/src/models');
        
        // Create test event
        const testEvent = {
            event: 'message',
            session: 'default',
            payload: {
                id: 'test-direct-' + Date.now(),
                from: '6281234567890@c.us',
                to: 'default@c.us',
                type: 'text',
                body: '123',
                timestamp: Math.floor(Date.now() / 1000),
                fromMe: false
            }
        };
        
        console.log('1. Test event created:', testEvent);
        
        // Call webhook handler directly
        console.log('\n2. Calling webhookHandler.handleWebhook()...');
        await webhookHandler.handleWebhook(testEvent);
        
        console.log('\n3. Webhook handled! Checking database...');
        
        // Wait a bit for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for messages
        const contact = await Contact.findOne({
            where: { phoneNumber: '6281234567890' }
        });
        
        if (contact) {
            console.log('\n4. Found contact:', contact.phoneNumber);
            
            const conversation = await Conversation.findOne({
                where: { contactId: contact.id }
            });
            
            if (conversation) {
                console.log('5. Found conversation:', conversation.id);
                
                const messages = await Message.findAll({
                    where: { 
                        conversationId: conversation.id,
                        direction: 'outbound'
                    },
                    order: [['createdAt', 'DESC']],
                    limit: 5
                });
                
                if (messages.length > 0) {
                    console.log('\n✅ AUTOREPLY MESSAGES FOUND:');
                    messages.forEach(msg => {
                        console.log(`  - [${msg.status}] ${msg.content}`);
                    });
                } else {
                    console.log('\n❌ No autoreply messages found');
                }
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

// Run test
testWebhookHandler();
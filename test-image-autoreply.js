// Test image autoreply functionality
const path = require('path');

// Initialize environment
process.env.NODE_ENV = 'development';

async function testImageAutoreply() {
    console.log('=== TESTING IMAGE AUTOREPLY ===\n');
    
    try {
        // Initialize database
        const sequelize = require('./backend/whatsapp/src/config/database');
        await sequelize.authenticate();
        console.log('✓ Database connected');
        
        // Import models
        const { AutomationRule } = require('./backend/whatsapp/src/models');
        
        // Find active keyword rule with image
        const rules = await AutomationRule.findAll({
            where: { 
                is_active: true,
                rule_type: 'keyword'
            }
        });
        
        console.log(`\nFound ${rules.length} active keyword rules\n`);
        
        // Check each rule
        for (const rule of rules) {
            console.log(`Rule: ${rule.name} (ID: ${rule.id})`);
            console.log(`Keywords: ${JSON.stringify(rule.keywords)}`);
            console.log(`Response Messages:`, JSON.stringify(rule.responseMessages, null, 2));
            
            // Check if has image messages
            if (rule.responseMessages && rule.responseMessages.length > 0) {
                const imageMessages = rule.responseMessages.filter(msg => msg.type === 'image');
                if (imageMessages.length > 0) {
                    console.log(`\n✓ Found ${imageMessages.length} image messages:`);
                    imageMessages.forEach((msg, index) => {
                        console.log(`  ${index + 1}. Image URL: ${msg.mediaUrl || msg.url}`);
                        console.log(`     Caption: ${msg.caption || '(no caption)'}`);
                    });
                }
            }
            console.log('\n---\n');
        }
        
        // Test automation engine directly
        console.log('Testing AutomationEngine with image message...\n');
        
        const automationEngine = require('./backend/whatsapp/src/services/AutomationEngine');
        const { Contact, Conversation, Message } = require('./backend/whatsapp/src/models');
        
        // Find a rule with image
        const ruleWithImage = rules.find(r => 
            r.responseMessages && 
            r.responseMessages.some(m => m.type === 'image')
        );
        
        if (ruleWithImage) {
            console.log(`Using rule: ${ruleWithImage.name}`);
            
            // Create test contact and conversation
            const testPhone = '6281234567890';
            const [contact] = await Contact.findOrCreate({
                where: { phoneNumber: testPhone },
                defaults: { name: 'Test Contact', source: 'whatsapp' }
            });
            
            const [conversation] = await Conversation.findOrCreate({
                where: { contactId: contact.id },
                defaults: { sessionId: 'default', status: 'active' }
            });
            
            // Create test message
            const message = await Message.create({
                conversationId: conversation.id,
                fromNumber: testPhone,
                toNumber: 'default',
                messageType: 'text',
                content: ruleWithImage.keywords[0], // Use first keyword
                direction: 'inbound',
                status: 'received'
            });
            
            console.log(`\nCreated test message with keyword: "${message.content}"`);
            
            // Process message
            console.log('Processing message through AutomationEngine...');
            await automationEngine.processMessage(message, contact, conversation);
            
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for outbound messages
            const outboundMessages = await Message.findAll({
                where: {
                    conversationId: conversation.id,
                    direction: 'outbound'
                },
                order: [['createdAt', 'DESC']]
            });
            
            console.log(`\nFound ${outboundMessages.length} outbound messages:`);
            outboundMessages.forEach((msg, index) => {
                console.log(`  ${index + 1}. Type: ${msg.messageType}`);
                console.log(`     Content: ${msg.content || '(empty)'}`);
                console.log(`     Media URL: ${msg.mediaUrl || '(none)'}`);
                console.log(`     Status: ${msg.status}`);
            });
        } else {
            console.log('No rule with image messages found!');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

// Run test
testImageAutoreply();
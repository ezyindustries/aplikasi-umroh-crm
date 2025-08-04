const { Message, Contact, Conversation } = require('./backend/whatsapp/src/models');
const automationEngine = require('./backend/whatsapp/src/services/AutomationEngine');
const sessionController = require('./backend/whatsapp/src/controllers/SessionController');

async function configureWebhookAndTest() {
    console.log('🔧 CONFIGURING WEBHOOK AND TESTING AUTOREPLY\n');
    
    try {
        // 1. Set webhook using backend method
        console.log('1️⃣ Setting webhook via backend...');
        
        const webhookResult = await sessionController.setWebhook({
            params: { sessionId: 'default' },
            body: {
                url: 'http://host.docker.internal:3003/api/webhooks/waha',
                events: ['message', 'message.any', 'state.change']
            }
        }, {
            json: (data) => console.log('   Result:', data),
            status: (code) => ({ json: (data) => console.log(`   Status ${code}:`, data) })
        });
        
        console.log('   ✅ Webhook configuration attempted\n');
        
        // 2. Create a test message directly in the system
        console.log('2️⃣ Creating test message in database...');
        
        // Find or create test contact
        let contact = await Contact.findOne({
            where: { phoneNumber: '6281234567890' }
        });
        
        if (!contact) {
            contact = await Contact.create({
                phoneNumber: '6281234567890',
                name: 'Test Customer',
                conversationId: null
            });
        }
        
        // Find or create conversation
        let conversation = await Conversation.findOne({
            where: { contactId: contact.id }
        });
        
        if (!conversation) {
            conversation = await Conversation.create({
                contactId: contact.id,
                contactPhone: contact.phoneNumber,
                contactName: contact.name,
                status: 'active',
                phase: 'leads'
            });
            
            await contact.update({ conversationId: conversation.id });
        }
        
        // Create test message
        const testMessage = await Message.create({
            conversationId: conversation.id,
            whatsappMessageId: 'test_' + Date.now(),
            fromNumber: contact.phoneNumber,
            toNumber: '628113032232',
            messageType: 'text',
            content: 'paket umroh 9 hari dari surabaya',
            status: 'received',
            direction: 'incoming',
            sentAt: new Date()
        });
        
        console.log('   ✅ Test message created\n');
        
        // 3. Process through automation engine
        console.log('3️⃣ Processing message through AutomationEngine...');
        
        const masterEnabled = await automationEngine.isMasterEnabled();
        console.log(`   Master switch: ${masterEnabled ? 'ON' : 'OFF'}`);
        
        if (!masterEnabled) {
            console.log('   Enabling master switch...');
            await automationEngine.setMasterSwitch(true);
        }
        
        // Process the message
        await automationEngine.processMessage(testMessage, contact, conversation);
        
        console.log('   ✅ Message processed\n');
        
        // 4. Check results
        console.log('4️⃣ Checking results...');
        
        // Wait a bit for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for response messages
        const responses = await Message.findAll({
            where: {
                conversationId: conversation.id,
                direction: 'outgoing',
                createdAt: {
                    [require('sequelize').Op.gte]: new Date(Date.now() - 60000)
                }
            },
            order: [['createdAt', 'DESC']]
        });
        
        if (responses.length > 0) {
            console.log(`   ✅ Found ${responses.length} response messages!`);
            responses.forEach((msg, i) => {
                console.log(`   Response ${i + 1}: ${msg.messageType} - ${msg.content?.substring(0, 50)}...`);
            });
        } else {
            console.log('   ❌ No response messages found');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 DIAGNOSIS:\n');
        
        if (responses.length > 0) {
            console.log('✅ Autoreply is working in the system!');
            console.log('\nThe issue might be:');
            console.log('1. Webhook not receiving messages from WAHA');
            console.log('2. Messages not being saved to database');
            console.log('\nSolution: Run restart-waha-webhook.bat');
        } else {
            console.log('❌ Autoreply is not processing messages');
            console.log('\nPossible issues:');
            console.log('1. No matching rules for the test message');
            console.log('2. Templates not properly configured');
            console.log('3. Automation engine errors');
            console.log('\nCheck backend console for error logs');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

// Run the test
configureWebhookAndTest();
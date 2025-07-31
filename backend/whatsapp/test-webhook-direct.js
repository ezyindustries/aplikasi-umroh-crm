const axios = require('axios');

async function testWebhook() {
    console.log('=== Testing Webhook Directly ===\n');
    
    // Check webhook configuration
    try {
        console.log('[1] Checking current webhook configuration...');
        const sessionInfo = await axios.get('http://localhost:3000/api/sessions/default');
        
        if (sessionInfo.data.config && sessionInfo.data.config.webhooks) {
            console.log('Current webhooks:');
            sessionInfo.data.config.webhooks.forEach(wh => {
                console.log(`  - URL: ${wh.url}`);
                console.log(`  - Events: ${wh.events.join(', ')}`);
            });
        } else {
            console.log('No webhooks configured!');
        }
    } catch (error) {
        console.error('Error checking webhook:', error.message);
    }
    
    // Send test message to our webhook
    console.log('\n[2] Sending test media message to webhook...');
    
    const testPayload = {
        event: 'message',
        session: 'default',
        payload: {
            id: 'test_' + Date.now(),
            timestamp: Math.floor(Date.now() / 1000),
            from: '6281234567890@c.us',
            to: '628987654321@c.us',
            fromMe: false,
            type: 'image',
            body: '',
            hasMedia: true,
            media: {
                id: 'media_test_123',
                mimetype: 'image/jpeg',
                filename: 'test-image.jpg',
                filesize: 123456,
                data: null
            },
            caption: 'Test image caption'
        }
    };
    
    try {
        const response = await axios.post('http://localhost:3001/api/webhooks/waha', testPayload);
        console.log('✅ Webhook response:', response.data);
        
        // Wait a bit for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if message was saved
        console.log('\n[3] Checking if test message was saved...');
        const { Message } = require('./src/models');
        const testMessage = await Message.findOne({
            where: { whatsappMessageId: testPayload.payload.id },
            order: [['createdAt', 'DESC']]
        });
        
        if (testMessage) {
            console.log('✅ Message saved in database!');
            console.log('  Type:', testMessage.messageType);
            console.log('  Media ID:', testMessage.mediaId);
            console.log('  Caption:', testMessage.mediaCaption || testMessage.content);
        } else {
            console.log('❌ Message not found in database');
        }
        
    } catch (error) {
        console.error('❌ Webhook error:', error.response?.data || error.message);
    }
}

// Run test
testWebhook().then(() => {
    console.log('\nTest complete!');
    process.exit(0);
}).catch(console.error);
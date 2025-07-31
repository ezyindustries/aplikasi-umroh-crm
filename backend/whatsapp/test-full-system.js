const axios = require('axios');
const { Message, Contact, Conversation } = require('./src/models');

console.log('=== FULL SYSTEM TEST FOR MEDIA & GROUP ===\n');

async function testSystem() {
    try {
        // 1. Check WAHA webhook config
        console.log('[1] Checking WAHA webhook configuration...');
        const sessionInfo = await axios.get('http://localhost:3000/api/sessions/default');
        
        if (sessionInfo.data.config?.webhooks?.length > 0) {
            const webhook = sessionInfo.data.config.webhooks[0];
            console.log('✅ Webhook configured:');
            console.log('   URL:', webhook.url);
            console.log('   Events:', webhook.events.join(', '));
        } else {
            console.log('❌ No webhook configured!');
            console.log('   Run: UPDATE-WEBHOOK.bat');
        }
        
        // 2. Check recent messages in database
        console.log('\n[2] Checking recent messages in database...');
        const recentMessages = await Message.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        console.log(`Found ${recentMessages.length} recent messages:\n`);
        
        let hasMedia = false;
        let hasGroup = false;
        
        recentMessages.forEach((msg, i) => {
            console.log(`[${i+1}] Message Details:`);
            console.log(`   ID: ${msg.id}`);
            console.log(`   Type: ${msg.messageType}`);
            console.log(`   Content: ${msg.content?.substring(0, 50) || '[No content]'}`);
            console.log(`   Media ID: ${msg.mediaId || 'NULL'}`);
            console.log(`   Is Group: ${msg.isGroupMessage}`);
            console.log(`   From: ${msg.fromNumber}`);
            console.log(`   Created: ${msg.createdAt.toLocaleString()}`);
            
            // Remove conversation check since we're not including it
            console.log('');
            
            if (msg.mediaId) hasMedia = true;
            if (msg.isGroupMessage) hasGroup = true;
        });
        
        if (!hasMedia) {
            console.log('⚠️  No media messages found in database');
        }
        if (!hasGroup) {
            console.log('⚠️  No group messages found in database');
        }
        
        // 3. Test API endpoints
        console.log('\n[3] Testing API endpoints...');
        
        // Test conversations endpoint
        const convResponse = await axios.get('http://localhost:3001/api/conversations');
        console.log(`✅ Conversations endpoint: ${convResponse.data.data.length} conversations`);
        
        // Test messages endpoint
        if (convResponse.data.data.length > 0) {
            const convId = convResponse.data.data[0].id;
            const messagesResponse = await axios.get(`http://localhost:3001/api/messages/${convId}`);
            console.log(`✅ Messages endpoint: ${messagesResponse.data.data.length} messages`);
            
            // Check for media messages
            const mediaMessages = messagesResponse.data.data.filter(m => m.mediaId);
            console.log(`   Media messages: ${mediaMessages.length}`);
            
            if (mediaMessages.length > 0) {
                console.log('   Sample media message:');
                console.log(`     Type: ${mediaMessages[0].messageType}`);
                console.log(`     Media ID: ${mediaMessages[0].mediaId}`);
                console.log(`     Media URL: ${mediaMessages[0].mediaUrl}`);
            }
        }
        
        // 4. Test media endpoint
        console.log('\n[4] Testing media download endpoint...');
        const mediaMsg = await Message.findOne({ where: { mediaId: { [require('sequelize').Op.ne]: null } } });
        if (mediaMsg) {
            try {
                const mediaResponse = await axios.get(
                    `http://localhost:3001/api/messages/media/${mediaMsg.mediaId}`,
                    { responseType: 'arraybuffer' }
                );
                console.log(`✅ Media endpoint working! Size: ${mediaResponse.data.byteLength} bytes`);
            } catch (error) {
                console.log(`❌ Media endpoint error: ${error.message}`);
            }
        } else {
            console.log('⚠️  No media message to test');
        }
        
        // 5. Simulate webhook
        console.log('\n[5] Sending test webhook...');
        const testWebhook = {
            event: 'message',
            session: 'default',
            payload: {
                id: 'test_media_' + Date.now(),
                timestamp: Math.floor(Date.now() / 1000),
                from: '6281234567890@c.us',
                to: '628987654321@c.us',
                fromMe: false,
                type: 'image',
                body: '',
                hasMedia: true,
                media: {
                    id: 'test_media_id_123',
                    mimetype: 'image/jpeg',
                    filename: 'test-image.jpg',
                    filesize: 123456
                },
                caption: 'Test image from webhook'
            }
        };
        
        try {
            await axios.post('http://localhost:3001/api/webhooks/waha', testWebhook);
            console.log('✅ Test webhook sent successfully');
            
            // Wait and check if saved
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const testMsg = await Message.findOne({
                where: { whatsappMessageId: testWebhook.payload.id }
            });
            
            if (testMsg) {
                console.log('✅ Test message saved in database!');
                console.log(`   Type: ${testMsg.messageType}`);
                console.log(`   Media ID: ${testMsg.mediaId}`);
            } else {
                console.log('❌ Test message NOT found in database');
            }
        } catch (error) {
            console.log('❌ Webhook test failed:', error.message);
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

// Monitor incoming webhooks
console.log('\n=== MONITORING WEBHOOKS (Press Ctrl+C to stop) ===\n');

const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('✅ Connected to backend WebSocket');
});

socket.on('message:new', (data) => {
    console.log('\n📨 New message via WebSocket:');
    console.log('   Type:', data.message.messageType);
    console.log('   Media ID:', data.message.mediaId);
    console.log('   Is Group:', data.message.isGroupMessage);
    console.log('   Content:', data.message.content?.substring(0, 50));
});

// Run tests
testSystem();
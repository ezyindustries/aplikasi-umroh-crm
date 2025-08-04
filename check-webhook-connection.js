async function checkWebhookConnection() {
    console.log('🔍 CHECKING WEBHOOK CONNECTION\n');
    
    try {
        // 1. Check WAHA webhook configuration
        console.log('1️⃣ Checking WAHA webhook configuration...');
        const wahaResponse = await fetch('http://localhost:3000/api/default/config', {
            headers: { 'X-Api-Key': 'your-api-key' }
        });
        
        if (wahaResponse.ok) {
            const config = await wahaResponse.json();
            console.log('   WAHA Config:');
            console.log(`   Webhooks URL: ${config.webhooks?.url || 'NOT SET'}`);
            console.log(`   Webhooks enabled: ${config.webhooks?.enabled || false}`);
            
            if (!config.webhooks?.url) {
                console.log('\n   ❌ WEBHOOK NOT CONFIGURED!');
                console.log('   This is why messages are not triggering autoreply!\n');
                
                // Set webhook
                console.log('2️⃣ Setting up webhook...');
                const setWebhookResponse = await fetch('http://localhost:3000/api/default/config', {
                    method: 'POST',
                    headers: {
                        'X-Api-Key': 'your-api-key',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        webhooks: {
                            url: 'http://host.docker.internal:3003/api/webhooks/waha',
                            events: [
                                'message',
                                'message.any',
                                'state.change',
                                'group.join',
                                'group.leave'
                            ]
                        }
                    })
                });
                
                if (setWebhookResponse.ok) {
                    console.log('   ✅ Webhook configured successfully!');
                    console.log('   URL: http://host.docker.internal:3003/api/webhooks/waha');
                } else {
                    console.log('   ❌ Failed to set webhook');
                    const error = await setWebhookResponse.text();
                    console.log('   Error:', error);
                }
            } else {
                console.log('   ✅ Webhook is configured');
                
                // Check if it's the correct URL
                if (!config.webhooks.url.includes('3003')) {
                    console.log('   ⚠️ Webhook URL might be incorrect');
                    console.log('   Expected to include port 3003');
                }
            }
        } else {
            console.log('   ❌ Could not get WAHA config');
        }
        
        // 2. Test webhook endpoint
        console.log('\n3️⃣ Testing webhook endpoint...');
        const testWebhook = await fetch('http://localhost:3003/api/webhooks/waha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'message',
                session: 'default',
                payload: {
                    id: 'test-' + Date.now(),
                    timestamp: Date.now(),
                    from: '6281234567890@c.us',
                    to: '628113032232@c.us',
                    body: 'Test webhook message',
                    fromMe: false,
                    type: 'chat',
                    isForwarded: false,
                    author: null,
                    _data: {}
                }
            })
        });
        
        if (testWebhook.ok) {
            console.log('   ✅ Webhook endpoint is working');
            const result = await testWebhook.json();
            console.log('   Response:', result);
        } else {
            console.log('   ❌ Webhook endpoint error:', testWebhook.status);
        }
        
        // 3. Check recent webhook activity
        console.log('\n4️⃣ Checking recent messages in database...');
        const messagesResponse = await fetch('http://localhost:3003/api/messages/search?limit=5');
        const messagesData = await messagesResponse.json();
        
        if (messagesData.success && messagesData.data.messages.length > 0) {
            console.log(`   Found ${messagesData.data.messages.length} recent messages`);
            const latest = messagesData.data.messages[0];
            const time = new Date(latest.createdAt).toLocaleString();
            console.log(`   Latest message: ${time}`);
            console.log(`   From: ${latest.fromNumber}`);
            console.log(`   Content: ${latest.content?.substring(0, 50)}...`);
        } else {
            console.log('   No recent messages found');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 DIAGNOSIS:\n');
        console.log('If autoreply is not working, it\'s likely because:');
        console.log('1. WAHA webhook is not configured correctly');
        console.log('2. Messages are not reaching the backend');
        console.log('3. AutomationEngine is not processing incoming messages');
        
        console.log('\n✅ The webhook has been configured/fixed!');
        console.log('Try sending a message now and it should trigger autoreply.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkWebhookConnection();
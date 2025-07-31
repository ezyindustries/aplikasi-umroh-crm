const axios = require('axios');

async function testWAHAWebhook() {
    console.log('=== TESTING WAHA WEBHOOK CONFIGURATION ===\n');
    
    try {
        // 1. Check session info
        console.log('1. Checking session info...');
        const sessionRes = await axios.get('http://localhost:3000/api/sessions/default');
        console.log('Session status:', sessionRes.data.status);
        console.log('Session name:', sessionRes.data.name);
        
        // Check if webhooks are configured
        if (sessionRes.data.config && sessionRes.data.config.webhooks) {
            console.log('\nWebhooks configured:');
            sessionRes.data.config.webhooks.forEach((wh, i) => {
                console.log(`  [${i}] URL: ${wh.url}`);
                console.log(`      Events: ${wh.events.join(', ')}`);
            });
        } else {
            console.log('\n⚠️  No webhooks configured in session!');
        }
        
        // 2. Try to set webhook via API
        console.log('\n2. Attempting to configure webhook via API...');
        try {
            const webhookConfig = {
                url: 'http://host.docker.internal:3001/api/webhooks/waha',
                events: ['message', 'message.ack', 'session.status']
            };
            
            const configRes = await axios.post(
                'http://localhost:3000/api/sessions/default/webhooks',
                webhookConfig
            );
            console.log('✅ Webhook configuration response:', configRes.data);
        } catch (error) {
            console.log('❌ Failed to set webhook:', error.response?.status, error.response?.data || error.message);
            
            // Try alternative endpoint
            console.log('\n3. Trying alternative webhook endpoint...');
            try {
                const altRes = await axios.put(
                    'http://localhost:3000/api/sessions/default/config',
                    {
                        config: {
                            webhooks: [{
                                url: 'http://host.docker.internal:3001/api/webhooks/waha',
                                events: ['message', 'message.ack', 'session.status']
                            }]
                        }
                    }
                );
                console.log('✅ Alternative configuration response:', altRes.data);
            } catch (altError) {
                console.log('❌ Alternative also failed:', altError.response?.status, altError.response?.data || altError.message);
            }
        }
        
        // 3. Test webhook endpoint directly
        console.log('\n4. Testing our webhook endpoint...');
        try {
            const testEvent = {
                event: 'message',
                session: 'default',
                payload: {
                    id: 'test-' + Date.now(),
                    from: '628123456789@c.us',
                    to: '628113032232@c.us',
                    body: 'Test webhook message',
                    type: 'image',
                    timestamp: Math.floor(Date.now() / 1000),
                    media: {
                        id: 'test-media-id',
                        mimetype: 'image/jpeg',
                        filename: 'test.jpg',
                        filesize: 12345
                    }
                }
            };
            
            const webhookRes = await axios.post(
                'http://localhost:3001/api/webhooks/waha',
                testEvent,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('✅ Webhook test response:', webhookRes.status, webhookRes.data);
        } catch (error) {
            console.log('❌ Webhook test failed:', error.response?.status, error.response?.data || error.message);
        }
        
        // 4. Check available WAHA endpoints
        console.log('\n5. Checking available WAHA endpoints...');
        try {
            const swaggerRes = await axios.get('http://localhost:3000/api-docs/swagger.json');
            const paths = Object.keys(swaggerRes.data.paths);
            const webhookPaths = paths.filter(p => p.includes('webhook'));
            console.log('Webhook-related endpoints:', webhookPaths);
        } catch (error) {
            console.log('Could not fetch API docs');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data);
        }
    }
}

// Run the test
testWAHAWebhook();
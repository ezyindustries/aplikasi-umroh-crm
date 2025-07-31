const axios = require('axios');

async function setupWebhook() {
    console.log('=== SETUP WAHA WEBHOOK ===\n');
    
    try {
        // 1. Get current session
        console.log('[1] Getting session info...');
        const sessions = await axios.get('http://localhost:3000/api/sessions');
        console.log('Sessions:', sessions.data);
        
        if (sessions.data.length === 0) {
            console.log('❌ No session found! Please connect WhatsApp first.');
            return;
        }
        
        const sessionName = sessions.data[0].name;
        console.log(`Found session: ${sessionName}`);
        
        // 2. Try different webhook endpoints
        console.log('\n[2] Setting webhook...');
        
        const webhookConfig = {
            webhooks: [
                {
                    url: 'http://host.docker.internal:3001/api/webhooks/waha',
                    events: ['message', 'message.any', 'message.ack', 'state.change', 'group.join', 'group.leave', 'presence.update']
                }
            ]
        };
        
        // Try endpoint 1: PUT /api/{session}/config
        try {
            const response1 = await axios.put(
                `http://localhost:3000/api/${sessionName}/config`,
                webhookConfig
            );
            console.log('✅ Webhook set via config endpoint');
            console.log('Response:', response1.data);
        } catch (error) {
            console.log('Config endpoint failed:', error.response?.status);
            
            // Try endpoint 2: POST /api/webhook
            try {
                const response2 = await axios.post(
                    'http://localhost:3000/api/webhook',
                    {
                        session: sessionName,
                        webhook: webhookConfig.webhooks[0]
                    }
                );
                console.log('✅ Webhook set via webhook endpoint');
                console.log('Response:', response2.data);
            } catch (error2) {
                console.log('Webhook endpoint failed:', error2.response?.status);
                
                // Try endpoint 3: PATCH session
                try {
                    const response3 = await axios.patch(
                        `http://localhost:3000/api/sessions/${sessionName}`,
                        webhookConfig
                    );
                    console.log('✅ Webhook set via session patch');
                    console.log('Response:', response3.data);
                } catch (error3) {
                    console.log('❌ All webhook endpoints failed!');
                    console.log('Please check WAHA documentation');
                }
            }
        }
        
        // 3. Verify webhook
        console.log('\n[3] Verifying webhook...');
        const sessionInfo = await axios.get(`http://localhost:3000/api/sessions/${sessionName}`);
        
        if (sessionInfo.data.config?.webhooks?.length > 0) {
            console.log('✅ Webhook is configured!');
            console.log('Webhook URL:', sessionInfo.data.config.webhooks[0].url);
            console.log('Events:', sessionInfo.data.config.webhooks[0].events);
        } else {
            console.log('❌ Webhook not found in session config');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

setupWebhook();
async function setupWAHAWebhook() {
    console.log('🔧 SETTING UP WAHA WEBHOOK\n');
    
    const WAHA_URL = 'http://localhost:3000';
    const BACKEND_URL = 'http://host.docker.internal:3003';
    const API_KEY = 'your-api-key';
    
    try {
        // Method 1: Try setting webhook via session endpoint
        console.log('1️⃣ Setting webhook via session configuration...');
        
        const webhookData = {
            url: `${BACKEND_URL}/api/webhooks/waha`,
            events: ['message', 'message.any']
        };
        
        const response1 = await fetch(`${WAHA_URL}/api/default/config`, {
            method: 'PUT',
            headers: {
                'X-Api-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                webhooks: webhookData
            })
        });
        
        if (response1.ok) {
            console.log('   ✅ Webhook set successfully via PUT!');
        } else {
            console.log('   ❌ PUT method failed, trying POST...');
            
            // Method 2: Try POST
            const response2 = await fetch(`${WAHA_URL}/api/default/config`, {
                method: 'POST',
                headers: {
                    'X-Api-Key': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    webhooks: webhookData
                })
            });
            
            if (response2.ok) {
                console.log('   ✅ Webhook set successfully via POST!');
            } else {
                console.log('   ❌ POST also failed');
            }
        }
        
        // Method 3: Try the sessions webhook endpoint directly
        console.log('\n2️⃣ Trying sessions webhook endpoint...');
        const response3 = await fetch(`http://localhost:3003/api/sessions/default/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: `${BACKEND_URL}/api/webhooks/waha`,
                events: ['message', 'message.any']
            })
        });
        
        if (response3.ok) {
            const result = await response3.json();
            console.log('   ✅ Webhook set via backend API!');
            console.log('   Result:', result);
        } else {
            console.log('   ❌ Backend API method failed');
        }
        
        // Test webhook
        console.log('\n3️⃣ Testing webhook by sending a test event...');
        const testResponse = await fetch(`${BACKEND_URL}/api/webhooks/waha`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: 'message',
                session: 'default',
                engine: 'WEBJS',
                payload: {
                    id: {
                        fromMe: false,
                        remote: '6281234567890@c.us',
                        id: 'TEST' + Date.now(),
                        _serialized: 'false_6281234567890@c.us_TEST' + Date.now()
                    },
                    body: 'Test webhook paket umroh',
                    type: 'chat',
                    timestamp: Math.floor(Date.now() / 1000),
                    from: '6281234567890@c.us',
                    to: '628113032232@c.us',
                    author: null,
                    isForwarded: false,
                    fromMe: false
                }
            })
        });
        
        if (testResponse.ok) {
            console.log('   ✅ Test webhook processed successfully!');
            
            // Check if it triggered automation
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            console.log('\n4️⃣ Checking if automation was triggered...');
            const logsResponse = await fetch('http://localhost:3003/api/automation/logs?limit=3');
            const logsData = await logsResponse.json();
            
            if (logsData.success && logsData.data && logsData.data.length > 0) {
                console.log('   ✅ Automation logs found!');
                const latest = logsData.data[0];
                console.log(`   Latest: ${latest.rule?.name || 'Unknown'} - ${latest.status}`);
            } else {
                console.log('   ⚠️ No automation logs - automation might not be processing');
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ WEBHOOK SETUP COMPLETE!\n');
        console.log('📋 What to do next:');
        console.log('1. Send a real WhatsApp message with package keywords');
        console.log('2. Message examples:');
        console.log('   - "paket umroh 9 hari"');
        console.log('   - "#2026_9H_SBY_MED_JAN_FEB"');
        console.log('   - "info paket dubai"');
        console.log('3. Check Autoreply Management page for activity');
        console.log('4. Monitor backend console for webhook logs');
        
        console.log('\n⚠️ If still not working:');
        console.log('1. Restart WAHA: docker restart waha-plus');
        console.log('2. Check WAHA logs: docker logs waha-plus');
        console.log('3. Make sure you\'re sending from a different WhatsApp number');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

setupWAHAWebhook();
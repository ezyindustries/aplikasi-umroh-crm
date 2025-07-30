const axios = require('axios');

async function testWebhookConfig() {
  const baseUrl = 'http://localhost:3000';
  const sessionName = 'default';
  
  console.log('=== Testing WAHA Webhook Configuration ===\n');
  
  try {
    // 1. Get session info with config
    console.log('1. Getting session configuration...');
    const sessionRes = await axios.get(`${baseUrl}/api/sessions`);
    console.log('All sessions:', JSON.stringify(sessionRes.data, null, 2));
    
    // 2. Try to get specific session config
    console.log('\n2. Getting specific session config...');
    try {
      const configRes = await axios.get(`${baseUrl}/api/sessions/${sessionName}/config`);
      console.log('Session config:', JSON.stringify(configRes.data, null, 2));
    } catch (err) {
      console.log('No config endpoint available');
    }
    
    // 3. Try to configure webhook using different methods
    console.log('\n3. Trying to configure webhook...\n');
    
    const webhookConfig = {
      url: 'http://host.docker.internal:4000/api/webhooks/waha',
      events: ['message', 'message.any', 'message.ack', 'state.change'],
      hmac: null
    };
    
    // Method 1: Using session start with webhook
    console.log('Method 1: Restart session with webhook config...');
    try {
      const startRes = await axios.post(`${baseUrl}/api/sessions/start`, {
        name: sessionName,
        config: {
          webhooks: [webhookConfig]
        }
      });
      console.log('✅ Session restarted with webhook:', startRes.data);
    } catch (err) {
      console.log('❌ Failed:', err.response?.data || err.message);
    }
    
    // Method 2: Using PATCH to update config
    console.log('\nMethod 2: PATCH session config...');
    try {
      const patchRes = await axios.patch(`${baseUrl}/api/sessions/${sessionName}`, {
        config: {
          webhooks: [webhookConfig]
        }
      });
      console.log('✅ Config updated:', patchRes.data);
    } catch (err) {
      console.log('❌ Failed:', err.response?.status || err.message);
    }
    
    // Method 3: Check if there's a webhook test endpoint
    console.log('\n4. Looking for webhook test endpoint...');
    try {
      const testEndpoints = [
        `/api/webhooks/test`,
        `/api/sessions/${sessionName}/webhooks/test`,
        `/api/testing/webhook`
      ];
      
      for (const endpoint of testEndpoints) {
        try {
          const res = await axios.post(`${baseUrl}${endpoint}`, {
            url: 'http://host.docker.internal:4000/api/webhooks/waha'
          });
          console.log(`✅ Found test endpoint: ${endpoint}`);
          break;
        } catch (err) {
          // Silent
        }
      }
    } catch (err) {
      console.log('No webhook test endpoint found');
    }
    
    // 5. Direct WAHA Plus API webhook config (if available)
    console.log('\n5. Checking WAHA Plus webhook endpoints...');
    try {
      // WAHA Plus uses different endpoint structure
      const wahaWebhookRes = await axios.post(`${baseUrl}/api/webhook`, {
        session: sessionName,
        url: 'http://host.docker.internal:4000/api/webhooks/waha',
        events: ['message', 'message.any']
      });
      console.log('✅ WAHA Plus webhook configured:', wahaWebhookRes.data);
    } catch (err) {
      console.log('❌ Not WAHA Plus or failed:', err.response?.status);
    }
    
    console.log('\n=== Configuration Summary ===');
    console.log('Backend webhook URL: http://localhost:4000/api/webhooks/waha');
    console.log('From WAHA perspective: http://host.docker.internal:4000/api/webhooks/waha');
    console.log('\nIf webhook is properly configured, you should see "WEBHOOK RECEIVED" in backend logs when messages arrive.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWebhookConfig();
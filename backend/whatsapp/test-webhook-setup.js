const axios = require('axios');

async function testWebhookSetup() {
  const baseUrl = 'http://localhost:3000';
  const sessionName = 'default';
  
  console.log('Testing WAHA webhook setup...\n');
  
  try {
    // 1. Check session status
    console.log('1. Checking session status...');
    const statusRes = await axios.get(`${baseUrl}/api/sessions/${sessionName}`);
    console.log('Session status:', statusRes.data);
    
    if (statusRes.data.status !== 'WORKING') {
      console.log('\n⚠️  Session is not in WORKING state. Webhooks may not work properly.');
    }
    
    // 2. Try to configure webhook
    console.log('\n2. Configuring webhook...');
    try {
      const webhookConfig = {
        webhooks: [{
          url: 'http://host.docker.internal:4000/api/webhooks/waha',
          events: ['message', 'message.any', 'state.change', 'message.ack'],
          hmac: null
        }]
      };
      
      // Try different webhook endpoints
      const endpoints = [
        `/api/sessions/${sessionName}/config`,
        `/api/${sessionName}/config/webhooks`,
        `/api/${sessionName}/webhooks`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const res = await axios.put(`${baseUrl}${endpoint}`, webhookConfig);
          console.log(`✅ Webhook configured successfully at ${endpoint}`);
          console.log('Response:', res.data);
          break;
        } catch (err) {
          console.log(`❌ Failed at ${endpoint}: ${err.response?.status || err.message}`);
        }
      }
    } catch (error) {
      console.log('Error configuring webhook:', error.response?.data || error.message);
    }
    
    // 3. Check if we can receive messages
    console.log('\n3. Checking message endpoints...');
    const messageEndpoints = [
      `/api/${sessionName}/messages`,
      `/api/messages/${sessionName}`,
      `/api/chats`
    ];
    
    for (const endpoint of messageEndpoints) {
      try {
        const res = await axios.get(`${baseUrl}${endpoint}`, {
          params: { limit: 1 }
        });
        console.log(`✅ Found messages endpoint: ${endpoint}`);
        console.log('Sample response:', res.data.slice(0, 1));
        break;
      } catch (err) {
        console.log(`❌ Not found: ${endpoint}`);
      }
    }
    
    // 4. Test manual webhook trigger
    console.log('\n4. Testing manual webhook trigger...');
    console.log('Send a message to the WhatsApp number and check if webhook is triggered.');
    console.log('Backend webhook URL: http://localhost:4000/api/webhooks/waha');
    console.log('\nCheck backend logs for "WEBHOOK RECEIVED" messages.');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

console.log('=== WAHA Webhook Setup Test ===\n');
testWebhookSetup();
const axios = require('axios');

async function fixWebhook() {
  const WAHA_URL = 'http://localhost:3000';
  const SESSION_ID = 'default';
  
  // Get host IP that Docker can access
  // On Windows/Mac, Docker can use host.docker.internal
  // On Linux, you might need the actual host IP
  const WEBHOOK_URL = 'http://host.docker.internal:3001/api/webhooks/waha';
  
  try {
    console.log('1. Stopping current session...');
    try {
      await axios.post(`${WAHA_URL}/api/sessions/stop`, {
        name: SESSION_ID,
        logout: false
      });
      console.log('Session stopped');
    } catch (e) {
      console.log('Session might already be stopped');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n2. Starting session with corrected webhook URL...');
    console.log('Webhook URL:', WEBHOOK_URL);
    
    const startResponse = await axios.post(`${WAHA_URL}/api/sessions/start`, {
      name: SESSION_ID,
      config: {
        debug: false,
        webhooks: [
          {
            url: WEBHOOK_URL,
            events: ['message', 'message.any', 'state.change', 'message.ack'],
            hmac: null,
            retries: {
              delaySeconds: 2,
              attempts: 3
            }
          }
        ]
      }
    });
    
    console.log('Session started:', startResponse.data);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n3. Checking session status...');
    const statusResponse = await axios.get(`${WAHA_URL}/api/sessions/${SESSION_ID}`);
    console.log('Session details:', JSON.stringify(statusResponse.data, null, 2));
    
    console.log('\n✅ Webhook fixed! Docker container can now reach backend.');
    console.log('Please send a WhatsApp message to test.');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

fixWebhook();
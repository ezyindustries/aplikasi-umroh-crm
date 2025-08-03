const axios = require('axios');

async function restartWithWebhook() {
  const WAHA_URL = 'http://localhost:3000';
  const BACKEND_URL = 'http://localhost:3003';
  const SESSION_ID = 'default';
  
  try {
    console.log('1. Stopping current session...');
    try {
      await axios.post(`${WAHA_URL}/api/sessions/stop`, {
        name: SESSION_ID,
        logout: false // Keep auth
      });
      console.log('Session stopped');
    } catch (e) {
      console.log('Session might already be stopped');
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n2. Starting session with webhook configuration...');
    const startResponse = await axios.post(`${WAHA_URL}/api/sessions/start`, {
      name: SESSION_ID,
      config: {
        debug: false,
        webhooks: [
          {
            url: `${BACKEND_URL}/api/webhooks/waha`,
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
    
    // Check status
    console.log('\n3. Checking session status...');
    const statusResponse = await axios.get(`${WAHA_URL}/api/sessions/${SESSION_ID}`);
    console.log('Session details:', JSON.stringify(statusResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

restartWithWebhook();
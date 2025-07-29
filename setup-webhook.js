const axios = require('axios');

async function setupWebhook() {
  const WAHA_URL = 'http://localhost:3000';
  const BACKEND_URL = 'http://localhost:3001';
  const SESSION_ID = 'default';
  
  try {
    console.log('Setting up webhook for WAHA...');
    
    // Configure webhook - WAHA uses PUT method
    const response = await axios.put(`${WAHA_URL}/api/sessions/${SESSION_ID}`, {
      webhooks: [{
        url: `${BACKEND_URL}/api/webhooks/waha`,
        events: ['*'], // All events
        hmac: {
          key: 'your-secret-key' // Change this to a secure key
        }
      }]
    });
    
    console.log('Webhook configured:', response.data);
    
    // Test webhook
    console.log('\nTesting webhook...');
    const testResponse = await axios.post(`${WAHA_URL}/api/sessions/${SESSION_ID}/webhook/test`);
    console.log('Webhook test result:', testResponse.data);
    
  } catch (error) {
    console.error('Error setting up webhook:', error.response?.data || error.message);
  }
}

setupWebhook();
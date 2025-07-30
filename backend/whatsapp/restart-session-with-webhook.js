const axios = require('axios');

async function restartWithWebhook() {
  const baseUrl = 'http://localhost:3000';
  const sessionName = 'default';
  
  console.log('=== Restarting Session with Webhook ===\n');
  
  try {
    // 1. Stop current session
    console.log('1. Stopping current session...');
    try {
      await axios.post(`${baseUrl}/api/sessions/stop`, {
        name: sessionName
      });
      console.log('✅ Session stopped');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.log('Stop error:', err.response?.data || err.message);
    }
    
    // 2. Start with webhook configuration
    console.log('\n2. Starting session with webhook configuration...');
    
    const sessionConfig = {
      name: sessionName,
      config: {
        webhooks: [{
          url: 'http://host.docker.internal:4000/api/webhooks/waha',
          events: ['message', 'message.any', 'message.ack', 'state.change', 'group.join', 'group.leave'],
          hmac: null,
          retries: {
            delaySeconds: 2,
            attempts: 3
          }
        }]
      }
    };
    
    try {
      const startRes = await axios.post(`${baseUrl}/api/sessions/start`, sessionConfig);
      console.log('✅ Session started with webhook!');
      console.log('Response:', JSON.stringify(startRes.data, null, 2));
      
      // 3. Verify webhook is configured
      console.log('\n3. Verifying session status...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusRes = await axios.get(`${baseUrl}/api/sessions/${sessionName}`);
      console.log('Session status:', statusRes.data.status);
      console.log('Session config:', JSON.stringify(statusRes.data.config, null, 2));
      
    } catch (err) {
      console.log('Start error:', err.response?.data || err.message);
    }
    
    console.log('\n=== Instructions ===');
    console.log('1. Check if QR code needs to be scanned again');
    console.log('2. Once connected, send a test message from another phone');
    console.log('3. Check backend logs for "WEBHOOK RECEIVED" messages');
    console.log('4. Webhook URL: http://localhost:4000/api/webhooks/waha');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Add warning
console.log('⚠️  WARNING: This will restart your WhatsApp session!');
console.log('You may need to scan QR code again.');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
  restartWithWebhook();
}, 5000);
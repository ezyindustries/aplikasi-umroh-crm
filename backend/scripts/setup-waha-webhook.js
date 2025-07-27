const axios = require('axios');

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3001';
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'your-secret-api-key';
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000';

async function checkSession() {
  try {
    const response = await axios.get(`${WAHA_URL}/api/sessions/default`, {
      headers: { 'X-Api-Key': WAHA_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking session:', error.message);
    return null;
  }
}

async function setupWebhook() {
  try {
    // Configure webhook for the session
    const webhookConfig = {
      webhooks: [{
        url: `${BACKEND_URL}/api/crm/webhook`,
        events: ['message', 'message.ack'],
        hmac: null,
        retries: {
          delaySeconds: 2,
          attempts: 3
        },
        customHeaders: {}
      }]
    };

    const response = await axios.patch(
      `${WAHA_URL}/api/sessions/default`,
      webhookConfig,
      {
        headers: {
          'X-Api-Key': WAHA_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook configured successfully:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    return false;
  }
}

async function monitorConnection() {
  console.log('🔄 Monitoring WAHA connection...\n');
  
  let isConnected = false;
  let webhookConfigured = false;
  
  const checkInterval = setInterval(async () => {
    const session = await checkSession();
    
    if (!session) {
      console.log('❌ Unable to check session status');
      return;
    }
    
    console.log(`📊 Status: ${session.status}`);
    
    if (session.status === 'SCAN_QR_CODE' && !isConnected) {
      console.log('📷 Waiting for QR code scan...');
      console.log('👉 Open: http://localhost:8081/waha-qr-scanner.html\n');
    }
    
    if (session.status === 'WORKING' && !isConnected) {
      isConnected = true;
      console.log('✅ WhatsApp Connected!');
      console.log(`📱 Number: ${session.me?.pushName || 'Unknown'}`);
      console.log(`📞 Phone: ${session.me?.id?.user || 'Unknown'}\n`);
      
      // Setup webhook after connection
      if (!webhookConfigured) {
        console.log('🔧 Setting up webhook...');
        webhookConfigured = await setupWebhook();
      }
      
      // Show test instructions
      console.log('\n📝 Test Instructions:');
      console.log('1. Send a WhatsApp message to your connected number');
      console.log('2. The bot should auto-reply with Ollama');
      console.log('3. Check CRM Dashboard: http://localhost:8081/crm-dashboard.html');
      console.log('4. Monitor logs: docker logs vauza-tamma-backend -f\n');
      
      console.log('✅ Setup complete! Press Ctrl+C to stop monitoring.');
    }
    
    if (session.status === 'STOPPED') {
      console.log('⏹️ Session stopped. Start it again with:');
      console.log('curl -X POST http://localhost:3001/api/sessions/default/start -H "X-Api-Key: your-secret-api-key"');
      clearInterval(checkInterval);
    }
    
  }, 3000); // Check every 3 seconds
}

// Start monitoring
monitorConnection();
const axios = require('axios');

async function testWebhookConnectivity() {
  console.log('=== Testing Webhook Connectivity ===\n');
  
  // Test webhook URL from different perspectives
  const webhookUrls = [
    'http://localhost:3001/api/webhooks/waha',
    'http://host.docker.internal:3001/api/webhooks/waha',
    'http://172.17.0.1:3001/api/webhooks/waha', // Default Docker bridge
  ];
  
  console.log('1. Testing webhook endpoints accessibility...\n');
  
  for (const url of webhookUrls) {
    try {
      console.log(`Testing: ${url}`);
      
      // Try GET first (should return 404 or similar)
      const getRes = await axios.get(url, { timeout: 5000 }).catch(err => err.response);
      
      if (getRes) {
        console.log(`✅ Reachable! Status: ${getRes.status}`);
        
        // Try POST to simulate webhook
        const testPayload = {
          event: 'test',
          session: 'default',
          payload: {
            test: true,
            timestamp: Date.now()
          }
        };
        
        const postRes = await axios.post(url, testPayload, { timeout: 5000 })
          .catch(err => err.response);
          
        if (postRes && postRes.status === 200) {
          console.log(`✅ POST successful! This URL should work for webhooks.`);
          console.log(`   Use this in WAHA: ${url}`);
        } else {
          console.log(`⚠️  POST returned status: ${postRes?.status || 'error'}`);
        }
      } else {
        console.log(`❌ Not reachable`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('\n2. Testing from WAHA container perspective...');
  console.log('Run this command to test from inside WAHA container:');
  console.log('docker exec <waha-container-name> curl -X POST http://host.docker.internal:3001/api/webhooks/waha -H "Content-Type: application/json" -d \'{"test":true}\'');
  
  console.log('\n3. Current backend server info:');
  console.log(`Backend should be running on port: ${process.env.PORT || 3001}`);
  console.log(`If using Docker, WAHA should use: http://host.docker.internal:${process.env.PORT || 3001}/api/webhooks/waha`);
  
  console.log('\n4. Common issues:');
  console.log('- Backend not running on expected port');
  console.log('- Docker network isolation');
  console.log('- Firewall blocking connections');
  console.log('- Wrong webhook URL in WAHA config');
  
  // Test if backend is actually running
  console.log('\n5. Checking if backend is running...');
  try {
    const healthRes = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/health`);
    console.log(`✅ Backend is running! Health check: ${healthRes.data.status}`);
  } catch (error) {
    console.log(`❌ Backend health check failed: ${error.message}`);
    console.log('Make sure backend is running!');
  }
}

testWebhookConnectivity();
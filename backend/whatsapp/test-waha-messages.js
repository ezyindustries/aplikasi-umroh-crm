const axios = require('axios');

async function testWAHAMessages() {
  const baseUrl = 'http://localhost:3000';
  const sessionName = 'default';
  
  console.log('=== Testing WAHA Message Endpoints ===\n');
  
  try {
    // 1. Check session status first
    console.log('1. Checking session status...');
    const statusRes = await axios.get(`${baseUrl}/api/sessions/${sessionName}`);
    console.log('Session status:', statusRes.data.status);
    console.log('Session info:', JSON.stringify(statusRes.data, null, 2));
    
    // 2. Try different endpoints to get messages
    console.log('\n2. Trying to fetch messages from different endpoints...\n');
    
    const endpoints = [
      `/api/${sessionName}/chats`,
      `/api/sessions/${sessionName}/chats`, 
      `/api/chats/${sessionName}`,
      `/api/messages`,
      `/api/${sessionName}/messages`,
      `/api/sessions/${sessionName}/messages`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying: ${endpoint}`);
        const response = await axios.get(`${baseUrl}${endpoint}`, {
          params: { limit: 5 }
        });
        
        console.log(`✅ SUCCESS! Found endpoint: ${endpoint}`);
        console.log('Response data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log('\nSample data:');
          response.data.slice(0, 2).forEach((item, i) => {
            console.log(`\nItem ${i + 1}:`);
            console.log('- ID:', item.id);
            console.log('- Name:', item.name);
            console.log('- Last message:', item.lastMessage?.body || item.lastMessage?.text || 'No message');
            console.log('- Last message from:', item.lastMessage?.from);
            console.log('- Last message fromMe:', item.lastMessage?.fromMe);
            console.log('- Timestamp:', item.lastMessage?.timestamp || item.timestamp);
          });
        }
        break;
      } catch (error) {
        console.log(`❌ Failed: ${error.response?.status || error.message}`);
      }
    }
    
    // 3. Check webhook configuration
    console.log('\n3. Checking webhook configuration...');
    try {
      // Try to get webhook config
      const webhookEndpoints = [
        `/api/sessions/${sessionName}/webhooks`,
        `/api/${sessionName}/webhooks`,
        `/api/webhooks`
      ];
      
      for (const endpoint of webhookEndpoints) {
        try {
          const res = await axios.get(`${baseUrl}${endpoint}`);
          console.log(`Found webhook config at ${endpoint}:`, res.data);
          break;
        } catch (err) {
          // Silent fail
        }
      }
    } catch (error) {
      console.log('Could not get webhook configuration');
    }
    
    // 4. Test manual message fetching
    console.log('\n4. Manual test instructions:');
    console.log('- Send a test message from another phone to your WhatsApp number');
    console.log('- Then run this script again to see if new messages appear');
    console.log('- Check backend console for "WEBHOOK RECEIVED" or "New message detected via polling"');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWAHAMessages();
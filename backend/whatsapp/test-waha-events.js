const EventSource = require('eventsource');
const axios = require('axios');

async function testWAHAEvents() {
  const baseUrl = 'http://localhost:3000';
  const sessionName = 'default';
  
  console.log('=== Testing WAHA Real-time Events ===\n');
  
  // Test different event endpoints
  const eventEndpoints = [
    `/api/sessions/${sessionName}/events`,
    `/api/${sessionName}/events`, 
    `/api/events`,
    `/api/sessions/events`,
    `/api/${sessionName}/messages/events`,
    `/api/sse`
  ];
  
  console.log('Testing Server-Sent Events endpoints...\n');
  
  for (const endpoint of eventEndpoints) {
    try {
      console.log(`Trying: ${baseUrl}${endpoint}`);
      
      // First check if endpoint exists
      const testRes = await axios.get(`${baseUrl}${endpoint}`).catch(err => err.response);
      
      if (testRes && testRes.status !== 404) {
        console.log(`✅ Found endpoint! Status: ${testRes.status}`);
        
        // Try to connect to SSE
        const eventSource = new EventSource(`${baseUrl}${endpoint}`);
        
        eventSource.onmessage = (event) => {
          console.log('📨 Event received:', event.data);
        };
        
        eventSource.onerror = (error) => {
          console.log('❌ SSE Error:', error);
          eventSource.close();
        };
        
        // Listen for 10 seconds
        setTimeout(() => {
          eventSource.close();
          console.log('Closed SSE connection');
        }, 10000);
        
        break;
      } else {
        console.log(`❌ Not found (404)`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Also check WebSocket support
  console.log('\n=== Checking WebSocket Support ===');
  console.log('WebSocket endpoints typically at:');
  console.log('- ws://localhost:3000/ws');
  console.log('- ws://localhost:3000/api/ws');
  console.log('- ws://localhost:3000/socket.io/');
  
  console.log('\n=== Summary ===');
  console.log('WAHA can notify about new messages via:');
  console.log('1. Webhooks (HTTP POST) - Recommended, but needs configuration');
  console.log('2. Server-Sent Events (SSE) - If supported');
  console.log('3. WebSocket - For real-time bidirectional communication');
  console.log('4. Polling - Our current fallback solution');
}

// Check if eventsource is installed
try {
  require('eventsource');
  testWAHAEvents();
} catch (err) {
  console.log('Installing eventsource package...');
  require('child_process').execSync('npm install eventsource', { stdio: 'inherit' });
  console.log('Please run this script again.');
}
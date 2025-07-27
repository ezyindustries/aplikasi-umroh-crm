const axios = require('axios');

const WAHA_URL = 'http://localhost:3001';
const WAHA_API_KEY = 'your-secret-api-key';
const BACKEND_URL = 'http://localhost:3000';
const TEST_PHONE = '6281234567890'; // Replace with your test phone number

async function testWhatsAppFlow() {
  console.log('🚀 Testing WhatsApp Flow...\n');

  try {
    // 1. Check WAHA session status
    console.log('1️⃣ Checking WAHA session status...');
    const sessionResponse = await axios.get(`${WAHA_URL}/api/sessions/default`, {
      headers: { 'X-Api-Key': WAHA_API_KEY }
    });
    
    console.log(`   Session Status: ${sessionResponse.data.status}`);
    
    if (sessionResponse.data.status !== 'WORKING') {
      console.log('❌ WhatsApp not connected! Please scan QR code first.');
      return;
    }
    
    console.log(`   Connected Number: ${sessionResponse.data.me?.pushName || 'Unknown'}`);
    console.log('   ✅ WhatsApp Connected!\n');

    // 2. Send a test message
    console.log('2️⃣ Sending test message via WAHA...');
    const testMessage = `Test message ${new Date().toLocaleTimeString()} - Assalamualaikum, saya tertarik dengan paket umroh`;
    
    const sendResponse = await axios.post(
      `${WAHA_URL}/api/sendText`,
      {
        session: 'default',
        chatId: `${TEST_PHONE}@c.us`,
        text: testMessage
      },
      {
        headers: {
          'X-Api-Key': WAHA_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`   Message sent! ID: ${sendResponse.data.id}`);
    console.log('   ✅ Message Sent Successfully!\n');

    // 3. Wait for webhook to process
    console.log('3️⃣ Waiting for webhook processing (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('   ✅ Webhook should have processed the message\n');

    // 4. Check CRM for the conversation
    console.log('4️⃣ Checking CRM for conversation...');
    
    // Login first (if needed)
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    // Get conversations
    const conversationsResponse = await axios.get(`${BACKEND_URL}/api/crm/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const conversations = conversationsResponse.data.data || [];
    const ourConversation = conversations.find(c => 
      c.phone_number === TEST_PHONE || 
      c.phone_number === `${TEST_PHONE}@c.us`
    );
    
    if (ourConversation) {
      console.log(`   ✅ Conversation found! ID: ${ourConversation.id}`);
      console.log(`   Lead: ${ourConversation.lead?.name || 'Unknown'}`);
      console.log(`   Last Message: ${ourConversation.last_message_at}\n`);
      
      // Get messages
      console.log('5️⃣ Getting conversation messages...');
      const messagesResponse = await axios.get(
        `${BACKEND_URL}/api/crm/conversations/${ourConversation.id}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const messages = messagesResponse.data.data || [];
      console.log(`   Total Messages: ${messages.length}`);
      
      if (messages.length > 0) {
        console.log('\n   Recent Messages:');
        messages.slice(-3).forEach(msg => {
          console.log(`   ${msg.direction === 'inbound' ? '📥' : '📤'} ${msg.content.substring(0, 50)}...`);
          console.log(`      Time: ${new Date(msg.created_at).toLocaleString()}`);
        });
      }
    } else {
      console.log('   ⚠️  Conversation not found yet. It may take a moment to process.');
    }

    console.log('\n✅ Test Complete!');
    console.log('\n📊 Next Steps:');
    console.log('1. Open WhatsApp Dashboard: http://localhost:8081/whatsapp-dashboard.html');
    console.log('2. You should see the conversation appear in real-time');
    console.log('3. Send messages from WhatsApp to test incoming messages');
    console.log('4. The bot should auto-reply based on your configuration');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you have the correct API key for WAHA');
    }
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Make sure all services are running (WAHA, Backend)');
    }
  }
}

// Run the test
testWhatsAppFlow();
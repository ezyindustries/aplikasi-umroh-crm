const axios = require('axios');

async function checkSpecificChat() {
  const baseUrl = 'http://localhost:3000';
  const sessionName = 'default';
  
  try {
    // Get all chats
    const response = await axios.get(`${baseUrl}/api/${sessionName}/chats`, {
      params: { limit: 20 }
    });
    
    console.log('=== ALL CHATS FROM WAHA ===\n');
    
    response.data.forEach((chat, index) => {
      console.log(`${index + 1}. Chat ID: ${chat.id._serialized || chat.id}`);
      console.log(`   Name: ${chat.name || 'No name'}`);
      
      if (chat.lastMessage) {
        const msg = chat.lastMessage;
        console.log(`   Last Message:`);
        console.log(`   - Text: ${msg.body || msg.text || '[No text]'}`);
        console.log(`   - From: ${msg.from}`);
        console.log(`   - FromMe: ${msg.fromMe}`);
        console.log(`   - Type: ${msg.type}`);
        console.log(`   - Timestamp: ${new Date(msg.timestamp * 1000).toLocaleString()}`);
        console.log(`   - ID: ${msg.id?.id || msg.id}`);
      }
      console.log('   -------------------\n');
    });
    
    // Now let's try to get messages for a specific chat
    console.log('\n=== TRYING TO GET MESSAGES FOR SPECIFIC CHAT ===\n');
    
    // Try with a personal chat (not group)
    const personalChat = response.data.find(chat => 
      chat.id._serialized && chat.id._serialized.includes('@c.us') && !chat.isGroup
    );
    
    if (personalChat) {
      console.log(`Fetching messages for: ${personalChat.name || personalChat.id._serialized}`);
      
      try {
        const messagesRes = await axios.get(`${baseUrl}/api/${sessionName}/chats/${personalChat.id._serialized}/messages`, {
          params: { limit: 10 }
        });
        
        console.log('\nMessages found:');
        messagesRes.data.forEach((msg, i) => {
          console.log(`${i + 1}. [${new Date(msg.timestamp * 1000).toLocaleString()}]`);
          console.log(`   From: ${msg.from}`);
          console.log(`   FromMe: ${msg.fromMe}`);
          console.log(`   Body: ${msg.body || '[No body]'}`);
          console.log(`   Type: ${msg.type}`);
          console.log(`   ID: ${msg.id?.id || msg.id}`);
        });
      } catch (err) {
        console.log('Error fetching messages:', err.response?.status || err.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSpecificChat();
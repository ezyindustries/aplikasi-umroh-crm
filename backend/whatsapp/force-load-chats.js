const whatsappService = require('./src/services/WhatsAppWebService');

console.log('=== Forcing Chat History Load ===\n');

async function forceLoadChats() {
  try {
    // Get the client instance
    const client = whatsappService.clients.get('default');
    
    if (!client) {
      console.log('❌ No active WhatsApp session found');
      console.log('Please connect WhatsApp first via the frontend');
      return;
    }
    
    console.log('✅ Found active session');
    console.log('Loading chat history...\n');
    
    // Force load existing chats
    await whatsappService.loadExistingChats('default', client);
    
    console.log('\n✅ Chat history loading initiated');
    console.log('Check the backend console for progress');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Wait a bit for service to initialize
setTimeout(() => {
  forceLoadChats();
}, 1000);
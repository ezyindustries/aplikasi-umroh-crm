// Quick test script to check dashboard endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testDashboard() {
  console.log('Testing Dashboard Endpoints...\n');
  
  const endpoints = [
    '/dashboard/stats',
    '/dashboard/activity',
    '/dashboard/analytics?period=week',
    '/dashboard/lead-sources',
    '/dashboard/ai-performance'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(API_BASE + endpoint);
      console.log('✓ Success:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }
    console.log('---\n');
  }
}

// Also test if models are working
async function testModels() {
  try {
    const { initDatabase, Contact, Conversation, Message } = require('./src/models');
    
    console.log('Initializing database...');
    await initDatabase();
    
    console.log('\nCounting records:');
    const contactCount = await Contact.count();
    const conversationCount = await Conversation.count();
    const messageCount = await Message.count();
    
    console.log(`- Contacts: ${contactCount}`);
    console.log(`- Conversations: ${conversationCount}`);
    console.log(`- Messages: ${messageCount}`);
    
    // Create sample data if empty
    if (contactCount === 0) {
      console.log('\nCreating sample data...');
      
      // Create sample contact
      const contact = await Contact.create({
        phone: '+6281234567890',
        name: 'Test User',
        status: 'active'
      });
      
      // Create sample conversation
      const conversation = await Conversation.create({
        contactId: contact.id,
        sessionId: 'default',
        status: 'active',
        lastMessageAt: new Date()
      });
      
      // Create sample messages
      await Message.create({
        conversationId: conversation.id,
        whatsappMessageId: 'test1',
        fromNumber: contact.phone,
        toNumber: 'business',
        content: 'Hello, I need information',
        type: 'incoming',
        direction: 'inbound',
        isAutomated: false
      });
      
      await Message.create({
        conversationId: conversation.id,
        whatsappMessageId: 'test2',
        fromNumber: 'business',
        toNumber: contact.phone,
        content: 'Hi! How can I help you?',
        type: 'outgoing',
        direction: 'outbound',
        isAutomated: true,
        responseTime: 200
      });
      
      console.log('Sample data created successfully!');
    }
    
  } catch (error) {
    console.error('Model test error:', error);
  }
}

// Run tests
testModels().then(() => {
  setTimeout(() => {
    testDashboard();
  }, 2000);
});
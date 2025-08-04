const { Message } = require('./backend/whatsapp/src/models');

async function checkSchema() {
  try {
    console.log('=== CHECKING MESSAGE SCHEMA ===\n');
    
    // Get a sample message to see what fields exist
    const sampleMessage = await Message.findOne();
    
    if (!sampleMessage) {
      console.log('No messages found in database');
      return;
    }
    
    console.log('Sample message structure:');
    console.log(JSON.stringify(sampleMessage.toJSON(), null, 2));
    
    // Also get recent messages without the fromMe filter
    console.log('\n=== RECENT INCOMING MESSAGES ===\n');
    
    const recentMessages = await Message.findAll({
      where: {
        direction: 'inbound'
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`Found ${recentMessages.length} recent incoming messages:`);
    
    recentMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.createdAt.toISOString()}`);
      console.log(`   Content: "${msg.content || msg.body || 'No content'}"`);
      console.log(`   Direction: ${msg.direction}`);
      console.log(`   Type: ${msg.messageType}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
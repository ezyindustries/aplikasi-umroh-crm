const MessagePoller = require('./src/services/MessagePoller');
const logger = require('./src/utils/logger');

async function testMessagePoller() {
    console.log('=== TESTING MESSAGE POLLER ===\n');
    
    // Initialize database
    const db = require('./src/models');
    await db.sequelize.sync();
    
    // Create message poller instance
    const poller = new MessagePoller();
    
    console.log('Starting message polling...');
    console.log('Send an image via WhatsApp within the next 30 seconds');
    console.log('Watch for console output...\n');
    
    // Start polling
    await poller.startPolling('default');
    
    // Wait for 30 seconds
    setTimeout(() => {
        console.log('\nStopping polling...');
        poller.stopPolling();
        process.exit(0);
    }, 30000);
}

testMessagePoller().catch(console.error);
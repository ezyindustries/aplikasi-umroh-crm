const fetch = require('node-fetch');
const logger = require('./src/utils/logger');

async function testMessagesAPI() {
    try {
        logger.info('=== Testing Messages API ===');
        
        // Test conversations endpoint
        logger.info('\n1. Testing /api/conversations endpoint...');
        const convResponse = await fetch('http://localhost:3001/api/conversations');
        const convData = await convResponse.json();
        
        logger.info(`   Status: ${convResponse.status}`);
        logger.info(`   Success: ${convData.success}`);
        logger.info(`   Conversations count: ${convData.data?.length || 0}`);
        
        if (convData.data && convData.data.length > 0) {
            logger.info('\n2. Conversations found:');
            for (const conv of convData.data) {
                logger.info(`   - ${conv.contact?.name || 'Unknown'} (${conv.contact?.phoneNumber})`);
                logger.info(`     ID: ${conv.id}`);
                logger.info(`     Messages: ${conv.messages?.length || 0}`);
                
                // Test messages endpoint for this conversation
                logger.info(`\n   Testing /api/messages/${conv.id}...`);
                const msgResponse = await fetch(`http://localhost:3001/api/messages/${conv.id}`);
                const msgData = await msgResponse.json();
                
                logger.info(`     Status: ${msgResponse.status}`);
                logger.info(`     Success: ${msgData.success}`);
                logger.info(`     Messages returned: ${msgData.data?.length || 0}`);
                
                if (msgData.data && msgData.data.length > 0) {
                    logger.info('     Sample messages:');
                    msgData.data.slice(0, 3).forEach(msg => {
                        logger.info(`       - ${msg.direction}: ${msg.content?.substring(0, 50)}...`);
                        logger.info(`         From: ${msg.fromNumber}, To: ${msg.toNumber}`);
                        logger.info(`         Created: ${msg.createdAt}`);
                    });
                }
            }
        }
        
        // Test contacts endpoint
        logger.info('\n\n3. Testing /api/contacts endpoint...');
        const contactResponse = await fetch('http://localhost:3001/api/contacts');
        const contactData = await contactResponse.json();
        
        logger.info(`   Status: ${contactResponse.status}`);
        logger.info(`   Success: ${contactData.success}`);
        logger.info(`   Contacts count: ${contactData.data?.length || 0}`);
        
        if (contactData.data && contactData.data.length > 0) {
            logger.info('\n   Contacts with conversations:');
            for (const contact of contactData.data) {
                logger.info(`   - ${contact.name} (${contact.phoneNumber})`);
                logger.info(`     Conversations: ${contact.conversations?.length || 0}`);
                if (contact.conversations && contact.conversations.length > 0) {
                    const conv = contact.conversations[0];
                    logger.info(`     First conversation messages: ${conv.messages?.length || 0}`);
                }
            }
        }
        
    } catch (error) {
        logger.error('API test failed:', error);
        logger.error('Make sure the backend is running on http://localhost:3001');
    }
}

// Run the test
testMessagesAPI();
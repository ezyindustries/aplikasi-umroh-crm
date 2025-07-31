const axios = require('axios');

async function testMessageFields() {
    console.log('=== TESTING MESSAGE FIELDS FROM API ===\n');
    
    try {
        // Get conversations first
        const convRes = await axios.get('http://localhost:3001/api/conversations?limit=1');
        if (convRes.data.data.length === 0) {
            console.log('No conversations found');
            return;
        }
        
        const conversationId = convRes.data.data[0].id;
        console.log(`Testing conversation: ${conversationId}\n`);
        
        // Get messages for this conversation
        const msgRes = await axios.get(`http://localhost:3001/api/messages/${conversationId}?limit=5`);
        
        console.log(`Found ${msgRes.data.data.length} messages\n`);
        
        // Check each message
        msgRes.data.data.forEach((msg, i) => {
            console.log(`Message ${i + 1}:`);
            console.log(`  ID: ${msg.id}`);
            console.log(`  Type: ${msg.messageType}`);
            console.log(`  MediaID: ${msg.mediaId || 'undefined'}`);
            console.log(`  MediaURL: ${msg.mediaUrl || 'undefined'}`);
            console.log(`  Has mediaId field: ${msg.hasOwnProperty('mediaId')}`);
            console.log(`  All fields:`, Object.keys(msg));
            console.log('');
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data);
        }
    }
}

testMessageFields();
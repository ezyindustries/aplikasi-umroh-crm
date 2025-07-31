const axios = require('axios');

async function debugMediaMessages() {
    console.log('=== Debug Media Messages ===\n');
    
    try {
        // Get conversations
        const conversations = await axios.get('http://localhost:3001/api/conversations');
        
        if (conversations.data.data.length > 0) {
            const convId = conversations.data.data[0].id;
            console.log(`Checking conversation: ${convId}`);
            
            // Get messages
            const messages = await axios.get(`http://localhost:3001/api/messages/${convId}`);
            
            // Find media messages
            const mediaMessages = messages.data.data.filter(m => m.messageType !== 'text');
            
            console.log(`\nFound ${mediaMessages.length} media messages:\n`);
            
            mediaMessages.forEach((msg, index) => {
                console.log(`[${index + 1}] Message ID: ${msg.id}`);
                console.log(`    Type: ${msg.messageType}`);
                console.log(`    Media ID: ${msg.mediaId || 'null'}`);
                console.log(`    Media URL: ${msg.mediaUrl || 'null'}`);
                console.log(`    Thumbnail URL: ${msg.thumbnailUrl || 'null'}`);
                console.log(`    File Name: ${msg.fileName || 'null'}`);
                console.log(`    Caption: ${msg.mediaCaption || msg.content || 'no caption'}`);
                console.log(`    Direction: ${msg.direction}`);
                console.log(`    Created: ${msg.createdAt}`);
                console.log('---');
            });
            
            // Test media endpoint
            if (mediaMessages.length > 0 && mediaMessages[0].mediaId) {
                console.log('\nTesting media download endpoint...');
                try {
                    const mediaResponse = await axios.get(
                        `http://localhost:3001/api/messages/media/${mediaMessages[0].mediaId}`,
                        { responseType: 'arraybuffer' }
                    );
                    console.log(`✅ Media download successful! Size: ${mediaResponse.data.byteLength} bytes`);
                    console.log(`Content-Type: ${mediaResponse.headers['content-type']}`);
                } catch (error) {
                    console.log(`❌ Media download failed: ${error.response?.status} ${error.response?.statusText}`);
                }
            }
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Check Socket.IO events
const io = require('socket.io-client');
const socket = io('http://localhost:3001', {
    transports: ['polling', 'websocket']
});

socket.on('connect', () => {
    console.log('\n✅ Connected to WebSocket');
    console.log('\n=== Listening for new messages ===\n');
});

socket.on('message:new', (data) => {
    const msg = data.message;
    if (msg.messageType !== 'text') {
        console.log(`\n🖼️ New media message received:`);
        console.log(`  Type: ${msg.messageType}`);
        console.log(`  Media ID: ${msg.mediaId}`);
        console.log(`  Media URL: ${msg.mediaUrl}`);
        console.log(`  Thumbnail: ${msg.thumbnailUrl}`);
        console.log(`  File: ${msg.fileName}`);
    }
});

// Run debug
debugMediaMessages();
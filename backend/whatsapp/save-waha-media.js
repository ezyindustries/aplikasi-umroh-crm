const axios = require('axios');
const mediaHandler = require('./src/services/MediaHandler');

async function saveWAHAMedia() {
    console.log('=== SAVING WAHA MEDIA TO FILE ===\n');
    
    try {
        // Get a chat with media
        const chatId = '6282255555000@c.us';
        console.log(`Fetching messages from ${chatId}...`);
        
        const messagesRes = await axios.get(
            `http://localhost:3000/api/default/chats/${chatId}/messages?limit=20`
        );
        
        // Find image messages
        const imageMessages = messagesRes.data.filter(msg => 
            msg._data && msg._data.type === 'image' && msg._data.body
        );
        
        console.log(`Found ${imageMessages.length} image messages\n`);
        
        if (imageMessages.length > 0) {
            const msg = imageMessages[0];
            const messageId = msg.id?.id || msg.id;
            
            console.log('Saving first image:');
            console.log(`Message ID: ${messageId}`);
            console.log(`Has base64 data: ${!!msg._data.body}`);
            console.log(`Data length: ${msg._data.body.length} chars`);
            
            // Save the media
            const result = await mediaHandler.saveBase64Media(
                msg._data.body,
                msg._data.mimetype || 'image/jpeg',
                messageId
            );
            
            console.log(`\n✅ Media saved successfully!`);
            console.log(`File: ${result.filename}`);
            console.log(`Path: ${result.path}`);
            
            // Test retrieval
            console.log('\nTesting retrieval...');
            const retrieved = await mediaHandler.getMedia(messageId);
            console.log(`✅ Media retrieved successfully!`);
            console.log(`Size: ${retrieved.data.length} bytes`);
            console.log(`MIME type: ${retrieved.mimeType}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

saveWAHAMedia();
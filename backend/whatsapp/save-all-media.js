const axios = require('axios');
const mediaHandler = require('./src/services/MediaHandler');
const { Message } = require('./src/models');

async function saveAllWAHAMedia() {
    console.log('=== SAVING ALL WAHA MEDIA FILES ===\n');
    
    try {
        // Get all image messages from database
        const imageMessages = await Message.findAll({
            where: { messageType: 'image' }
        });
        
        console.log(`Found ${imageMessages.length} image messages in database\n`);
        
        for (const msg of imageMessages) {
            if (!msg.mediaId) continue;
            
            // Extract chat ID from message
            const fromNumber = msg.fromNumber + '@c.us';
            console.log(`\nProcessing message ${msg.mediaId} from ${fromNumber}`);
            
            try {
                // Fetch messages from WAHA for this chat
                const messagesRes = await axios.get(
                    `http://localhost:3000/api/default/chats/${fromNumber}/messages?limit=50`
                );
                
                // Find the specific message
                const wahaMessage = messagesRes.data.find(m => 
                    (m.id?.id || m.id) === msg.whatsappMessageId
                );
                
                if (wahaMessage && wahaMessage._data && wahaMessage._data.body && wahaMessage._data.type === 'image') {
                    console.log(`Found WAHA data for ${msg.mediaId}`);
                    console.log(`Data length: ${wahaMessage._data.body.length} chars`);
                    
                    // Save the media
                    const result = await mediaHandler.saveBase64Media(
                        wahaMessage._data.body,
                        wahaMessage._data.mimetype || 'image/jpeg',
                        msg.mediaId
                    );
                    
                    console.log(`✅ Saved: ${result.filename}`);
                } else {
                    console.log(`❌ No WAHA data found for ${msg.mediaId}`);
                }
                
            } catch (error) {
                console.log(`❌ Error processing ${msg.mediaId}:`, error.message);
            }
        }
        
        console.log('\n=== DONE ===');
        
    } catch (error) {
        console.error('Error:', error);
    }
    
    process.exit(0);
}

saveAllWAHAMedia();
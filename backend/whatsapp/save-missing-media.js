const { Message } = require('./src/models');
const MessagePoller = require('./src/services/MessagePoller');
const mediaHandler = require('./src/services/MediaHandler');
const fs = require('fs').promises;
const path = require('path');

async function saveMissingMedia() {
    console.log('=== SAVING MISSING MEDIA FILES ===\n');
    
    try {
        // Get image messages with mediaId
        const imageMessages = await Message.findAll({
            where: {
                messageType: 'image',
                mediaId: { [require('sequelize').Op.ne]: null }
            }
        });
        
        console.log(`Found ${imageMessages.length} image messages\n`);
        
        const messagePoller = new MessagePoller();
        
        // Check which files exist
        for (const msg of imageMessages) {
            const mediaPath = path.join(__dirname, 'media', `${msg.mediaId}.jpg`);
            
            try {
                await fs.access(mediaPath);
                console.log(`✓ Media exists: ${msg.mediaId}`);
            } catch (error) {
                console.log(`✗ Media missing: ${msg.mediaId}`);
                console.log(`  Attempting to fetch from WAHA...`);
                
                // Try to get from WAHA
                try {
                    const wahaMessages = await messagePoller.getChatMessages(msg.fromNumber.replace('@c.us', ''));
                    const wahaMsg = wahaMessages.find(m => m.id === msg.whatsappMessageId);
                    
                    if (wahaMsg && wahaMsg._data && wahaMsg._data.body) {
                        console.log(`  Found message in WAHA, saving...`);
                        const saved = await mediaHandler.saveBase64Media(
                            wahaMsg._data.body,
                            wahaMsg._data.mimetype || 'image/jpeg',
                            msg.mediaId
                        );
                        console.log(`  ✓ Saved to: ${saved.filename}`);
                    } else {
                        console.log(`  ✗ Message not found in WAHA or no media data`);
                    }
                } catch (fetchError) {
                    console.log(`  ✗ Error fetching from WAHA:`, fetchError.message);
                }
            }
        }
        
        console.log('\nDone!');
        
    } catch (error) {
        console.error('Error:', error);
    }
    
    process.exit(0);
}

saveMissingMedia();
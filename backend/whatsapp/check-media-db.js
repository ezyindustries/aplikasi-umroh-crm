const { Message, Conversation, Contact } = require('./src/models');
const { Op } = require('sequelize');

async function checkMediaMessages() {
    console.log('=== CHECKING MEDIA MESSAGES IN DATABASE ===\n');
    
    try {
        // Find media messages
        const mediaMessages = await Message.findAll({
            where: {
                messageType: {
                    [Op.ne]: 'text'
                }
            },
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        
        console.log(`Found ${mediaMessages.length} media messages\n`);
        
        if (mediaMessages.length === 0) {
            console.log('No media messages in database yet.');
            console.log('Please send an image, video, or document from WhatsApp.');
            return;
        }
        
        // Display each message
        mediaMessages.forEach((msg, index) => {
            console.log(`[${index + 1}] Message Details:`);
            console.log(`  ID: ${msg.id}`);
            console.log(`  Type: ${msg.messageType}`);
            console.log(`  Direction: ${msg.direction}`);
            console.log(`  From: ${msg.fromNumber}`);
            console.log(`  Media ID: ${msg.mediaId || 'NULL'}`);
            console.log(`  Media URL: ${msg.mediaUrl || 'NULL'}`);
            console.log(`  Thumbnail: ${msg.thumbnailUrl || 'NULL'}`);
            console.log(`  File Name: ${msg.fileName || 'NULL'}`);
            console.log(`  Mime Type: ${msg.mediaMimeType || 'NULL'}`);
            console.log(`  File Size: ${msg.mediaSize || 'NULL'}`);
            console.log(`  Caption: ${msg.mediaCaption || msg.content || 'No caption'}`);
            console.log(`  Created: ${msg.createdAt}`);
            
            // Show conversation ID for reference
            console.log(`  Conversation ID: ${msg.conversationId}`)
            
            console.log('---\n');
        });
        
        // Test media URL construction
        const sampleMsg = mediaMessages[0];
        if (sampleMsg && sampleMsg.mediaId) {
            console.log('Sample media URL construction:');
            console.log(`  Media ID: ${sampleMsg.mediaId}`);
            console.log(`  Expected URL: http://localhost:3001/api/messages/media/${sampleMsg.mediaId}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkMediaMessages();
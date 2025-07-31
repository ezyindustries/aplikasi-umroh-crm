const { Message } = require('./src/models');

async function checkMediaInDB() {
    console.log('=== CHECKING MEDIA DATA IN DATABASE ===\n');
    
    try {
        // Get messages with media
        const mediaMessages = await Message.findAll({
            where: {
                messageType: 'image'
            },
            limit: 5,
            order: [['createdAt', 'DESC']],
            raw: true
        });
        
        console.log(`Found ${mediaMessages.length} image messages\n`);
        
        mediaMessages.forEach((msg, i) => {
            console.log(`Message ${i + 1}:`);
            console.log(`  ID: ${msg.id}`);
            console.log(`  WhatsApp ID: ${msg.whatsappMessageId}`);
            console.log(`  Type: ${msg.messageType}`);
            console.log(`  MediaID: ${msg.mediaId || 'NULL'}`);
            console.log(`  MediaURL: ${msg.mediaUrl || 'NULL'}`);
            console.log(`  MediaMimeType: ${msg.mediaMimeType || 'NULL'}`);
            console.log(`  MediaSize: ${msg.mediaSize || 'NULL'}`);
            console.log(`  FileName: ${msg.fileName || 'NULL'}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    process.exit(0);
}

checkMediaInDB();
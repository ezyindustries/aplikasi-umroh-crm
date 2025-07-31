const { Message } = require('./src/models');
const { Op } = require('sequelize');

async function checkMediaMessages() {
    console.log('=== CHECKING FOR MEDIA MESSAGES ===\n');
    
    try {
        // Check for non-text messages
        const mediaMessages = await Message.findAll({
            where: {
                messageType: {
                    [Op.not]: 'text'
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        
        console.log(`Found ${mediaMessages.length} non-text messages:\n`);
        
        if (mediaMessages.length === 0) {
            console.log('❌ NO MEDIA MESSAGES FOUND IN DATABASE!');
            console.log('\nThis means:');
            console.log('1. Webhook is not receiving media messages from WAHA');
            console.log('2. Or media messages are being saved as "text" type');
            return;
        }
        
        // Show each media message
        mediaMessages.forEach((msg, i) => {
            console.log(`[${i+1}] Message Details:`);
            console.log(`   ID: ${msg.id}`);
            console.log(`   Type: ${msg.messageType}`);
            console.log(`   MediaID: ${msg.mediaId || 'NULL'}`);
            console.log(`   MediaURL: ${msg.mediaUrl || 'NULL'}`);
            console.log(`   FileName: ${msg.fileName || 'NULL'}`);
            console.log(`   MimeType: ${msg.mediaMimeType || 'NULL'}`);
            console.log(`   Content/Caption: ${msg.content || '[empty]'}`);
            console.log(`   Created: ${msg.createdAt.toLocaleString()}`);
            console.log(`   From: ${msg.fromNumber}`);
            console.log('');
        });
        
        // Also check if there are any messages with mediaId
        console.log('\n=== CHECKING MESSAGES WITH MEDIA ID ===\n');
        const messagesWithMediaId = await Message.findAll({
            where: {
                mediaId: {
                    [Op.ne]: null
                }
            },
            limit: 5
        });
        
        console.log(`Found ${messagesWithMediaId.length} messages with mediaId\n`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkMediaMessages();
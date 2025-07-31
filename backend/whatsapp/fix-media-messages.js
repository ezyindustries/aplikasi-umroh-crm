const { Message } = require('./src/models');
const { Op } = require('sequelize');

async function fixMediaMessages() {
    console.log('=== FIXING MEDIA MESSAGES ===\n');
    
    // List of message IDs that should be media messages based on our MessagePoller test
    const mediaMessageIds = [
        'false_6282255555000@c.us_3A7AEA606A724E752DDF',
        'false_6282255555000@c.us_3A3C406225E951B5F2B6',
        'false_6282255555000@c.us_3AD5E62A9F46C21E9C06',
        'false_6282255555000@c.us_3A370994581F48150FDC',
        'false_628155555000@c.us_5F5BC70BC515373C432FED888860C6F3',
        'false_628155555000@c.us_3A736C6B9F63BCD26E42',
        'false_628155555000@c.us_3A80044B3602B4EAE4CF',
        'false_628155555000@c.us_3A2AD2F592CC2D4BD07C',
        'false_628155555000@c.us_3A0ED78D6F60464D35DA'
    ];
    
    console.log(`Updating ${mediaMessageIds.length} messages to type 'image'...\n`);
    
    for (const messageId of mediaMessageIds) {
        try {
            const message = await Message.findOne({
                where: { whatsappMessageId: messageId }
            });
            
            if (message) {
                // Update to image type with media info
                await message.update({
                    messageType: 'image',
                    mediaId: messageId,
                    mediaUrl: `/api/messages/media/${messageId}`,
                    mediaMimeType: 'image/jpeg',
                    content: message.content || ''
                });
                
                console.log(`✅ Updated: ${messageId}`);
                console.log(`   Type: ${message.messageType}`);
                console.log(`   MediaId: ${message.mediaId}`);
                console.log(`   MediaUrl: ${message.mediaUrl}`);
            } else {
                console.log(`❌ Not found: ${messageId}`);
            }
        } catch (error) {
            console.error(`Error updating ${messageId}:`, error.message);
        }
    }
    
    console.log('\n=== VERIFICATION ===');
    const updatedMessages = await Message.findAll({
        where: {
            messageType: 'image'
        },
        limit: 5
    });
    
    console.log(`\nTotal image messages in database: ${updatedMessages.length}`);
    
    process.exit(0);
}

fixMediaMessages().catch(console.error);
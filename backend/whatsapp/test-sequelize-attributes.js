const { Message, Conversation } = require('./src/models');

async function testSequelizeAttributes() {
    console.log('=== TESTING SEQUELIZE ATTRIBUTES ===\n');
    
    try {
        // Get one conversation
        const conversation = await Conversation.findOne();
        if (!conversation) {
            console.log('No conversations found');
            return;
        }
        
        console.log(`Testing conversation: ${conversation.id}\n`);
        
        // Test 1: Default findAll
        console.log('Test 1: Default findAll');
        const msg1 = await Message.findOne({
            where: { conversationId: conversation.id, messageType: 'image' }
        });
        console.log('Keys:', Object.keys(msg1.dataValues));
        console.log('mediaId:', msg1.mediaId);
        console.log('');
        
        // Test 2: With specific attributes
        console.log('Test 2: With specific attributes');
        const msg2 = await Message.findOne({
            where: { conversationId: conversation.id, messageType: 'image' },
            attributes: [
                'id', 'conversationId', 'content', 'messageType',
                'direction', 'status', 'whatsappMessageId', 'createdAt',
                'isStarred', 'fromNumber', 'toNumber',
                'mediaId', 'mediaUrl', 'mediaMimeType', 'mediaSize', 'fileName',
                'sentAt', 'deliveredAt', 'readAt'
            ]
        });
        console.log('Keys:', Object.keys(msg2.dataValues));
        console.log('mediaId:', msg2.mediaId);
        console.log('');
        
        // Test 3: Raw query
        console.log('Test 3: Raw attributes');
        const msg3 = await Message.findOne({
            where: { conversationId: conversation.id, messageType: 'image' },
            attributes: ['id', 'mediaId', 'mediaUrl'],
            raw: true
        });
        console.log('Result:', msg3);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
    
    process.exit(0);
}

testSequelizeAttributes();
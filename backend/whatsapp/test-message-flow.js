const sequelize = require('./src/config/database');
const { Message, Conversation, Contact } = require('./src/models');
const logger = require('./src/utils/logger');

async function testMessageFlow() {
    try {
        logger.info('=== Testing Message Flow ===');
        
        // 1. Check database connection
        await sequelize.authenticate();
        logger.info('✓ Database connected');
        
        // 2. Check existing conversations
        const conversations = await Conversation.findAll({
            include: [{
                model: Contact,
                as: 'contact'
            }]
        });
        logger.info(`Found ${conversations.length} conversations`);
        
        // 3. Check messages
        const messages = await Message.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        logger.info(`Found ${messages.length} recent messages`);
        
        // 4. List conversations with message counts
        for (const conv of conversations) {
            const messageCount = await Message.count({
                where: { conversationId: conv.id }
            });
            logger.info(`Conversation ${conv.id}:`);
            logger.info(`  - Contact: ${conv.contact?.name || 'Unknown'} (${conv.contact?.phoneNumber})`);
            logger.info(`  - Messages: ${messageCount}`);
            logger.info(`  - Last message: ${conv.lastMessagePreview || 'None'}`);
            logger.info(`  - Unread: ${conv.unreadCount}`);
        }
        
        // 5. Check for any messages without proper phone numbers
        const invalidMessages = await Message.findAll({
            where: {
                [sequelize.Op.or]: [
                    { phoneNumber: null },
                    { phoneNumber: '' }
                ]
            }
        });
        logger.info(`\nMessages with invalid phone numbers: ${invalidMessages.length}`);
        
        // 6. Check Socket.IO functionality
        logger.info('\n=== Socket.IO Test ===');
        logger.info('To test Socket.IO:');
        logger.info('1. Make sure backend is running');
        logger.info('2. Open frontend in browser');
        logger.info('3. Check browser console for socket events');
        logger.info('4. Send a test message from WhatsApp');
        
    } catch (error) {
        logger.error('Test failed:', error);
    } finally {
        await sequelize.close();
    }
}

testMessageFlow();
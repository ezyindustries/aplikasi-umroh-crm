const sequelize = require('./src/config/database');
const { Message, Conversation, Contact } = require('./src/models');
const logger = require('./src/utils/logger');

async function testChatLoading() {
    try {
        logger.info('=== Testing Chat Loading ===');
        
        // 1. Check total conversations in database
        const totalConversations = await Conversation.count();
        logger.info(`Total conversations in database: ${totalConversations}`);
        
        // 2. Check total messages in database
        const totalMessages = await Message.count();
        logger.info(`Total messages in database: ${totalMessages}`);
        
        // 3. List all conversations with message counts
        const conversations = await Conversation.findAll({
            include: [{
                model: Contact,
                as: 'contact'
            }],
            order: [['lastMessageAt', 'DESC']]
        });
        
        logger.info('\nConversations with message counts:');
        for (const conv of conversations) {
            const messageCount = await Message.count({
                where: { conversationId: conv.id }
            });
            
            const lastMessage = await Message.findOne({
                where: { conversationId: conv.id },
                order: [['createdAt', 'DESC']]
            });
            
            logger.info(`\nConversation: ${conv.id}`);
            logger.info(`  Contact: ${conv.contact?.name} (${conv.contact?.phoneNumber})`);
            logger.info(`  Messages: ${messageCount}`);
            logger.info(`  Last Message: ${lastMessage?.content?.substring(0, 50) || 'None'}`);
            logger.info(`  Last Message At: ${conv.lastMessageAt || 'Never'}`);
            logger.info(`  Unread: ${conv.unreadCount}`);
        }
        
        // 4. Check for orphaned messages (messages without conversations)
        const orphanedMessages = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM messages m 
            WHERE NOT EXISTS (
                SELECT 1 FROM conversations c 
                WHERE c.id = m.conversation_id
            )
        `, { type: sequelize.QueryTypes.SELECT });
        
        logger.info(`\nOrphaned messages: ${orphanedMessages[0].count}`);
        
        // 5. Check recent messages
        const recentMessages = await Message.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{
                model: Conversation,
                as: 'conversation',
                include: [{
                    model: Contact,
                    as: 'contact'
                }]
            }]
        });
        
        logger.info('\nMost recent messages:');
        recentMessages.forEach(msg => {
            logger.info(`  ${msg.createdAt} - ${msg.conversation?.contact?.name || 'Unknown'}: ${msg.content?.substring(0, 30)}...`);
        });
        
    } catch (error) {
        logger.error('Test failed:', error);
    } finally {
        await sequelize.close();
    }
}

testChatLoading();
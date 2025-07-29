const sequelize = require('./src/config/database');
const { Message, Conversation } = require('./src/models');
const logger = require('./src/utils/logger');

async function fixConversations() {
    try {
        logger.info('=== FIXING CONVERSATION DATA ===\n');
        
        // Get all conversations
        const conversations = await Conversation.findAll();
        
        for (const conv of conversations) {
            // Get latest text message (skip notifications)
            const latestMessage = await Message.findOne({
                where: { 
                    conversationId: conv.id,
                    messageType: 'text' // Only text messages
                },
                order: [['createdAt', 'DESC']]
            });
            
            if (latestMessage && latestMessage.content) {
                // Update conversation with latest message info
                await conv.update({
                    lastMessagePreview: latestMessage.content.substring(0, 100),
                    lastMessageAt: latestMessage.createdAt
                });
                
                logger.info(`Updated conversation ${conv.id}:`);
                logger.info(`  - Preview: ${latestMessage.content.substring(0, 50)}...`);
                logger.info(`  - Time: ${latestMessage.createdAt}`);
            } else {
                logger.info(`No valid messages for conversation ${conv.id}`);
            }
        }
        
        logger.info('\n✅ Conversations fixed!');
        
    } catch (error) {
        logger.error('Error fixing conversations:', error);
    } finally {
        await sequelize.close();
    }
}

fixConversations();
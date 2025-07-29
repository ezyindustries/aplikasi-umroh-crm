const sequelize = require('./src/config/database');
const { Message, Conversation, Contact } = require('./src/models');
const logger = require('./src/utils/logger');

async function checkAllMessages() {
    try {
        logger.info('=== CHECKING ALL MESSAGES IN DATABASE ===\n');
        
        // 1. Count total records
        const totalContacts = await Contact.count();
        const totalConversations = await Conversation.count();
        const totalMessages = await Message.count();
        
        logger.info('📊 DATABASE SUMMARY:');
        logger.info(`   Contacts: ${totalContacts}`);
        logger.info(`   Conversations: ${totalConversations}`);
        logger.info(`   Messages: ${totalMessages}`);
        logger.info('');
        
        // 2. List all messages with full details
        logger.info('📨 ALL MESSAGES IN DATABASE:');
        logger.info('================================');
        
        const allMessages = await Message.findAll({
            include: [{
                model: Conversation,
                as: 'conversation',
                include: [{
                    model: Contact,
                    as: 'contact'
                }]
            }],
            order: [['createdAt', 'DESC']]
        });
        
        if (allMessages.length === 0) {
            logger.info('❌ NO MESSAGES FOUND IN DATABASE!');
        } else {
            allMessages.forEach((msg, index) => {
                logger.info(`\nMESSAGE #${index + 1}:`);
                logger.info(`   ID: ${msg.id}`);
                logger.info(`   Content: "${msg.content || '[EMPTY CONTENT]'}"`);
                logger.info(`   Direction: ${msg.direction}`);
                logger.info(`   Status: ${msg.status}`);
                logger.info(`   Type: ${msg.messageType}`);
                logger.info(`   From: ${msg.fromNumber}`);
                logger.info(`   To: ${msg.toNumber}`);
                logger.info(`   WhatsApp ID: ${msg.whatsappMessageId}`);
                logger.info(`   Created At: ${msg.createdAt}`);
                logger.info(`   Sent At: ${msg.sentAt}`);
                logger.info(`   Contact: ${msg.conversation?.contact?.name || 'Unknown'} (${msg.conversation?.contact?.phoneNumber})`);
                logger.info(`   Conversation ID: ${msg.conversationId}`);
                logger.info('   ---');
            });
        }
        
        // 3. Check conversations and their messages
        logger.info('\n\n💬 CONVERSATIONS WITH MESSAGE COUNTS:');
        logger.info('=====================================');
        
        const conversations = await Conversation.findAll({
            include: [{
                model: Contact,
                as: 'contact'
            }]
        });
        
        for (const conv of conversations) {
            const msgCount = await Message.count({
                where: { conversationId: conv.id }
            });
            
            const latestMsg = await Message.findOne({
                where: { conversationId: conv.id },
                order: [['createdAt', 'DESC']]
            });
            
            logger.info(`\nCONVERSATION: ${conv.id}`);
            logger.info(`   Contact: ${conv.contact?.name} (${conv.contact?.phoneNumber})`);
            logger.info(`   Status: ${conv.status}`);
            logger.info(`   Message Count: ${msgCount}`);
            logger.info(`   Last Message Preview: "${conv.lastMessagePreview || '[NOT SET]'}"`);
            logger.info(`   Last Message At: ${conv.lastMessageAt || '[NOT SET]'}`);
            logger.info(`   Unread Count: ${conv.unreadCount}`);
            
            if (latestMsg) {
                logger.info(`   Latest Message:`);
                logger.info(`      - Content: "${latestMsg.content || '[EMPTY]'}"`);
                logger.info(`      - Created: ${latestMsg.createdAt}`);
                logger.info(`      - Direction: ${latestMsg.direction}`);
            }
        }
        
        // 4. Check for empty content messages
        logger.info('\n\n⚠️  MESSAGES WITH EMPTY CONTENT:');
        logger.info('==================================');
        
        const emptyMessages = await Message.findAll({
            where: {
                [sequelize.Op.or]: [
                    { content: null },
                    { content: '' }
                ]
            }
        });
        
        logger.info(`Found ${emptyMessages.length} messages with empty content`);
        emptyMessages.forEach(msg => {
            logger.info(`   - ID: ${msg.id}, Type: ${msg.messageType}, From: ${msg.fromNumber}`);
        });
        
        // 5. Check API response format
        logger.info('\n\n🔌 CHECKING API RESPONSE:');
        logger.info('========================');
        
        // Simulate what the API would return
        const apiResponse = await Contact.findAll({
            include: [{
                model: Conversation,
                as: 'conversations',
                where: { status: 'active' },
                required: false,
                include: [{
                    model: Message,
                    as: 'messages',
                    order: [['createdAt', 'DESC']],
                    limit: 1
                }]
            }],
            order: [['updatedAt', 'DESC']]
        });
        
        logger.info(`API would return ${apiResponse.length} contacts`);
        apiResponse.forEach(contact => {
            const conv = contact.conversations?.[0];
            const msg = conv?.messages?.[0];
            logger.info(`\nContact: ${contact.name}`);
            logger.info(`   Has conversation: ${conv ? 'YES' : 'NO'}`);
            logger.info(`   Has message: ${msg ? 'YES' : 'NO'}`);
            if (msg) {
                logger.info(`   Message content: "${msg.content || '[EMPTY]'}"`);
            }
        });
        
    } catch (error) {
        logger.error('Error checking messages:', error);
    } finally {
        await sequelize.close();
    }
}

checkAllMessages();
const sequelize = require('./src/config/database');
const { Message, Conversation, Contact } = require('./src/models');
const logger = require('./src/utils/logger');

async function debugMessages() {
    try {
        logger.info('=== Debugging Message Flow ===');
        
        // 1. Check Socket.IO setup
        logger.info('\n1. Checking server.js for Socket.IO setup...');
        const fs = require('fs');
        const serverContent = fs.readFileSync('./server.js', 'utf8');
        const hasSocketIO = serverContent.includes('socket.io');
        const hasGlobalIO = serverContent.includes('global.io');
        logger.info(`   - Socket.IO imported: ${hasSocketIO}`);
        logger.info(`   - Global IO set: ${hasGlobalIO}`);
        
        // 2. Check database for recent messages
        logger.info('\n2. Checking database for messages...');
        const totalMessages = await Message.count();
        logger.info(`   - Total messages in DB: ${totalMessages}`);
        
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
        
        logger.info('\n3. Recent messages:');
        for (const msg of recentMessages) {
            logger.info(`   - ${msg.createdAt.toISOString()}`);
            logger.info(`     From: ${msg.fromNumber}`);
            logger.info(`     To: ${msg.toNumber}`);
            logger.info(`     Content: ${msg.content?.substring(0, 50)}...`);
            logger.info(`     Conversation ID: ${msg.conversationId}`);
            logger.info(`     Contact: ${msg.conversation?.contact?.name || 'Unknown'}`);
            logger.info('');
        }
        
        // 3. Check conversations
        logger.info('\n4. Active conversations:');
        const conversations = await Conversation.findAll({
            where: { status: 'active' },
            include: [{
                model: Contact,
                as: 'contact'
            }]
        });
        
        for (const conv of conversations) {
            const msgCount = await Message.count({
                where: { conversationId: conv.id }
            });
            logger.info(`   - ${conv.contact?.name || 'Unknown'} (${conv.contact?.phoneNumber})`);
            logger.info(`     ID: ${conv.id}`);
            logger.info(`     Messages: ${msgCount}`);
            logger.info(`     Last message: ${conv.lastMessagePreview || 'None'}`);
            logger.info(`     Unread: ${conv.unreadCount}`);
            logger.info('');
        }
        
        // 4. Check WhatsAppWebService message handling
        logger.info('\n5. Checking WhatsAppWebService.js...');
        const serviceContent = fs.readFileSync('./src/services/WhatsAppWebService.js', 'utf8');
        const hasMessageHandler = serviceContent.includes("client.on('message'");
        const hasSocketEmit = serviceContent.includes("global.io.emit('message:new'");
        logger.info(`   - Message handler exists: ${hasMessageHandler}`);
        logger.info(`   - Socket emit exists: ${hasSocketEmit}`);
        
        // 5. Check frontend socket listeners
        logger.info('\n6. Frontend checks needed:');
        logger.info('   - Check browser console for Socket.IO connection');
        logger.info('   - Look for "message:new" events in console');
        logger.info('   - Verify loadContacts() is called after events');
        
        // 6. Common issues
        logger.info('\n7. Common issues to check:');
        logger.info('   - Is Socket.IO connected? Check browser console');
        logger.info('   - Are messages being saved to DB? Check counts above');
        logger.info('   - Is frontend listening to correct events?');
        logger.info('   - Is conversation ID matching between frontend and backend?');
        
    } catch (error) {
        logger.error('Debug failed:', error);
    } finally {
        await sequelize.close();
    }
}

debugMessages();
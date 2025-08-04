const { Message } = require('./backend/whatsapp/src/models');
const { Op } = require('sequelize');

async function fixTimeoutIssues() {
    console.log('🔧 Fixing WAHA Timeout Issues...\n');
    
    try {
        // 1. Clear stuck pending messages
        console.log('1. Clearing stuck pending messages...');
        const stuckMessages = await Message.update(
            {
                status: 'failed',
                errorMessage: 'Cleared due to timeout - message was stuck in queue'
            },
            {
                where: {
                    status: 'pending',
                    createdAt: {
                        [Op.lt]: new Date(Date.now() - 60000) // Older than 1 minute
                    }
                }
            }
        );
        console.log(`✅ Cleared ${stuckMessages[0]} stuck messages\n`);
        
        // 2. Check for messages with null whatsappMessageId
        console.log('2. Fixing messages with null whatsappMessageId...');
        const nullIdMessages = await Message.update(
            {
                whatsappMessageId: 'temp-' + Date.now()
            },
            {
                where: {
                    whatsappMessageId: null,
                    status: 'pending'
                }
            }
        );
        console.log(`✅ Fixed ${nullIdMessages[0]} messages with null IDs\n`);
        
        // 3. Get queue statistics
        console.log('3. Current queue statistics:');
        const pendingCount = await Message.count({
            where: { status: 'pending' }
        });
        const failedCount = await Message.count({
            where: { 
                status: 'failed',
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 3600000) // Last hour
                }
            }
        });
        
        console.log(`📊 Pending messages: ${pendingCount}`);
        console.log(`📊 Failed messages (last hour): ${failedCount}`);
        
        // 4. Recommendations
        console.log('\n📋 Recommendations:');
        console.log('1. Restart the backend server to clear in-memory queues');
        console.log('2. Check WAHA container logs: docker logs waha-plus');
        console.log('3. Ensure WhatsApp is properly connected (scan QR if needed)');
        console.log('4. Consider increasing timeout in RealWAHAService.js');
        
        console.log('\n✅ Cleanup completed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

fixTimeoutIssues();
const sequelize = require('./src/config/database');
const { Message, Conversation, Contact } = require('./src/models');
const logger = require('./src/utils/logger');

// Import WAHA service
const whatsappService = require('./src/services/RealWAHAService');

async function forceLoadChats() {
    try {
        logger.info('=== FORCE LOADING WHATSAPP CHATS ===\n');
        
        // Check if WhatsApp is connected
        const sessionName = 'default';
        
        const status = await whatsappService.getSessionStatus(sessionName);
        logger.info(`📱 WhatsApp Status: ${status.status}`);
        
        if (status.status !== 'authenticated') {
            logger.error('❌ WhatsApp is not connected!');
            logger.info('\n📱 Please make sure:');
            logger.info('1. Backend is running');
            logger.info('2. WhatsApp is connected (scan QR if needed)');
            logger.info('3. Status shows "Connected" in the app');
            return;
        }
        
        logger.info('✅ WhatsApp is connected!\n');
        logger.info('🔄 Starting to load all chats...\n');
        
        // Use WAHA service to load chats
        await whatsappService.loadExistingChats(sessionName);
        
        logger.info('\n\n=============================');
        logger.info('✅ CHAT LOADING INITIATED!');
        logger.info('=============================\n');
        
        logger.info('🔄 Please wait for chats to load and then refresh your browser!');
        logger.info('📊 Check the backend logs for progress updates.');
        
    } catch (error) {
        logger.error('❌ Error loading chats:', error);
    }
}

// Run the force load
forceLoadChats().then(() => {
    logger.info('\n📌 Script completed. Keep the backend running!');
    // Don't close sequelize - let the backend keep running
});

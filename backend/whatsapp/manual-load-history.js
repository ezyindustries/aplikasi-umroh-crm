const whatsappService = require('./src/services/WhatsAppWebService');
const logger = require('./src/utils/logger');

async function manualLoadHistory() {
    try {
        logger.info('=== MANUALLY LOADING CHAT HISTORY ===\n');
        
        // Check if client is connected
        const client = whatsappService.clients.get('default');
        
        if (!client) {
            logger.error('❌ WhatsApp client not found! Please connect WhatsApp first.');
            return;
        }
        
        const state = await client.getState();
        logger.info(`WhatsApp State: ${state}`);
        
        if (state !== 'CONNECTED') {
            logger.error('❌ WhatsApp not connected! Current state:', state);
            return;
        }
        
        logger.info('✅ WhatsApp is connected. Loading chat history...\n');
        
        // Load existing chats
        await whatsappService.loadExistingChats('default', client);
        
        logger.info('\n✅ Chat history loading initiated!');
        logger.info('Check the backend console for progress...');
        
    } catch (error) {
        logger.error('Error loading history:', error);
    }
}

// Don't close sequelize here as WhatsApp service needs it
manualLoadHistory();
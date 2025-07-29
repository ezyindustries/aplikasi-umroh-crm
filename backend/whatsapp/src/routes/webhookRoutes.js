const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const messageQueue = require('../services/MessageQueue');

// WAHA Webhook handler
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    logger.webhook.info('Webhook received:', { 
      event: webhookData.event,
      sessionId: webhookData.session
    });

    // Handle different webhook events
    switch (webhookData.event) {
      case 'message':
        await handleIncomingMessage(webhookData);
        break;
      
      case 'message.ack':
        await handleMessageAck(webhookData);
        break;
        
      case 'session.status':
        await handleSessionStatus(webhookData);
        break;
        
      default:
        logger.webhook.debug('Unhandled webhook event:', webhookData.event);
    }

    res.json({ success: true });
  } catch (error) {
    logger.webhook.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle incoming message
async function handleIncomingMessage(webhookData) {
  try {
    const { payload } = webhookData;
    
    // Skip if message is from me
    if (payload.fromMe) return;
    
    // Format message for our system
    const message = {
      id: payload.id._serialized || payload.id,
      from: payload.from,
      to: payload.to || webhookData.session,
      type: payload.type || 'chat',
      text: payload.body || payload.caption || '',
      timestamp: payload.timestamp * 1000,
      isForwarded: payload.isForwarded || false,
      quotedMessageId: payload.quotedMsgId,
      mediaId: payload.mediaKey
    };
    
    logger.webhook.info('Processing incoming message:', {
      from: message.from,
      type: message.type,
      hasText: !!message.text
    });
    
    // Process through message queue
    await messageQueue.processIncomingMessage({
      sessionId: webhookData.session || 'default',
      message: message
    });
    
    // Emit to frontend via Socket.IO
    if (global.io) {
      global.io.emit('message:new', {
        sessionId: webhookData.session,
        message: message
      });
    }
    
  } catch (error) {
    logger.webhook.error('Error handling incoming message:', error);
    throw error;
  }
}

// Handle message acknowledgment (delivery/read receipts)
async function handleMessageAck(webhookData) {
  try {
    const { payload } = webhookData;
    const ackTypes = {
      1: 'sent',
      2: 'delivered',
      3: 'read'
    };
    
    const status = ackTypes[payload.ack] || 'unknown';
    
    logger.webhook.info('Message ack received:', {
      messageId: payload.id._serialized,
      status: status
    });
    
    // Update message status
    await messageQueue.updateMessageStatus(
      payload.id._serialized || payload.id,
      status,
      Date.now()
    );
    
    // Emit status update to frontend
    if (global.io) {
      global.io.emit('message:status', {
        messageId: payload.id._serialized || payload.id,
        status: status
      });
    }
    
  } catch (error) {
    logger.webhook.error('Error handling message ack:', error);
  }
}

// Handle session status update
async function handleSessionStatus(webhookData) {
  try {
    const { payload } = webhookData;
    
    logger.webhook.info('Session status update:', {
      session: webhookData.session,
      status: payload.status
    });
    
    // Emit to frontend
    if (global.io) {
      global.io.emit('session:status', {
        sessionId: webhookData.session,
        status: payload.status
      });
    }
    
  } catch (error) {
    logger.webhook.error('Error handling session status:', error);
  }
}

module.exports = router;
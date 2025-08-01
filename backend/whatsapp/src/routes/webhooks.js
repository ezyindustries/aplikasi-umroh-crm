const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const wahaService = require('../services/RealWAHAService');
const logger = require('../utils/logger');

/**
 * WAHA Webhook Endpoint
 * Receives all events from WAHA
 */
router.post('/waha', async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers['x-webhook-signature'];
    
    // Verify HMAC signature if provided
    if (signature && process.env.WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify(event))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Log the event with full details
    logger.info(`WAHA Webhook Event: ${event.event}`, {
      session: event.session,
      event: event.event,
      from: event.payload?.from,
      to: event.payload?.to,
      body: event.payload?.body,
      type: event.payload?.type,
      id: event.payload?.id,
      timestamp: new Date().toISOString()
    });
    
    console.log('\n=== WEBHOOK RECEIVED ===');
    console.log('Time:', new Date().toISOString());
    console.log('Event:', event.event);
    console.log('Session:', event.session);
    
    // Special logging for messages
    if (event.event === 'message' && event.payload) {
      console.log('Message Type:', event.payload.type);
      console.log('From:', event.payload.from);
      console.log('To:', event.payload.to);
      console.log('Has Media:', !!event.payload.media);
      
      if (event.payload.media) {
        console.log('=== MEDIA DETECTED ===');
        console.log('Media ID:', event.payload.media.id);
        console.log('Mimetype:', event.payload.media.mimetype);
        console.log('Filename:', event.payload.media.filename);
        console.log('Size:', event.payload.media.filesize);
        console.log('URL:', event.payload.media.url);
      }
    }
    
    console.log('Full Payload:', JSON.stringify(event.payload, null, 2));
    console.log('========================\n');
    
    // Emit to frontend for monitoring
    if (global.io) {
      global.io.emit('webhook:received', event);
      global.io.emit('log:webhook', {
        message: `Webhook received: ${event.event}`,
        level: 'info',
        data: {
          session: event.session,
          from: event.payload?.from
        }
      });
    }
    
    // Process webhook directly (not async) to ensure it completes
    try {
      logger.info('Processing webhook event through WebhookHandler...');
      
      // Use WebhookHandler directly for clearer flow
      const webhookHandler = require('../services/WebhookHandler');
      
      // Process in background but don't wait
      webhookHandler.handleWebhook(event).then(() => {
        logger.info('Webhook event processed successfully');
      }).catch(error => {
        logger.error('Error processing webhook:', error);
        console.error('Full error stack:', error.stack);
        if (global.io) {
          global.io.emit('log:webhook', {
            message: 'Error processing webhook',
            level: 'error',
            data: { error: error.message }
          });
        }
      });
      
    } catch (error) {
      logger.error('Error initiating webhook processing:', error);
    }
    
    // Respond immediately
    res.status(200).json({ success: true });
    
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint for WAHA
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;
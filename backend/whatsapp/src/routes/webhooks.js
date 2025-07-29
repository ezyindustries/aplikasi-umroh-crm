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
    
    // Log the event
    logger.info(`WAHA Webhook Event: ${event.event}`, {
      session: event.session,
      event: event.event
    });
    
    // Process the event asynchronously
    setImmediate(() => {
      wahaService.handleWebhook(event).catch(error => {
        logger.error('Error processing webhook:', error);
      });
    });
    
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
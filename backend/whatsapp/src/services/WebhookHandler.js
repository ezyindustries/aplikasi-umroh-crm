const messageQueue = require('./MessageQueue');
const logger = require('../utils/logger');
const crypto = require('crypto');

class WebhookHandler {
  constructor() {
    this.webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
  }

  // Verify webhook signature (if WAHA supports it)
  verifySignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }

  // Main webhook handler
  async handleWebhook(payload, headers = {}) {
    try {
      logger.webhook.info('Received webhook:', {
        event: payload.event,
        sessionId: payload.sessionId
      });

      // Verify signature if provided
      if (headers['x-webhook-signature']) {
        const isValid = this.verifySignature(payload, headers['x-webhook-signature']);
        if (!isValid) {
          logger.webhook.warn('Invalid webhook signature');
          return { success: false, error: 'Invalid signature' };
        }
      }

      // Handle different event types
      switch (payload.event) {
        case 'message':
          await this.handleMessage(payload);
          break;
          
        case 'message.ack':
          await this.handleMessageAck(payload);
          break;
          
        case 'state.change':
          await this.handleStateChange(payload);
          break;
          
        case 'group.join':
          await this.handleGroupJoin(payload);
          break;
          
        case 'group.leave':
          await this.handleGroupLeave(payload);
          break;
          
        case 'call':
          await this.handleCall(payload);
          break;
          
        default:
          logger.webhook.warn('Unknown webhook event:', payload.event);
      }

      return { success: true };
    } catch (error) {
      logger.webhook.error('Error handling webhook:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle incoming message
  async handleMessage(payload) {
    const { message, contact, sessionId } = payload;

    // Skip if message is from self
    if (message.fromMe) {
      return;
    }

    // Queue message for processing
    await messageQueue.queueIncomingMessage({
      message,
      contact,
      sessionId,
      timestamp: new Date()
    });
  }

  // Handle message acknowledgment (delivery/read receipts)
  async handleMessageAck(payload) {
    const { message, ack } = payload;
    
    let status;
    switch (ack) {
      case 1: // SENT
        status = 'sent';
        break;
      case 2: // DELIVERED
        status = 'delivered';
        break;
      case 3: // READ
        status = 'read';
        break;
      case 4: // PLAYED (for audio)
        status = 'read';
        break;
      default:
        return;
    }

    await messageQueue.queueStatusUpdate(
      message.id,
      status,
      message.timestamp
    );
  }

  // Handle connection state changes
  async handleStateChange(payload) {
    const { state, sessionId } = payload;
    const { WhatsAppSession } = require('../models');

    logger.webhook.info(`Session ${sessionId} state changed to: ${state}`);

    // Update session status in database
    await WhatsAppSession.update(
      { 
        status: this.mapStateToStatus(state),
        lastHealthCheck: new Date()
      },
      { where: { sessionName: sessionId } }
    );

    // Emit event for real-time updates
    if (global.io) {
      global.io.emit('session:status', {
        sessionId,
        status: state
      });
    }
  }

  // Handle group join events
  async handleGroupJoin(payload) {
    const { group, contact, sessionId } = payload;
    
    logger.webhook.info('Group join event:', {
      group: group.name,
      contact: contact.name,
      sessionId
    });

    // You can implement group tracking here if needed
  }

  // Handle group leave events
  async handleGroupLeave(payload) {
    const { group, contact, sessionId } = payload;
    
    logger.webhook.info('Group leave event:', {
      group: group.name,
      contact: contact.name,
      sessionId
    });
  }

  // Handle incoming calls
  async handleCall(payload) {
    const { call, contact, sessionId } = payload;
    
    logger.webhook.info('Incoming call:', {
      from: contact.name,
      type: call.isVideo ? 'video' : 'voice',
      sessionId
    });

    // You can implement call logging or auto-reject here
  }

  // Map WAHA state to our status
  mapStateToStatus(state) {
    const stateMap = {
      'STOPPED': 'disconnected',
      'STARTING': 'connecting',
      'SCAN_QR_CODE': 'qr',
      'WORKING': 'connected',
      'FAILED': 'failed'
    };

    return stateMap[state] || 'disconnected';
  }
}

// Create singleton instance
const webhookHandler = new WebhookHandler();

module.exports = webhookHandler;
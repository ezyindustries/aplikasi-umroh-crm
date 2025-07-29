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
  async handleMessage(event) {
    // WAHA sends the full event structure
    const { payload, session } = event;
    
    // Process all messages including fromMe to track outgoing messages from phone
    // This allows messages sent from phone to appear in the CRM
    const isFromMe = payload.fromMe || false;

    logger.webhook.info('Processing message:', {
      from: payload.from,
      to: payload.to,
      messageId: payload.id,
      session: session,
      isFromMe: isFromMe
    });

    // Queue message for processing with WAHA format
    await messageQueue.processIncomingMessage({
      sessionId: session,
      message: {
        id: payload.id,
        from: payload.from,
        to: payload.to || session,
        type: payload.type || 'text',
        text: payload.body,
        caption: payload.caption,
        mediaId: payload.media?.id,
        timestamp: payload.timestamp,
        isForwarded: payload.isForwarded || false,
        quotedMessageId: payload.quotedMsgId,
        pushname: payload._data?.notifyName || payload.from,
        fromMe: isFromMe
      }
    });
  }

  // Handle message acknowledgment (delivery/read receipts)
  async handleMessageAck(event) {
    const { payload } = event;
    
    let status;
    switch (payload.ack) {
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
      payload.id,
      status,
      payload.timestamp
    );
  }

  // Handle connection state changes
  async handleStateChange(event) {
    const { payload, session } = event;
    const { WhatsAppSession } = require('../models');

    logger.webhook.info(`Session ${session} state changed to: ${payload}`);

    // Update session status in database
    await WhatsAppSession.update(
      { 
        status: this.mapStateToStatus(payload),
        lastHealthCheck: new Date()
      },
      { where: { sessionName: session } }
    );

    // Emit event for real-time updates
    if (global.io) {
      global.io.emit('session:status', {
        sessionId: session,
        status: payload
      });
    }
  }

  // Handle group join events
  async handleGroupJoin(event) {
    const { payload, session } = event;
    
    logger.webhook.info('Group join event:', {
      group: payload.id,
      participant: payload.participant,
      sessionId: session
    });

    // You can implement group tracking here if needed
  }

  // Handle group leave events
  async handleGroupLeave(event) {
    const { payload, session } = event;
    
    logger.webhook.info('Group leave event:', {
      group: payload.id,
      participant: payload.participant,
      sessionId: session
    });
  }

  // Handle incoming calls
  async handleCall(event) {
    const { payload, session } = event;
    
    logger.webhook.info('Incoming call:', {
      from: payload.from,
      type: payload.isVideo ? 'video' : 'voice',
      sessionId: session
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
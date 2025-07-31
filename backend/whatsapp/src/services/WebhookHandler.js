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
          
        // Handle both old and new group event formats
        case 'group.join':
        case 'group.v2.join':
          await this.handleGroupJoin(event);
          break;
          
        case 'group.leave':
        case 'group.v2.leave':
          await this.handleGroupLeave(event);
          break;
          
        case 'group.v2.participants':
          await this.handleGroupParticipants(event);
          break;
          
        case 'group.v2.update':
          await this.handleGroupUpdate(event);
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

    // Check if it's a group message
    const isGroupMessage = payload.from?.includes('@g.us') || payload.to?.includes('@g.us');
    const groupId = isGroupMessage ? (payload.from?.includes('@g.us') ? payload.from : payload.to) : null;

    // Enhanced logging for debugging
    logger.webhook.info('=== WEBHOOK MESSAGE RECEIVED ===');
    logger.webhook.info('Processing message:', {
      from: payload.from,
      to: payload.to,
      messageId: payload.id,
      session: session,
      isFromMe: isFromMe,
      isGroupMessage: isGroupMessage,
      type: payload.type,
      hasMedia: !!payload.media,
      mediaId: payload.media?.id,
      mediaType: payload.media?.mimetype,
      author: payload.author,
      participant: payload.participant,
      chatName: payload.chatName,
      _data_author: payload._data?.author,
      sender: payload.sender
    });
    
    // Special logging for group messages
    if (isGroupMessage && !isFromMe) {
      logger.webhook.info('GROUP MESSAGE SENDER DETECTION:', {
        author: payload.author,
        participant: payload.participant,
        _data_author: payload._data?.author,
        sender_id: payload.sender?.id,
        from: payload.from,
        finalParticipant: payload.author || payload.participant || payload._data?.author || null
      });
    }
    
    // Log full payload for debugging media issues
    if (payload.media || payload.type === 'image' || payload.type === 'video') {
      logger.webhook.info('Media details:', JSON.stringify({
        media: payload.media,
        mediaKey: payload.mediaKey,
        mediaUrl: payload.mediaUrl,
        type: payload.type,
        hasFile: !!payload.file,
        id: payload.id
      }));
    }
    logger.webhook.debug('Full payload:', JSON.stringify(payload));
    
    // If media URL is provided by WAHA, add it to media object
    if (payload.media && !payload.media.url && payload.mediaUrl) {
      payload.media.url = payload.mediaUrl;
    }

    // Prepare message data with full media support
    const messageData = {
      sessionId: session,
      message: {
        id: payload.id,
        from: payload.from,
        to: payload.to || session,
        type: payload.type || 'text',
        text: payload.body,
        body: payload.body, // Add body field
        caption: payload.caption,
        mediaId: payload.media?.id || payload.mediaKey || payload.id,
        timestamp: payload.timestamp,
        isForwarded: payload.isForwarded || false,
        quotedMessageId: payload.quotedMsgId,
        pushname: payload._data?.notifyName || payload.notifyName || payload.from,
        fromMe: isFromMe,
        // Group message fields
        isGroupMessage: isGroupMessage,
        groupId: groupId,
        groupParticipant: isGroupMessage && !isFromMe ? (payload.author || payload.participant || payload._data?.author || null) : null,
        // Media fields
        media: payload.media,
        fileName: payload.media?.filename || payload.filename,
        mimeType: payload.media?.mimetype || payload.mimetype,
        fileSize: payload.media?.filesize || payload.filesize,
        // Location fields
        location: payload.location,
        latitude: payload.location?.latitude,
        longitude: payload.location?.longitude,
        locationName: payload.location?.name,
        locationAddress: payload.location?.address,
        // Contact fields
        vcard: payload.vcard,
        // Additional media metadata
        mediaUrl: payload.media?.url,
        thumbnailUrl: payload.media?.preview,
        mediaDuration: payload.media?.duration,
        mediaWidth: payload.media?.width,
        mediaHeight: payload.media?.height
      }
    };

    // Queue message for processing
    await messageQueue.processIncomingMessage(messageData);
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

    // If state is CONNECTED/authenticated, verify webhook is properly configured
    if (payload === 'CONNECTED' || payload === 'authenticated' || payload === 'READY') {
      logger.webhook.info('Session authenticated! Verifying webhook configuration...');
      
      // Re-configure webhook to ensure it's working
      try {
        const wahaService = require('./RealWAHAService');
        const webhookUrl = process.env.WEBHOOK_URL || 'http://host.docker.internal:3001/api/webhooks/waha';
        await wahaService.setWebhook(session, webhookUrl);
        logger.webhook.info('Webhook re-configured successfully after authentication');
      } catch (error) {
        logger.webhook.error('Failed to re-configure webhook:', error);
      }
    }

    // Emit event for real-time updates
    if (global.io) {
      global.io.emit('session:status', {
        sessionId: session,
        status: payload
      });
    }
  }

  // Handle group join events (when bot joins a group)
  async handleGroupJoin(event) {
    const { payload, session } = event;
    const { Contact, Conversation, GroupParticipant } = require('../models');
    
    logger.webhook.info('Group join event:', {
      event: event.event,
      groupId: payload.group?.id,
      groupSubject: payload.group?.subject,
      sessionId: session
    });

    try {
      // Extract numeric ID from group.id if it includes @g.us
      const groupIdFull = payload.group.id;
      const numericGroupId = groupIdFull.replace('@g.us', '');
      
      // Create or update group contact
      const [groupContact, created] = await Contact.findOrCreate({
        where: { phoneNumber: numericGroupId },
        defaults: {
          name: payload.group.subject || 'Unknown Group',
          isGroup: true,
          groupId: numericGroupId,
          status: 'active',
          source: 'whatsapp',
          metadata: {
            groupName: payload.group.subject,
            waGroupId: groupIdFull,
            groupDescription: payload.group.description,
            participantCount: payload.group.participants?.length || 0,
            createdAt: new Date()
          }
        }
      });

      // Update if exists
      if (!created && groupContact) {
        await groupContact.update({
          name: payload.group.subject || groupContact.name,
          metadata: {
            ...groupContact.metadata,
            groupName: payload.group.subject,
            waGroupId: groupIdFull,
            groupDescription: payload.group.description,
            participantCount: payload.group.participants?.length || 0,
            lastUpdated: new Date()
          }
        });
      }

      // Create conversation for the group
      const [conversation] = await Conversation.findOrCreate({
        where: {
          contactId: groupContact.id,
          sessionId: session
        },
        defaults: {
          status: 'active',
          isGroup: true,
          groupId: payload.group.id,
          metadata: {
            invite: payload.group.invite,
            membersCanAddNewMember: payload.group.membersCanAddNewMember,
            membersCanSendMessages: payload.group.membersCanSendMessages,
            newMembersApprovalRequired: payload.group.newMembersApprovalRequired
          }
        }
      });

      // Track participants
      if (payload.group.participants) {
        for (const participant of payload.group.participants) {
          // Find or create contact for participant
          const [participantContact] = await Contact.findOrCreate({
            where: { phoneNumber: participant.id.replace('@c.us', '') },
            defaults: {
              name: participant.id.replace('@c.us', ''),
              status: 'active',
              source: 'whatsapp'
            }
          });

          // Add to group participants
          await GroupParticipant.findOrCreate({
            where: {
              groupId: payload.group.id,
              phoneNumber: participant.id
            },
            defaults: {
              contactId: participantContact.id,
              isAdmin: participant.role === 'admin',
              joinedAt: new Date()
            }
          });
        }
      }

      // Emit event for real-time updates
      if (global.io) {
        global.io.emit('group:joined', {
          sessionId: session,
          group: payload.group
        });
      }
    } catch (error) {
      logger.webhook.error('Error handling group join:', error);
    }
  }

  // Handle group leave events
  async handleGroupLeave(event) {
    const { payload, session } = event;
    const { Contact, Conversation } = require('../models');
    
    logger.webhook.info('Group leave event:', {
      event: event.event,
      groupId: payload.group?.id,
      sessionId: session
    });

    try {
      // Update group contact status
      await Contact.update(
        { status: 'archived' },
        { where: { groupId: payload.group.id } }
      );

      // Archive conversation
      await Conversation.update(
        { status: 'archived' },
        { 
          where: { 
            groupId: payload.group.id,
            sessionId: session 
          } 
        }
      );

      // Emit event for real-time updates
      if (global.io) {
        global.io.emit('group:left', {
          sessionId: session,
          groupId: payload.group.id
        });
      }
    } catch (error) {
      logger.webhook.error('Error handling group leave:', error);
    }
  }

  // Handle group participant changes
  async handleGroupParticipants(event) {
    const { payload, session } = event;
    const { Contact, GroupParticipant } = require('../models');
    
    logger.webhook.info('Group participants event:', {
      type: payload.type,
      groupId: payload.group?.id,
      participants: payload.participants,
      sessionId: session
    });

    try {
      if (payload.type === 'join') {
        // Handle participants joining
        for (const participant of payload.participants) {
          // Find or create contact
          const [participantContact] = await Contact.findOrCreate({
            where: { phoneNumber: participant.id.replace('@c.us', '') },
            defaults: {
              name: participant.id.replace('@c.us', ''),
              status: 'active',
              source: 'whatsapp'
            }
          });

          // Add to group
          await GroupParticipant.findOrCreate({
            where: {
              groupId: payload.group.id,
              phoneNumber: participant.id
            },
            defaults: {
              contactId: participantContact.id,
              isAdmin: participant.role === 'admin',
              joinedAt: new Date()
            }
          });
        }
      } else if (payload.type === 'leave' || payload.type === 'remove') {
        // Handle participants leaving/removed
        for (const participant of payload.participants) {
          await GroupParticipant.update(
            { leftAt: new Date() },
            {
              where: {
                groupId: payload.group.id,
                phoneNumber: participant.id
              }
            }
          );
        }
      } else if (payload.type === 'promote' || payload.type === 'demote') {
        // Handle admin changes
        const isAdmin = payload.type === 'promote';
        for (const participant of payload.participants) {
          await GroupParticipant.update(
            { isAdmin },
            {
              where: {
                groupId: payload.group.id,
                phoneNumber: participant.id
              }
            }
          );
        }
      }

      // Update participant count
      const activeCount = await GroupParticipant.count({
        where: {
          groupId: payload.group.id,
          leftAt: null
        }
      });

      await Contact.update(
        { participantCount: activeCount },
        { where: { groupId: payload.group.id } }
      );

      // Emit event for real-time updates
      if (global.io) {
        global.io.emit('group:participants', {
          sessionId: session,
          groupId: payload.group.id,
          type: payload.type,
          participants: payload.participants
        });
      }
    } catch (error) {
      logger.webhook.error('Error handling group participants:', error);
    }
  }

  // Handle group info updates
  async handleGroupUpdate(event) {
    const { payload, session } = event;
    const { Contact } = require('../models');
    
    logger.webhook.info('Group update event:', {
      groupId: payload.group?.id,
      changes: payload.changes,
      sessionId: session
    });

    try {
      const updates = {};
      
      if (payload.changes?.subject) {
        updates.name = payload.changes.subject;
        updates.groupName = payload.changes.subject;
      }
      
      if (payload.changes?.description) {
        updates.groupDescription = payload.changes.description;
      }

      if (Object.keys(updates).length > 0) {
        await Contact.update(
          updates,
          { where: { groupId: payload.group.id } }
        );
      }

      // Emit event for real-time updates
      if (global.io) {
        global.io.emit('group:update', {
          sessionId: session,
          groupId: payload.group.id,
          changes: payload.changes
        });
      }
    } catch (error) {
      logger.webhook.error('Error handling group update:', error);
    }
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
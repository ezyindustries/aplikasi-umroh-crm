const { Message, ConversationSession, Contact, Conversation } = require('../models');
const whatsappService = require('./RealWAHAService');
const logger = require('../utils/logger');
const mediaHandler = require('./MediaHandler');

class SimpleMessageQueueService {
  constructor() {
    // Simple in-memory queue for development
    this.outgoingQueue = [];
    this.incomingQueue = [];
    this.processing = false;
    
    // Start processing loop
    this.startProcessing();
  }

  startProcessing() {
    setInterval(() => {
      this.processQueues();
    }, 1000); // Process every second
  }

  async processQueues() {
    if (this.processing) return;
    this.processing = true;

    try {
      // Process outgoing messages
      if (this.outgoingQueue.length > 0) {
        const message = this.outgoingQueue.shift();
        await this.sendMessage(message);
      }

      // Process incoming messages
      if (this.incomingQueue.length > 0) {
        const data = this.incomingQueue.shift();
        await this.handleIncomingMessage(data);
      }
    } catch (error) {
      logger.error('Queue processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  // Queue outgoing message
  async queueOutgoingMessage(messageData) {
    try {
      const message = await Message.create({
        conversationId: messageData.conversationId,
        fromNumber: messageData.fromNumber,
        toNumber: messageData.toNumber,
        messageType: messageData.messageType || 'text',
        content: messageData.content,
        mediaUrl: messageData.mediaUrl,
        status: 'pending',
        direction: 'outbound'
      });

      // Update conversation lastMessageAt
      const conversation = await Conversation.findByPk(messageData.conversationId);
      if (conversation) {
        await conversation.update({
          lastMessageAt: new Date(),
          lastMessagePreview: messageData.content ? 
            messageData.content.substring(0, 100) : 
            `[${messageData.messageType || 'text'}]`
        });
      }

      this.outgoingQueue.push({
        id: message.id,
        ...messageData
      });

      logger.info('Message queued:', message.id);
      return message;
    } catch (error) {
      logger.error('Error queuing message:', error);
      throw error;
    }
  }

  // Send message via WAHA
  async sendMessage(messageData) {
    try {
      const message = await Message.findByPk(messageData.id);
      if (!message) return;

      logger.info('Sending message:', messageData.id);

      // Send via WAHA
      const result = await whatsappService.sendTextMessage(
        'default',
        messageData.toNumber,
        messageData.content
      );

      // Update message status
      await message.update({
        status: 'sent',
        sentAt: new Date(),
        whatsappMessageId: result.id
      });

      // Emit to frontend
      if (global.io) {
        global.io.emit('message:sent', {
          conversationId: message.conversationId,
          message: message.toJSON()
        });
        
        // Also emit message:new for consistency
        global.io.emit('message:new', {
          conversationId: message.conversationId,
          message: message.toJSON()
        });
      }

    } catch (error) {
      logger.error('Error sending message:', error);
      
      // Update message as failed
      const message = await Message.findByPk(messageData.id);
      if (message) {
        await message.update({
          status: 'failed',
          errorMessage: error.message
        });
      }
    }
  }

  // Process incoming message
  async processIncomingMessage(webhookData) {
    try {
      this.incomingQueue.push(webhookData);
      return { success: true };
    } catch (error) {
      logger.error('Error queueing incoming message:', error);
      throw error;
    }
  }

  // Handle incoming message
  async handleIncomingMessage(webhookData) {
    try {
      const { sessionId, message: whatsappMessage } = webhookData;
      
      // Fix message type based on media presence
      if (whatsappMessage.media?.mimetype) {
        const mimeType = whatsappMessage.media.mimetype;
        if (mimeType.startsWith('image/')) {
          whatsappMessage.type = 'image';
        } else if (mimeType.startsWith('video/')) {
          whatsappMessage.type = 'video';
        } else if (mimeType.startsWith('audio/')) {
          whatsappMessage.type = 'audio';
        } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
          whatsappMessage.type = 'document';
        }
      }
      
      logger.info('Processing message:', {
        from: whatsappMessage.from,
        to: whatsappMessage.to,
        type: whatsappMessage.type,
        fromMe: whatsappMessage.fromMe,
        isGroupMessage: whatsappMessage.isGroupMessage,
        hasMimeType: !!whatsappMessage.media?.mimetype
      });

      // Handle group messages - check multiple indicators
      const isGroupMessage = whatsappMessage.isGroupMessage || 
                           whatsappMessage.isGroupMsg ||
                           whatsappMessage.from?.includes('@g.us') ||
                           whatsappMessage.to?.includes('@g.us') ||
                           whatsappMessage.chatId?.includes('@g.us');
                           
      if (isGroupMessage) {
        // Set groupId if not present
        if (!whatsappMessage.groupId) {
          whatsappMessage.groupId = whatsappMessage.chatId || 
                                   (whatsappMessage.from?.includes('@g.us') ? whatsappMessage.from : whatsappMessage.to);
        }
        // Set groupParticipant for incoming messages
        if (!whatsappMessage.groupParticipant && !whatsappMessage.fromMe && whatsappMessage.from?.includes('@g.us')) {
          // Extract participant from author or from field
          whatsappMessage.groupParticipant = whatsappMessage.author || whatsappMessage.participant;
        }
        whatsappMessage.isGroupMessage = true;
        return await this.handleGroupMessage(webhookData);
      }

      // Parse phone numbers
      const fromNumber = whatsappService.parsePhoneNumber(whatsappMessage.from);
      const toNumber = whatsappService.parsePhoneNumber(whatsappMessage.to);
      
      // Determine which number is the contact (not our own number)
      const contactNumber = whatsappMessage.fromMe ? toNumber : fromNumber;

      // Find or create contact based on the contact number (not our own)
      let contact = await Contact.findOne({
        where: { phoneNumber: contactNumber }
      });

      if (!contact) {
        contact = await Contact.create({
          phoneNumber: contactNumber,
          name: whatsappMessage.pushname || contactNumber,
          source: 'whatsapp',
          isGroup: false
        });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        where: { contactId: contact.id }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          contactId: contact.id,
          sessionId: sessionId || 'default',
          status: 'active',
          isGroup: false
        });
      }

      // Check if message already exists to avoid duplicates
      const existingMessage = await Message.findOne({
        where: { whatsappMessageId: whatsappMessage.id }
      });

      if (existingMessage) {
        logger.info(`Message ${whatsappMessage.id} already exists, skipping...`);
        return existingMessage;
      }

      // Build media URL if media is present
      let mediaUrl = null;
      let mediaId = null;
      
      // Check for media in different ways
      if (whatsappMessage.media || whatsappMessage.type === 'image' || whatsappMessage.type === 'video' || whatsappMessage.type === 'audio' || whatsappMessage.type === 'document') {
        // Use message ID as media ID if no specific media ID provided
        mediaId = whatsappMessage.media?.id || whatsappMessage.mediaId || whatsappMessage.id;
        
        // If we have base64 data, save it to file
        if (whatsappMessage.media?.base64) {
          logger.info('Saving base64 media data for message:', mediaId);
          try {
            await mediaHandler.saveBase64Media(
              whatsappMessage.media.base64,
              whatsappMessage.media.mimetype || 'image/jpeg',
              mediaId
            );
          } catch (error) {
            logger.error('Error saving media:', error);
          }
        }
        
        // Always create media URL for media messages
        mediaUrl = `/api/messages/media/${mediaId}`;
        logger.info('Media message detected:', {
          type: whatsappMessage.type,
          mediaId: mediaId,
          hasMedia: !!whatsappMessage.media,
          hasMimeType: !!whatsappMessage.media?.mimetype
        });
      }

      // Save message with correct direction based on fromMe
      const message = await Message.create({
        conversationId: conversation.id,
        whatsappMessageId: whatsappMessage.id,
        fromNumber: fromNumber,
        toNumber: toNumber,
        messageType: whatsappMessage.type || 'text',
        content: whatsappMessage.body || whatsappMessage.text || whatsappMessage.caption || '',
        mediaId: mediaId,
        mediaUrl: mediaUrl,
        mediaMimeType: whatsappMessage.media?.mimetype || whatsappMessage.mimeType || whatsappMessage.mimetype,
        mediaSize: whatsappMessage.media?.filesize || whatsappMessage.fileSize || whatsappMessage.filesize,
        status: whatsappMessage.fromMe ? 'sent' : 'received',
        direction: whatsappMessage.fromMe ? 'outbound' : 'inbound',
        isForwarded: whatsappMessage.isForwarded || false,
        quotedMessageId: whatsappMessage.quotedMessageId,
        // New media fields
        fileName: whatsappMessage.fileName,
        thumbnailUrl: whatsappMessage.thumbnailUrl,
        mediaCaption: whatsappMessage.caption,
        mediaDuration: whatsappMessage.mediaDuration,
        // Location fields
        locationLatitude: whatsappMessage.latitude,
        locationLongitude: whatsappMessage.longitude,
        locationName: whatsappMessage.locationName,
        locationAddress: whatsappMessage.locationAddress,
        // Contact fields
        contactVcard: whatsappMessage.vcard,
        // Group fields (false for individual chats)
        isGroupMessage: false,
        groupParticipant: null
      });

      // Download media if present
      if (mediaId && whatsappMessage.media && whatsappMessage.type !== 'text') {
        try {
          const mediaDownloadService = require('./MediaDownloadService');
          const downloadResult = await mediaDownloadService.downloadAndSaveMedia(
            whatsappMessage.id,
            {
              url: whatsappMessage.media.url || whatsappMessage.mediaUrl,
              mimetype: whatsappMessage.media.mimetype,
              filename: whatsappMessage.media.filename || whatsappMessage.fileName
            }
          );
          
          logger.info('Media downloaded successfully:', {
            messageId: message.id,
            filename: downloadResult.filename,
            size: downloadResult.size
          });
          
          // Update message with local media path
          await message.update({
            mediaUrl: `/api/messages/media/${downloadResult.filename}`,
            fileName: downloadResult.originalFilename
          });
        } catch (error) {
          logger.error('Failed to download media:', error);
          // Continue processing even if media download fails
        }
      }

      // Update conversation
      let lastMessagePreview = '';
      if (message.content) {
        lastMessagePreview = message.content.substring(0, 100);
      } else {
        // Show media type with emoji
        const mediaTypeEmoji = {
          'image': '📷 Photo',
          'video': '🎥 Video',
          'audio': '🎵 Audio',
          'document': '📄 Document',
          'location': '📍 Location',
          'contact': '👤 Contact',
          'sticker': '🎨 Sticker'
        };
        lastMessagePreview = mediaTypeEmoji[message.messageType] || `[${message.messageType}]`;
      }
      
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: lastMessagePreview,
        unreadCount: conversation.unreadCount + 1
      });

      // Update contact last seen
      await contact.update({ lastSeen: new Date() });

      // Emit to frontend
      if (global.io) {
        global.io.emit('message:new', {
          conversationId: conversation.id,
          message: message.toJSON()
        });
        
        global.io.emit('conversation:updated', {
          conversationId: conversation.id,
          id: conversation.id,
          conversation: conversation.toJSON(),
          contact: contact.toJSON()
        });
      }

      logger.info('Incoming message processed:', message.id);
      return { success: true, messageId: message.id };

    } catch (error) {
      logger.error('Error processing incoming message:', error);
      throw error;
    }
  }

  // Update message status
  async updateMessageStatus(whatsappMessageId, status, timestamp) {
    try {
      const message = await Message.findOne({
        where: { whatsappMessageId }
      });

      if (!message) {
        logger.warn(`Message not found for ID: ${whatsappMessageId}`);
        return;
      }

      const updateData = { status };

      switch (status) {
        case 'delivered':
          updateData.deliveredAt = new Date(timestamp);
          break;
        case 'read':
          updateData.readAt = new Date(timestamp);
          break;
        case 'failed':
          updateData.errorMessage = 'Message delivery failed';
          break;
      }

      await message.update(updateData);

      // Emit to frontend with whatsappMessageId for proper matching
      if (global.io) {
        global.io.emit('message:status', {
          messageId: whatsappMessageId,
          id: message.id,
          whatsappMessageId: whatsappMessageId,
          status: status
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error updating message status:', error);
      throw error;
    }
  }

  // Queue status update (called by WebhookHandler)
  async queueStatusUpdate(messageId, status, timestamp) {
    return this.updateMessageStatus(messageId, status, timestamp);
  }

  // Get queue stats
  async getQueueStats() {
    return {
      outgoing: {
        waiting: this.outgoingQueue.length,
        active: this.processing ? 1 : 0
      },
      incoming: {
        waiting: this.incomingQueue.length,
        active: this.processing ? 1 : 0
      }
    };
  }

  // Handle group message
  async handleGroupMessage(webhookData) {
    try {
      const { sessionId, message: whatsappMessage } = webhookData;
      const { GroupParticipant } = require('../models');
      
      logger.info('Processing group message:', {
        groupId: whatsappMessage.groupId,
        from: whatsappMessage.from,
        participant: whatsappMessage.groupParticipant,
        type: whatsappMessage.type
      });

      // Parse group ID
      const groupId = whatsappMessage.groupId;
      const groupIdClean = whatsappService.parsePhoneNumber(groupId);

      // Find or create group contact
      let groupContact = await Contact.findOne({
        where: { groupId: groupId }
      });

      if (!groupContact) {
        // Extract group name from webhook message data
        // WAHA often includes group info in the message payload
        const groupName = whatsappMessage.chatName || 
                         whatsappMessage._data?.notifyName || 
                         whatsappMessage.chat?.name ||
                         whatsappMessage.chat?.subject ||
                         `Group ${groupIdClean}`;
        
        logger.info('Creating group contact with name:', groupName);

        groupContact = await Contact.create({
          phoneNumber: groupIdClean, // Use group ID as phone number
          name: groupName,
          isGroup: true,
          groupId: groupIdClean,
          source: 'whatsapp',
          metadata: {
            groupName: groupName,
            waGroupId: groupId,
            groupDescription: whatsappMessage.chat?.description || '',
            participantCount: whatsappMessage.chat?.participantCount || 0,
            createdFrom: 'message-handler',
            createdAt: new Date()
          }
        });
      } else {
        // Update group info if we have new data from webhook
        const newGroupName = whatsappMessage.chatName || 
                           whatsappMessage._data?.notifyName || 
                           whatsappMessage.chat?.name ||
                           whatsappMessage.chat?.subject;
        
        if (newGroupName && (groupContact.name === groupIdClean || 
            groupContact.name.startsWith('Group ') || 
            !groupContact.metadata?.groupName)) {
          logger.info('Updating group name from webhook data:', newGroupName);
          await groupContact.update({
            name: newGroupName,
            metadata: {
              ...groupContact.metadata,
              groupName: newGroupName,
              waGroupId: groupId,
              groupDescription: whatsappMessage.chat?.description || groupContact.metadata?.groupDescription,
              participantCount: whatsappMessage.chat?.participantCount || groupContact.metadata?.participantCount,
              lastUpdated: new Date()
            }
          });
        }
      }

      // Find or create conversation for group
      let conversation = await Conversation.findOne({
        where: { contactId: groupContact.id }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          contactId: groupContact.id,
          sessionId: sessionId || 'default',
          status: 'active',
          isGroup: true,
          groupId: groupId
        });
      }

      // If it's not from us, track the participant
      if (!whatsappMessage.fromMe && whatsappMessage.groupParticipant) {
        const participantNumber = whatsappService.parsePhoneNumber(whatsappMessage.groupParticipant);
        
        // Find or create participant contact
        let participantContact = await Contact.findOne({
          where: { phoneNumber: participantNumber }
        });

        if (!participantContact) {
          participantContact = await Contact.create({
            phoneNumber: participantNumber,
            name: whatsappMessage.pushname || participantNumber,
            source: 'whatsapp',
            isGroup: false
          });
        }

        // Track group participation
        await GroupParticipant.findOrCreate({
          where: {
            groupId: groupId,
            phoneNumber: participantNumber
          },
          defaults: {
            contactId: participantContact.id,
            isAdmin: false
          }
        });
      }

      // Check if message already exists to avoid duplicates
      const existingMessage = await Message.findOne({
        where: { whatsappMessageId: whatsappMessage.id }
      });
      
      if (existingMessage) {
        logger.info(`Group message ${whatsappMessage.id} already exists, skipping...`);
        return existingMessage;
      }

      // Build media URL if media is present
      let mediaUrl = null;
      if (whatsappMessage.mediaId && whatsappMessage.type !== 'text') {
        mediaUrl = `/api/messages/media/${whatsappMessage.mediaId}`;
      }

      // Save group message
      const message = await Message.create({
        conversationId: conversation.id,
        whatsappMessageId: whatsappMessage.id,
        fromNumber: whatsappMessage.groupParticipant || whatsappMessage.from,
        toNumber: groupId,
        messageType: whatsappMessage.type || 'text',
        content: whatsappMessage.body || whatsappMessage.text || whatsappMessage.caption || '',
        mediaId: whatsappMessage.mediaId,
        mediaUrl: whatsappMessage.mediaUrl || mediaUrl,
        mediaMimeType: whatsappMessage.mimeType || whatsappMessage.mimetype,
        mediaSize: whatsappMessage.fileSize || whatsappMessage.filesize,
        status: whatsappMessage.fromMe ? 'sent' : 'received',
        direction: whatsappMessage.fromMe ? 'outbound' : 'inbound',
        isForwarded: whatsappMessage.isForwarded || false,
        quotedMessageId: whatsappMessage.quotedMessageId,
        // Media fields
        fileName: whatsappMessage.fileName,
        thumbnailUrl: whatsappMessage.thumbnailUrl,
        mediaCaption: whatsappMessage.caption,
        mediaDuration: whatsappMessage.mediaDuration,
        // Location fields
        locationLatitude: whatsappMessage.latitude,
        locationLongitude: whatsappMessage.longitude,
        locationName: whatsappMessage.locationName,
        locationAddress: whatsappMessage.locationAddress,
        // Contact fields
        contactVcard: whatsappMessage.vcard,
        // Group fields
        isGroupMessage: true,
        groupParticipant: whatsappMessage.groupParticipant || whatsappMessage.author || whatsappMessage.participant || 
                         (whatsappMessage.fromMe ? 'You' : whatsappMessage.from)
      });

      // Download media if present for group messages
      if (whatsappMessage.mediaId && whatsappMessage.media && whatsappMessage.type !== 'text') {
        try {
          const mediaDownloadService = require('./MediaDownloadService');
          const downloadResult = await mediaDownloadService.downloadAndSaveMedia(
            whatsappMessage.id,
            {
              url: whatsappMessage.media.url || whatsappMessage.mediaUrl,
              mimetype: whatsappMessage.media.mimetype || whatsappMessage.mimeType,
              filename: whatsappMessage.media.filename || whatsappMessage.fileName
            }
          );
          
          logger.info('Group media downloaded successfully:', {
            messageId: message.id,
            filename: downloadResult.filename,
            size: downloadResult.size
          });
          
          // Update message with local media path
          await message.update({
            mediaUrl: `/api/messages/media/${downloadResult.filename}`,
            fileName: downloadResult.originalFilename
          });
        } catch (error) {
          logger.error('Failed to download group media:', error);
          // Continue processing even if media download fails
        }
      }

      // Update conversation
      let lastMessagePreview = '';
      if (message.content) {
        lastMessagePreview = message.content.substring(0, 100);
      } else {
        const mediaTypeEmoji = {
          'image': '📷 Photo',
          'video': '🎥 Video',
          'audio': '🎵 Audio',
          'document': '📄 Document',
          'location': '📍 Location',
          'contact': '👤 Contact',
          'sticker': '🎨 Sticker'
        };
        lastMessagePreview = mediaTypeEmoji[message.messageType] || `[${message.messageType}]`;
      }
      
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: lastMessagePreview,
        unreadCount: conversation.unreadCount + 1
      });

      // Emit to frontend
      if (global.io) {
        global.io.emit('message:new', {
          conversationId: conversation.id,
          message: message.toJSON()
        });
        
        global.io.emit('conversation:updated', {
          conversationId: conversation.id,
          id: conversation.id,
          conversation: conversation.toJSON(),
          contact: groupContact.toJSON()
        });
      }

      logger.info('Group message processed:', message.id);
      return { success: true, messageId: message.id };

    } catch (error) {
      logger.error('Error processing group message:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new SimpleMessageQueueService();
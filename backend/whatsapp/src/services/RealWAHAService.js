const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { WhatsAppSession, Contact, Message, Conversation } = require('../models');
const EventEmitter = require('events');

// Import services
const ContactService = require('./ContactService');
const ConversationService = require('./ConversationService');
const MessageService = require('./MessageService');

/**
 * WAHA (WhatsApp HTTP API) Service
 * Exact implementation following WAHA API specification
 * Compatible with WAHA Core and WAHA Plus
 */
class WAHAService extends EventEmitter {
  constructor() {
    super();
    
    // WAHA server configuration
    this.baseURL = process.env.WAHA_URL || 'http://localhost:3000';
    this.apiKey = process.env.WAHA_API_KEY || '';
    
    // Debug logging
    logger.info('WAHA Service initialized with:', {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey
    });
    
    // Session management
    this.sessions = new Map();
    this.qrCodes = new Map();
    
    // Initialize services
    this.contactService = ContactService;
    this.conversationService = ConversationService;
    this.messageService = MessageService;
    
    // Axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey
      },
      timeout: 30000
    });
    
    // Setup response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        logger.error('WAHA API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Session Management
   */
  
  // Start a new session (WAHA: POST /api/sessions/)
  async startSession(sessionName = 'default', config = {}) {
    // Define sessionConfig outside try block so it's accessible in catch
    const sessionConfig = {
      name: sessionName,
      config: {
        // Webhook configuration
        webhooks: config.webhooks || [{
          url: `${process.env.APP_URL || 'http://host.docker.internal:3001'}/api/webhooks/waha`,
          events: [
            'session.status',
            'message',
            'message.any',
            'message.ack',
            'message.reaction',
            'message.revoked',
            'presence.update',
            'state.change'
          ],
          hmac: {
            key: process.env.WEBHOOK_SECRET || 'your-secret-key'
          },
          retries: {
            policy: 'exponential',
            delaySeconds: 2,
            attempts: 15
          }
        }],
        
        // Proxy configuration (if needed)
        proxy: config.proxy,
        
        // Browser args for WEBJS engine
        browserArgs: config.browserArgs || [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        
        // Session data path
        sessionDataPath: config.sessionDataPath || './sessions',
        
        // Enable store for NOWEB engine
        noweb: {
          store: {
            enabled: true,
            fullSync: false
          }
        }
      }
    };
    
    try {
      logger.info(`Starting WAHA session: ${sessionName}`);
      
      // Create/update session
      const response = await this.api.post('/api/sessions/', sessionConfig);
      
      // Update database
      await WhatsAppSession.upsert({
        sessionName,
        status: 'starting',
        config: sessionConfig.config
      });
      
      // Store session info
      this.sessions.set(sessionName, {
        name: sessionName,
        status: 'starting',
        startTime: new Date()
      });
      
      // Configure webhook after session is created
      try {
        const webhookUrl = process.env.WEBHOOK_URL || `http://localhost:${process.env.PORT || 3001}/api/webhooks/waha`;
        logger.info(`Configuring webhook for session ${sessionName}: ${webhookUrl}`);
        
        await this.api.post(`/api/sessions/${sessionName}/webhooks`, {
          url: webhookUrl,
          events: ['message', 'message.ack', 'state.change', 'group.join', 'group.leave']
        });
        
        logger.info('Webhook configured successfully');
      } catch (webhookError) {
        logger.error('Failed to configure webhook:', webhookError);
        // Continue anyway - webhook is not critical for basic functionality
      }
      
      return {
        success: true,
        session: response.data
      };
    } catch (error) {
      // Handle session already exists error
      if (error.response?.status === 422 && error.response?.data?.message?.includes('already exists')) {
        logger.info('Session already exists, starting it...');
        
        try {
          // Start the existing session
          const startResponse = await this.api.post(`/api/sessions/${sessionName}/start`);
          logger.info('Existing session started:', startResponse.data);
          
          // Get current session status
          const status = await this.getSessionStatus(sessionName);
          
          // Update database
          await WhatsAppSession.upsert({
            sessionName,
            status: status.status || 'starting',
            config: sessionConfig.config
          });
          
          // Configure webhook for existing session
          try {
            const webhookUrl = process.env.WEBHOOK_URL || `http://localhost:${process.env.PORT || 3001}/api/webhooks/waha`;
            await this.api.post(`/api/sessions/${sessionName}/webhooks`, {
              url: webhookUrl,
              events: ['message', 'message.ack', 'state.change', 'group.join', 'group.leave']
            });
            logger.info('Webhook configured for existing session');
          } catch (webhookError) {
            logger.error('Failed to configure webhook for existing session:', webhookError);
          }
          
          return {
            success: true,
            session: { name: sessionName, status: status.status },
            message: 'Session started'
          };
        } catch (startError) {
          // If session is already started, just return current status
          if (startError.response?.status === 422 && 
              startError.response?.data?.message?.includes('already started')) {
            logger.info('Session already started, getting current status...');
            
            const status = await this.getSessionStatus(sessionName);
            
            await WhatsAppSession.upsert({
              sessionName,
              status: status.status || 'unknown',
              config: sessionConfig.config
            });
            
            return {
              success: true,
              session: { name: sessionName, status: status.status },
              message: 'Session already active'
            };
          }
          
          logger.error('Error starting existing session:', startError);
          throw startError;
        }
      }
      
      logger.error('Error starting WAHA session:', error);
      throw error;
    }
  }
  
  // Stop session (WAHA: POST /api/sessions/stop)
  async stopSession(sessionName = 'default', logout = false) {
    try {
      logger.info(`Stopping WAHA session: ${sessionName}`);
      
      const response = await this.api.post('/api/sessions/stop', {
        name: sessionName,
        logout: logout
      });
      
      // Update database
      await WhatsAppSession.update(
        { 
          status: 'disconnected',
          disconnectedAt: new Date()
        },
        { where: { sessionName } }
      );
      
      // Clean up
      this.sessions.delete(sessionName);
      this.qrCodes.delete(sessionName);
      
      return {
        success: true,
        message: 'Session stopped'
      };
    } catch (error) {
      logger.error('Error stopping WAHA session:', error);
      throw error;
    }
  }
  
  // Get session status (WAHA: GET /api/sessions/)
  async getSessionStatus(sessionName = 'default') {
    try {
      const response = await this.api.get('/api/sessions/', {
        params: { all: true }
      });
      
      const sessions = response.data;
      const session = sessions.find(s => s.name === sessionName);
      
      if (!session) {
        return {
          status: 'disconnected',
          message: 'Session not found'
        };
      }
      
      return {
        status: session.status,
        me: session.me,
        engine: session.engine,
        webhooks: session.config?.webhooks,
        startTime: session.startTime
      };
    } catch (error) {
      logger.error('Error getting session status:', error);
      return { status: 'error', error: error.message };
    }
  }
  
  // Get QR code (WAHA: GET /api/{session}/auth/qr)
  async getQRCode(sessionName = 'default', format = 'base64') {
    try {
      // WAHA returns JSON with base64 when Accept header is application/json
      const response = await this.api.get(`/api/${sessionName}/auth/qr`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // WAHA returns {mimetype, data} for base64 format
      if (response.data && response.data.data) {
        // Return base64 data URL format for easy display
        return `data:${response.data.mimetype};base64,${response.data.data}`;
      }
      
      // If no data, try getting raw image
      const imageResponse = await this.api.get(`/api/${sessionName}/auth/qr`, {
        responseType: 'arraybuffer'
      });
      
      // Convert to base64 data URL
      const base64 = Buffer.from(imageResponse.data).toString('base64');
      return `data:image/png;base64,${base64}`;
      
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No QR code available
      }
      logger.error('Error getting QR code:', error);
      throw error;
    }
  }
  
  // Load existing chats from WhatsApp (WAHA: GET /api/{session}/chats)
  async loadExistingChats(sessionName = 'default', limit = 50) {
    try {
      logger.info(`Loading existing chats for session: ${sessionName}`);
      
      // Get all chats from WAHA
      const response = await this.api.get(`/api/${sessionName}/chats`, {
        params: {
          limit: limit,
          offset: 0
        }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        logger.warn('No chats data returned from WAHA');
        return { count: 0, chats: [] };
      }
      
      const chats = response.data;
      logger.info(`Found ${chats.length} chats from WhatsApp`);
      
      // Process each chat
      for (const chat of chats) {
        try {
          // Get or create contact
          const phoneNumber = chat.id.split('@')[0];
          const contact = await this.contactService.getOrCreateContact({
            phoneNumber: phoneNumber,
            name: chat.name || phoneNumber,
            waId: chat.id
          });
          
          // Get or create conversation
          const conversation = await this.conversationService.getOrCreateConversation({
            contactId: contact.id,
            sessionId: sessionName,
            waId: chat.id
          });
          
          // Load recent messages for this chat
          if (chat.lastMessage) {
            try {
              const messagesResponse = await this.api.get(`/api/${sessionName}/chats/${chat.id}/messages`, {
                params: {
                  limit: 20,
                  downloadMedia: false
                }
              });
              
              if (messagesResponse.data && Array.isArray(messagesResponse.data)) {
                for (const msg of messagesResponse.data) {
                  await this.messageService.saveIncomingMessage({
                    conversationId: conversation.id,
                    waId: msg.id,
                    content: msg.body || msg.caption || '',
                    messageType: msg.type || 'text',
                    direction: msg.fromMe ? 'outbound' : 'inbound',
                    status: msg.ack ? 'delivered' : 'sent',
                    timestamp: msg.timestamp ? new Date(msg.timestamp * 1000) : new Date()
                  });
                }
              }
            } catch (msgError) {
              logger.error(`Error loading messages for chat ${chat.id}:`, msgError);
            }
          }
          
          // Update conversation metadata
          await conversation.update({
            lastMessageAt: chat.timestamp ? new Date(chat.timestamp * 1000) : new Date(),
            unreadCount: chat.unreadCount || 0
          });
          
        } catch (chatError) {
          logger.error(`Error processing chat ${chat.id}:`, chatError);
        }
      }
      
      // Emit event that chats have been loaded
      if (global.io) {
        global.io.emit('chats:loaded', {
          sessionId: sessionName,
          count: chats.length,
          message: `${chats.length} percakapan berhasil dimuat dari WhatsApp`
        });
      }
      
      return {
        count: chats.length,
        chats: chats.map(chat => ({
          id: chat.id,
          name: chat.name,
          phoneNumber: chat.id.split('@')[0],
          lastMessage: chat.lastMessage,
          timestamp: chat.timestamp,
          unreadCount: chat.unreadCount || 0
        }))
      };
      
    } catch (error) {
      logger.error('Error loading existing chats:', error);
      throw error;
    }
  }
  
  /**
   * Messaging
   */
  
  // Send text message (WAHA: POST /api/sendText)
  async sendTextMessage(sessionName, chatId, text, options = {}) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId),
        text: text,
        ...options // reply_to, mentions, etc.
      };
      
      const response = await this.api.post('/api/sendText', payload);
      
      return {
        success: true,
        messageId: response.data.id,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Error sending text message:', error);
      throw error;
    }
  }
  
  // Send image (WAHA: POST /api/sendImage)
  async sendImage(sessionName, chatId, image, caption = '', options = {}) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId),
        caption: caption,
        ...options
      };
      
      // Handle different image formats
      if (typeof image === 'string' && image.startsWith('http')) {
        payload.file = { url: image };
      } else if (typeof image === 'string' && fs.existsSync(image)) {
        payload.file = {
          mimetype: this.getMimeType(image),
          filename: path.basename(image),
          data: fs.readFileSync(image).toString('base64')
        };
      } else if (Buffer.isBuffer(image)) {
        payload.file = {
          mimetype: 'image/jpeg',
          filename: 'image.jpg',
          data: image.toString('base64')
        };
      } else {
        payload.file = image; // Assume it's already in correct format
      }
      
      const response = await this.api.post('/api/sendImage', payload);
      
      return {
        success: true,
        messageId: response.data.id,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Error sending image:', error);
      throw error;
    }
  }
  
  // Send document (WAHA: POST /api/sendFile)
  async sendFile(sessionName, chatId, file, filename = '', options = {}) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId),
        ...options
      };
      
      // Handle different file formats
      if (typeof file === 'string' && file.startsWith('http')) {
        payload.file = { 
          url: file,
          filename: filename || 'document'
        };
      } else if (typeof file === 'string' && fs.existsSync(file)) {
        payload.file = {
          mimetype: this.getMimeType(file),
          filename: filename || path.basename(file),
          data: fs.readFileSync(file).toString('base64')
        };
      } else {
        payload.file = file;
      }
      
      const response = await this.api.post('/api/sendFile', payload);
      
      return {
        success: true,
        messageId: response.data.id,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Error sending file:', error);
      throw error;
    }
  }
  
  // Send voice message (WAHA: POST /api/sendVoice)
  async sendVoice(sessionName, chatId, audio, options = {}) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId),
        ...options
      };
      
      if (typeof audio === 'string' && fs.existsSync(audio)) {
        payload.file = {
          mimetype: 'audio/ogg',
          filename: 'voice.ogg',
          data: fs.readFileSync(audio).toString('base64')
        };
      } else {
        payload.file = audio;
      }
      
      const response = await this.api.post('/api/sendVoice', payload);
      
      return {
        success: true,
        messageId: response.data.id,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Error sending voice:', error);
      throw error;
    }
  }
  
  // Send video (WAHA: POST /api/sendVideo)
  async sendVideo(sessionName, chatId, video, caption = '', options = {}) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId),
        caption: caption,
        ...options
      };
      
      if (typeof video === 'string' && video.startsWith('http')) {
        payload.file = { url: video };
      } else if (typeof video === 'string' && fs.existsSync(video)) {
        payload.file = {
          mimetype: this.getMimeType(video),
          filename: path.basename(video),
          data: fs.readFileSync(video).toString('base64')
        };
      } else {
        payload.file = video;
      }
      
      const response = await this.api.post('/api/sendVideo', payload);
      
      return {
        success: true,
        messageId: response.data.id,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Error sending video:', error);
      throw error;
    }
  }
  
  // Send location (WAHA: POST /api/sendLocation)
  async sendLocation(sessionName, chatId, latitude, longitude, description = '', options = {}) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId),
        latitude: latitude,
        longitude: longitude,
        title: description,
        ...options
      };
      
      const response = await this.api.post('/api/sendLocation', payload);
      
      return {
        success: true,
        messageId: response.data.id,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Error sending location:', error);
      throw error;
    }
  }
  
  // Send contact (WAHA: POST /api/sendContact)
  async sendContact(sessionName, chatId, contact, options = {}) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId),
        contact: contact,
        ...options
      };
      
      const response = await this.api.post('/api/sendContact', payload);
      
      return {
        success: true,
        messageId: response.data.id,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Error sending contact:', error);
      throw error;
    }
  }
  
  // Send poll (WAHA: POST /api/sendPoll)
  async sendPoll(sessionName, chatId, name, choices, options = {}) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId),
        name: name,
        choices: choices,
        options: {
          multipleAnswers: options.multipleAnswers || false
        }
      };
      
      const response = await this.api.post('/api/sendPoll', payload);
      
      return {
        success: true,
        messageId: response.data.id,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Error sending poll:', error);
      throw error;
    }
  }
  
  /**
   * Chat Management
   */
  
  // Get chats (WAHA: GET /api/{session}/chats)
  async getChats(sessionName = 'default', limit = 50, offset = 0) {
    try {
      const response = await this.api.get(`/api/${sessionName}/chats`, {
        params: { limit, offset }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error getting chats:', error);
      return [];
    }
  }
  
  // Get messages (WAHA: GET /api/{session}/chats/{chatId}/messages)
  async getMessages(sessionName, chatId, limit = 50, offset = 0) {
    try {
      const response = await this.api.get(`/api/${sessionName}/chats/${chatId}/messages`, {
        params: { limit, offset }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error getting messages:', error);
      return [];
    }
  }
  
  // Send seen (WAHA: POST /api/sendSeen)
  async sendSeen(sessionName, chatId) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId)
      };
      
      await this.api.post('/api/sendSeen', payload);
      
      return { success: true };
    } catch (error) {
      logger.error('Error sending seen:', error);
      throw error;
    }
  }
  
  // Start typing (WAHA: POST /api/startTyping)
  async startTyping(sessionName, chatId) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId)
      };
      
      await this.api.post('/api/startTyping', payload);
      
      return { success: true };
    } catch (error) {
      logger.error('Error starting typing:', error);
      throw error;
    }
  }
  
  // Stop typing (WAHA: POST /api/stopTyping)
  async stopTyping(sessionName, chatId) {
    try {
      const payload = {
        session: sessionName,
        chatId: this.formatChatId(chatId)
      };
      
      await this.api.post('/api/stopTyping', payload);
      
      return { success: true };
    } catch (error) {
      logger.error('Error stopping typing:', error);
      throw error;
    }
  }
  
  /**
   * Contact Management
   */
  
  // Check if number exists (WAHA: GET /api/contacts/check-exists)
  async checkNumberExists(sessionName, phoneNumber) {
    try {
      const response = await this.api.get('/api/contacts/check-exists', {
        params: {
          session: sessionName,
          phone: phoneNumber.replace(/\D/g, '')
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error checking number:', error);
      return { exists: false };
    }
  }
  
  // Get contacts (WAHA: GET /api/{session}/contacts)
  async getContacts(sessionName = 'default') {
    try {
      const response = await this.api.get(`/api/${sessionName}/contacts`);
      
      return response.data;
    } catch (error) {
      logger.error('Error getting contacts:', error);
      return [];
    }
  }
  
  // Get contact info (WAHA: GET /api/{session}/contacts/{contactId})
  async getContactInfo(sessionName, contactId) {
    try {
      const response = await this.api.get(`/api/${sessionName}/contacts/${contactId}`);
      
      return response.data;
    } catch (error) {
      logger.error('Error getting contact info:', error);
      return null;
    }
  }
  
  /**
   * Group Management
   */
  
  // Get groups (WAHA: GET /api/{session}/groups)
  async getGroups(sessionName = 'default') {
    try {
      const response = await this.api.get(`/api/${sessionName}/groups`);
      
      return response.data;
    } catch (error) {
      logger.error('Error getting groups:', error);
      return [];
    }
  }
  
  // Get group info (WAHA: GET /api/{session}/groups/{groupId})
  async getGroupInfo(sessionName, groupId) {
    try {
      const response = await this.api.get(`/api/${sessionName}/groups/${groupId}`);
      
      return response.data;
    } catch (error) {
      logger.error('Error getting group info:', error);
      return null;
    }
  }
  
  // Get group participants (WAHA: GET /api/{session}/groups/{groupId}/participants)
  async getGroupParticipants(sessionName, groupId) {
    try {
      const response = await this.api.get(`/api/${sessionName}/groups/${groupId}/participants`);
      
      return response.data;
    } catch (error) {
      logger.error('Error getting group participants:', error);
      return [];
    }
  }
  
  /**
   * Media Management
   */
  
  // Download media (WAHA: GET /api/files/{fileId})
  async downloadMedia(fileId) {
    try {
      const response = await this.api.get(`/api/files/${fileId}`, {
        responseType: 'arraybuffer'
      });
      
      return Buffer.from(response.data, 'binary');
    } catch (error) {
      logger.error('Error downloading media:', error);
      throw error;
    }
  }
  
  /**
   * Webhook Handler
   */
  async handleWebhook(event) {
    try {
      logger.info(`WAHA Webhook received: ${event.event}`);
      
      switch (event.event) {
        case 'session.status':
          await this.handleSessionStatus(event);
          break;
          
        case 'message':
          await this.handleIncomingMessage(event);
          break;
          
        case 'message.ack':
          await this.handleMessageAck(event);
          break;
          
        case 'message.reaction':
          await this.handleMessageReaction(event);
          break;
          
        case 'message.revoked':
          await this.handleMessageRevoked(event);
          break;
          
        case 'presence.update':
          await this.handlePresenceUpdate(event);
          break;
          
        case 'group.join':
        case 'group.leave':
        case 'group.participant.changed':
          await this.handleGroupEvent(event);
          break;
          
        case 'poll.vote':
        case 'poll.vote.failed':
          await this.handlePollEvent(event);
          break;
          
        default:
          logger.info(`Unhandled webhook event: ${event.event}`);
      }
      
      // Emit event for other services
      this.emit(event.event, event);
      
    } catch (error) {
      logger.error('Error handling webhook:', error);
    }
  }
  
  // Handle session status changes
  async handleSessionStatus(event) {
    const { session, status, me } = event.payload;
    
    logger.info(`Session ${session} status: ${status}`);
    
    // Update database
    await WhatsAppSession.update(
      { 
        status: status,
        phoneNumber: me?.id,
        connectedAt: status === 'authenticated' ? new Date() : null
      },
      { where: { sessionName: session } }
    );
    
    // Handle QR code
    if (status === 'scan-qr-code') {
      const qrCode = await this.getQRCode(session, 'base64');
      if (qrCode) {
        this.qrCodes.set(session, qrCode.value);
        
        // Emit QR code event
        if (global.io) {
          global.io.emit('session:qr', {
            sessionName: session,
            qr: qrCode.value
          });
        }
      }
    } else if (status === 'authenticated') {
      // Clear QR code
      this.qrCodes.delete(session);
      
      // Emit connected event
      if (global.io) {
        global.io.emit('session:connected', {
          sessionName: session,
          phoneNumber: me?.id,
          status: 'connected'
        });
      }
      
      // Load existing chats
      setTimeout(() => this.loadExistingChats(session), 2000);
    }
  }
  
  // Handle incoming messages
  async handleIncomingMessage(event) {
    const { session, payload } = event;
    const message = payload;
    
    try {
      // Get or create contact
      const phoneNumber = message.from.split('@')[0];
      const [contact] = await Contact.upsert({
        phoneNumber: phoneNumber,
        name: message._data?.notifyName || message.from,
        lastMessageAt: new Date(),
        source: 'whatsapp'
      });
      
      // Get or create conversation
      let conversation = await Conversation.findOne({
        where: {
          contactId: contact.id,
          sessionId: session,
          status: 'active'
        }
      });
      
      if (!conversation) {
        conversation = await Conversation.create({
          contactId: contact.id,
          sessionId: session,
          status: 'active',
          priority: 'medium'
        });
      }
      
      // Save message
      const savedMessage = await Message.create({
        conversationId: conversation.id,
        whatsappMessageId: message.id,
        content: message.body || '',
        direction: message.fromMe ? 'outbound' : 'inbound',
        status: 'received',
        messageType: message.type || 'text',
        fromNumber: message.from,
        toNumber: message.to,
        mediaUrl: message.mediaUrl,
        sentAt: new Date(message.timestamp * 1000),
        metadata: message._data
      });
      
      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: message.body || '[Media]',
        unreadCount: message.fromMe ? 0 : conversation.unreadCount + 1
      });
      
      // Emit to frontend
      if (global.io) {
        global.io.emit('message:new', {
          conversationId: conversation.id,
          message: savedMessage.toJSON()
        });
      }
      
      logger.info(`Message saved from ${phoneNumber}: ${message.body?.substring(0, 50)}`);
      
    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  }
  
  // Handle message acknowledgments
  async handleMessageAck(event) {
    const { payload } = event;
    
    const statusMap = {
      1: 'sent',
      2: 'delivered',
      3: 'read',
      4: 'played'
    };
    
    const status = statusMap[payload.ack] || 'unknown';
    
    await Message.update(
      { status: status },
      { where: { whatsappMessageId: payload.id } }
    );
    
    // Emit to frontend
    if (global.io) {
      global.io.emit('message:status', {
        messageId: payload.id,
        status: status
      });
    }
  }
  
  // Handle message reactions
  async handleMessageReaction(event) {
    logger.info('Message reaction:', event.payload);
    // Implement reaction handling as needed
  }
  
  // Handle revoked messages
  async handleMessageRevoked(event) {
    const { payload } = event;
    
    await Message.update(
      { 
        status: 'revoked',
        content: '[Message deleted]'
      },
      { where: { whatsappMessageId: payload.id } }
    );
  }
  
  // Handle presence updates
  async handlePresenceUpdate(event) {
    logger.info('Presence update:', event.payload);
    // Implement presence handling as needed
  }
  
  // Handle group events
  async handleGroupEvent(event) {
    logger.info('Group event:', event);
    // Implement group event handling as needed
  }
  
  // Handle poll events
  async handlePollEvent(event) {
    logger.info('Poll event:', event);
    // Implement poll event handling as needed
  }
  
  /**
   * Load existing chats from WAHA
   */
  async loadExistingChats(sessionName) {
    try {
      logger.info('Loading existing chats from WAHA...');
      
      const chats = await this.getChats(sessionName, 100, 0);
      logger.info(`Found ${chats.length} chats`);
      
      for (const chat of chats) {
        try {
          // Skip groups and broadcasts for now
          if (chat.id.includes('@g.us') || chat.id.includes('@broadcast')) {
            continue;
          }
          
          const phoneNumber = chat.id.split('@')[0];
          
          // Save contact
          const [contact] = await Contact.upsert({
            phoneNumber: phoneNumber,
            name: chat.name || phoneNumber,
            profilePicture: chat.profilePicUrl,
            lastMessageAt: chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp * 1000) : null,
            source: 'whatsapp'
          });
          
          // Get or create conversation
          let conversation = await Conversation.findOne({
            where: {
              contactId: contact.id,
              sessionId: sessionName
            }
          });
          
          if (!conversation) {
            conversation = await Conversation.create({
              contactId: contact.id,
              sessionId: sessionName,
              status: 'active',
              priority: 'medium',
              lastMessageAt: chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp * 1000) : null,
              lastMessagePreview: chat.lastMessage?.body || null,
              unreadCount: chat.unreadCount || 0
            });
          }
          
          // Load messages for this chat
          const messages = await this.getMessages(sessionName, chat.id, 50, 0);
          
          for (const msg of messages) {
            // Check if message exists
            const existingMsg = await Message.findOne({
              where: { whatsappMessageId: msg.id }
            });
            
            if (!existingMsg && msg.body) {
              await Message.create({
                conversationId: conversation.id,
                whatsappMessageId: msg.id,
                content: msg.body || '',
                direction: msg.fromMe ? 'outbound' : 'inbound',
                status: 'received',
                messageType: msg.type || 'text',
                fromNumber: msg.from,
                toNumber: msg.to,
                mediaUrl: msg.mediaUrl,
                sentAt: new Date(msg.timestamp * 1000),
                metadata: msg._data
              });
            }
          }
          
          logger.info(`Loaded chat with ${contact.name}: ${messages.length} messages`);
          
        } catch (chatError) {
          logger.error(`Error loading chat: ${chatError.message}`);
        }
      }
      
      // Emit completion event
      if (global.io) {
        global.io.emit('chats:loaded', {
          sessionName,
          message: 'All chats have been loaded'
        });
      }
      
      logger.info('Finished loading existing chats');
      
    } catch (error) {
      logger.error('Error loading existing chats:', error);
    }
  }
  
  /**
   * Helper methods
   */
  
  // Format chat ID for WAHA
  formatChatId(phoneNumber) {
    // Remove non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add @c.us or @s.whatsapp.net suffix if not present
    if (!cleaned.includes('@')) {
      return `${cleaned}@c.us`;
    }
    
    return cleaned;
  }
  
  // Get MIME type from file extension
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  /**
   * Health check
   */
  async checkHealth() {
    try {
      const response = await this.api.get('/api/health');
      return response.data;
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Handle webhook from WAHA
   * @param {Object} event - WAHA webhook event
   */
  // Set webhook for a session
  async setWebhook(sessionName = 'default', webhookUrl) {
    try {
      logger.info(`Setting webhook for session ${sessionName}:`, webhookUrl);
      
      const response = await this.api.put(`/api/sessions/${sessionName}/webhooks`, {
        webhooks: [{
          url: webhookUrl,
          events: ['message', 'message.ack', 'state.change', 'group.join', 'group.leave', 'call'],
          hmac: process.env.WEBHOOK_SECRET ? {
            key: process.env.WEBHOOK_SECRET
          } : null
        }]
      });
      
      logger.info('Webhook configured successfully');
      return response.data;
    } catch (error) {
      logger.error('Error setting webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  // Parse phone number from WhatsApp ID
  parsePhoneNumber(whatsappId) {
    if (!whatsappId) return null;
    // Remove @c.us or @s.whatsapp.net suffix
    return whatsappId.split('@')[0];
  }

  async handleWebhook(event) {
    try {
      logger.info('WAHA webhook received:', {
        event: event.event,
        session: event.session
      });

      const webhookHandler = require('./WebhookHandler');
      
      // Pass to webhook handler
      await webhookHandler.handleWebhook(event);
      
    } catch (error) {
      logger.error('Error handling WAHA webhook:', error);
      throw error;
    }
  }
}

module.exports = new WAHAService();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const { WhatsAppSession, Contact, Message } = require('../models');
const logger = require('../utils/logger');

class WhatsAppWebService {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map();
    this.sessionPath = path.join(__dirname, '../../.wwebjs_auth');
  }

  // Initialize WhatsApp client
  async initializeClient(sessionName = 'default') {
    try {
      logger.info(`Initializing WhatsApp Web client for session: ${sessionName}`);
      
      // Check if client already exists
      if (this.clients.has(sessionName)) {
        const existingClient = this.clients.get(sessionName);
        const state = await existingClient.getState();
        
        if (state === 'CONNECTED') {
          logger.info('Client already connected');
          return {
            success: true,
            message: 'Session already active',
            status: 'connected'
          };
        }
      }

      // Create new client
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: sessionName,
          dataPath: this.sessionPath
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        },
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        }
      });

      // Store client
      this.clients.set(sessionName, client);

      // Set up event handlers
      this.setupEventHandlers(sessionName, client);

      // Initialize client
      await client.initialize();

      return {
        success: true,
        message: 'Session initializing',
        status: 'initializing'
      };
    } catch (error) {
      logger.error('Error initializing client:', error);
      throw error;
    }
  }

  // Setup event handlers
  setupEventHandlers(sessionName, client) {
    // QR Code generation
    client.on('qr', async (qr) => {
      logger.info('QR Code received');
      
      // Store QR code
      this.qrCodes.set(sessionName, qr);
      
      // Update database
      await WhatsAppSession.update(
        { 
          status: 'qr',
          qrCode: qr,
          qrCodeExpiresAt: new Date(Date.now() + 60000)
        },
        { where: { sessionName } }
      );

      // Print to terminal
      qrcodeTerminal.generate(qr, { small: true });
      
      // Emit to frontend
      if (global.io) {
        try {
          // Generate QR code as base64 image
          const qrImage = await qrcode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          
          global.io.emit('session:qr', { 
            sessionName, 
            qr: qrImage
          });
        } catch (error) {
          logger.error('Error generating QR image:', error);
        }
      }
    });

    // Ready event (authenticated)
    client.on('ready', async () => {
      logger.info('WhatsApp Web client ready');
      
      const info = client.info;
      const phoneNumber = info.wid.user;
      
      // Update session
      await WhatsAppSession.update(
        { 
          status: 'connected',
          phoneNumber,
          connectedAt: new Date(),
          qrCode: null
        },
        { where: { sessionName } }
      );

      // Clear QR code
      this.qrCodes.delete(sessionName);

      // Emit to frontend
      if (global.io) {
        global.io.emit('session:connected', { 
          sessionName, 
          phoneNumber,
          status: 'connected' 
        });
      }

      // Load existing chats after connection
      logger.info('Loading existing chats...');
      setTimeout(async () => {
        await this.loadExistingChats(sessionName, client);
      }, 2000);
    });

    // Authentication failure
    client.on('auth_failure', async (msg) => {
      logger.error('Authentication failure:', msg);
      
      await WhatsAppSession.update(
        { 
          status: 'disconnected',
          errorMessage: msg
        },
        { where: { sessionName } }
      );
    });

    // Disconnection
    client.on('disconnected', async (reason) => {
      logger.info('Client disconnected:', reason);
      
      await WhatsAppSession.update(
        { 
          status: 'disconnected',
          disconnectedAt: new Date()
        },
        { where: { sessionName } }
      );

      // Remove client
      this.clients.delete(sessionName);
    });

    // Incoming messages
    client.on('message', async (msg) => {
      try {
        await this.handleIncomingMessage(sessionName, msg, client);
      } catch (error) {
        logger.error('Error handling message:', error);
      }
    });

    // Message status updates
    client.on('message_ack', async (msg, ack) => {
      try {
        await this.updateMessageStatus(msg, ack);
      } catch (error) {
        logger.error('Error updating message status:', error);
      }
    });
  }

  // WAHA-compatible API methods
  async startSession(sessionName = 'default') {
    try {
      // Update database
      await WhatsAppSession.upsert({
        sessionName,
        status: 'starting'
      });

      const result = await this.initializeClient(sessionName);
      return {
        success: true,
        ...result
      };
    } catch (error) {
      logger.error('Error starting session:', error);
      throw error;
    }
  }

  async stopSession(sessionName = 'default') {
    try {
      const client = this.clients.get(sessionName);
      
      if (client) {
        await client.destroy();
        this.clients.delete(sessionName);
        this.qrCodes.delete(sessionName);
      }

      await WhatsAppSession.update(
        { 
          status: 'disconnected',
          disconnectedAt: new Date()
        },
        { where: { sessionName } }
      );

      return {
        success: true,
        message: 'Session stopped'
      };
    } catch (error) {
      logger.error('Error stopping session:', error);
      throw error;
    }
  }

  async getSessionStatus(sessionName = 'default') {
    try {
      const client = this.clients.get(sessionName);
      const dbSession = await WhatsAppSession.findOne({
        where: { sessionName }
      });

      if (!client) {
        return {
          status: 'disconnected',
          qr: null
        };
      }

      const state = await client.getState();
      const qr = this.qrCodes.get(sessionName);

      return {
        status: state === 'CONNECTED' ? 'connected' : 
                state === 'OPENING' ? 'connecting' : 
                qr ? 'qr' : 'disconnected',
        qr: qr || null,
        phoneNumber: dbSession?.phoneNumber,
        connectedAt: dbSession?.connectedAt
      };
    } catch (error) {
      logger.error('Error getting status:', error);
      return { status: 'error' };
    }
  }

  async getQRCode(sessionName = 'default') {
    try {
      const qr = this.qrCodes.get(sessionName);
      
      if (!qr) {
        const dbSession = await WhatsAppSession.findOne({
          where: { sessionName }
        });
        return dbSession?.qrCode || null;
      }

      return qr;
    } catch (error) {
      logger.error('Error getting QR:', error);
      return null;
    }
  }

  // Send text message
  async sendTextMessage(sessionName, phoneNumber, text, quotedMessageId = null) {
    try {
      const client = this.clients.get(sessionName);
      if (!client) throw new Error('Session not connected');

      const state = await client.getState();
      if (state !== 'CONNECTED') throw new Error('WhatsApp not connected');

      // Format number
      const chatId = this.formatPhoneNumber(phoneNumber);
      
      // Send message
      const sent = await client.sendMessage(chatId, text, {
        quotedMessageId
      });

      return {
        success: true,
        messageId: sent.id.id,
        timestamp: sent.timestamp
      };
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  // Send media message
  async sendMediaMessage(sessionName, phoneNumber, mediaPath, caption = '', type = 'image') {
    try {
      const client = this.clients.get(sessionName);
      if (!client) throw new Error('Session not connected');

      const state = await client.getState();
      if (state !== 'CONNECTED') throw new Error('WhatsApp not connected');

      const chatId = this.formatPhoneNumber(phoneNumber);
      const media = MessageMedia.fromFilePath(mediaPath);
      
      const sent = await client.sendMessage(chatId, media, {
        caption
      });

      return {
        success: true,
        messageId: sent.id.id,
        timestamp: sent.timestamp
      };
    } catch (error) {
      logger.error('Error sending media:', error);
      throw error;
    }
  }

  // Get contacts
  async getContacts(sessionName = 'default') {
    try {
      const client = this.clients.get(sessionName);
      if (!client) return [];

      const state = await client.getState();
      if (state !== 'CONNECTED') return [];

      const contacts = await client.getContacts();
      
      return contacts.map(contact => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname || contact.number,
        phoneNumber: contact.number,
        isMyContact: contact.isMyContact
      }));
    } catch (error) {
      logger.error('Error getting contacts:', error);
      return [];
    }
  }

  // Check if number exists on WhatsApp
  async checkNumberExists(sessionName, phoneNumber) {
    try {
      const client = this.clients.get(sessionName);
      if (!client) return false;

      const state = await client.getState();
      if (state !== 'CONNECTED') return false;

      const number = this.formatPhoneNumber(phoneNumber);
      const isRegistered = await client.isRegisteredUser(number);
      
      return isRegistered;
    } catch (error) {
      logger.error('Error checking number:', error);
      return false;
    }
  }

  // Handle incoming message
  async handleIncomingMessage(sessionName, message, client) {
    try {
      logger.info('📨 New message received');
      logger.info(`From: ${message.from}`);
      logger.info(`Body: ${message.body?.substring(0, 50)}`);
      
      const contact = await message.getContact();
      const chat = await message.getChat();
      
      // Update or create contact
      const [dbContact] = await Contact.upsert({
        phoneNumber: contact.number,
        name: contact.name || contact.pushname || contact.number,
        lastMessageAt: new Date(),
        source: 'whatsapp'
      });

      // Get or create conversation
      const { Conversation } = require('../models');
      let conversation = await Conversation.findOne({
        where: { 
          contactId: dbContact.id,
          sessionId: sessionName,
          status: 'active'
        }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          contactId: dbContact.id,
          sessionId: sessionName,
          status: 'active',
          priority: 'medium'
        });
      }

      // Save message
      logger.info(`Saving message to database...`);
      const savedMessage = await Message.create({
        conversationId: conversation.id,
        whatsappMessageId: message.id.id,
        content: message.body || '',
        direction: 'inbound',
        status: 'received',
        messageType: message.type || 'text',
        fromNumber: message.from || contact.id._serialized,
        toNumber: message.to || client.info.wid._serialized,
        sentAt: message.timestamp ? new Date(message.timestamp * 1000) : new Date()
      });
      logger.info(`Message saved with ID: ${savedMessage.id}`);

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: message.body || '[Media]',
        unreadCount: conversation.unreadCount + 1
      });
      logger.info(`Conversation ${conversation.id} updated`);

      // Update conversation session (24-hour window)
      const { ConversationSession } = require('../models');
      await ConversationSession.upsert({
        conversationId: conversation.id,
        phoneNumber: contact.number,
        lastCustomerMessageAt: new Date(),
        sessionStart: new Date()
      });

      // Emit to frontend
      if (global.io) {
        logger.info('Emitting message to frontend via Socket.IO');
        global.io.emit('message:new', {
          conversationId: conversation.id,
          message: savedMessage.toJSON()
        });
        
        // Also emit conversation update
        global.io.emit('conversation:updated', {
          conversationId: conversation.id,
          lastMessage: message.body,
          unreadCount: conversation.unreadCount
        });
      } else {
        logger.warn('Socket.IO not available - cannot emit to frontend');
      }

      logger.info(`✅ Message processed from ${contact.number}: ${message.body?.substring(0, 50)}`);
    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  }

  // Update message status
  async updateMessageStatus(message, ack) {
    try {
      const statusMap = {
        0: 'sending',
        1: 'sent',
        2: 'delivered',
        3: 'read',
        4: 'played'
      };

      const messageStatus = statusMap[ack] || 'unknown';

      await Message.update(
        { status: messageStatus },
        { where: { whatsappMessageId: message.id.id } }
      );

      // Emit to frontend
      if (global.io) {
        global.io.emit('message:status', {
          messageId: message.id.id,
          status: messageStatus
        });
      }
    } catch (error) {
      logger.error('Error updating message status:', error);
    }
  }

  // Load existing chats from WhatsApp
  async loadExistingChats(sessionName, client) {
    try {
      logger.info('Fetching all chats from WhatsApp...');
      
      // Get all chats
      const chats = await client.getChats();
      logger.info(`Found ${chats.length} chats`);
      
      for (const chat of chats) {
        try {
          // Skip broadcast lists and status
          if (chat.isBroadcast || chat.id._serialized === 'status@broadcast') {
            continue;
          }
          
          // Get contact info
          const contact = await chat.getContact();
          let phoneNumber = contact.number || chat.id.user;
          
          // Validate and clean phone number
          if (!phoneNumber || phoneNumber.includes('@g.us')) {
            // Skip groups for now
            logger.info(`Skipping group chat: ${chat.name || chat.id._serialized}`);
            continue;
          }
          
          // Clean phone number - remove any non-digits
          phoneNumber = phoneNumber.replace(/\D/g, '');
          
          if (!phoneNumber || phoneNumber.length < 10) {
            logger.warn(`Invalid phone number for chat: ${chat.name || chat.id._serialized}`);
            continue;
          }
          
          // Save/update contact
          const [dbContact] = await Contact.upsert({
            phoneNumber,
            name: contact.name || contact.pushname || phoneNumber,
            profilePicture: contact.profilePicUrl,
            lastMessageAt: chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp * 1000) : null,
            source: 'whatsapp'
          });
          
          logger.info(`Processing chat with ${contact.name || phoneNumber}`);
          
          // Get or create conversation
          const { Conversation } = require('../models');
          let conversation = await Conversation.findOne({
            where: { 
              contactId: dbContact.id,
              sessionId: sessionName
            }
          });
          
          if (!conversation) {
            conversation = await Conversation.create({
              contactId: dbContact.id,
              sessionId: sessionName,
              status: 'active',
              priority: 'medium',
              lastMessageAt: chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp * 1000) : null,
              lastMessagePreview: chat.lastMessage?.body || null,
              unreadCount: chat.unreadCount || 0
            });
          } else {
            // Update conversation
            await conversation.update({
              lastMessageAt: chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp * 1000) : null,
              lastMessagePreview: chat.lastMessage?.body || null,
              unreadCount: chat.unreadCount || 0
            });
          }
          
          // Fetch recent messages (last 50)
          const messages = await chat.fetchMessages({ limit: 50 });
          logger.info(`  - Loading ${messages.length} messages`);
          
          for (const msg of messages) {
            try {
              // Check if message already exists
              const existingMsg = await Message.findOne({
                where: { whatsappMessageId: msg.id.id }
              });
              
              if (!existingMsg) {
                // Save new message
                await Message.create({
                  conversationId: conversation.id,
                  whatsappMessageId: msg.id.id,
                  content: msg.body || '',
                  direction: msg.fromMe ? 'outbound' : 'inbound',
                  status: msg.ack === 0 ? 'sending' : 
                         msg.ack === 1 ? 'sent' :
                         msg.ack === 2 ? 'delivered' :
                         msg.ack === 3 ? 'read' : 'received',
                  messageType: msg.type || 'text',
                  fromNumber: msg.from || contact.id._serialized,
                  toNumber: msg.to || client.info.wid._serialized,
                  mediaUrl: msg.mediaUrl,
                  sentAt: new Date(msg.timestamp * 1000),
                  metadata: {
                    hasMedia: msg.hasMedia,
                    isForwarded: msg.isForwarded,
                    isStarred: msg.isStarred
                  }
                });
              }
            } catch (msgError) {
              logger.error(`Error saving message: ${msgError.message}`);
            }
          }
          
        } catch (chatError) {
          logger.error(`Error processing chat: ${chatError.message}`);
        }
      }
      
      // Emit to frontend that chats are loaded
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

  // Helper functions
  formatPhoneNumber(phoneNumber) {
    // Remove non-numeric chars
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing
    let formatted = cleaned;
    if (!formatted.startsWith('62')) {
      formatted = '62' + formatted.replace(/^0/, '');
    }
    
    return formatted + '@c.us';
  }
}

module.exports = new WhatsAppWebService();
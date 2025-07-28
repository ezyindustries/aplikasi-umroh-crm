const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const { WhatsAppSession, Contact, Message } = require('../models');
const logger = require('../utils/logger');
const pino = require('pino');

class BaileysService {
  constructor() {
    this.sessions = new Map();
    this.qrCodes = new Map();
    this.sessionPath = path.join(__dirname, '../../sessions');
    this.initializeSessionDirectory();
  }

  async initializeSessionDirectory() {
    try {
      await fs.mkdir(this.sessionPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create session directory:', error);
    }
  }

  // Start WhatsApp session
  async startSession(sessionName = 'default') {
    try {
      if (this.sessions.has(sessionName)) {
        return {
          success: true,
          message: 'Session already active',
          status: 'connected'
        };
      }

      logger.info(`Starting Baileys session: ${sessionName}`);

      // Auth state
      const authPath = path.join(this.sessionPath, sessionName);
      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      // Create socket
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'error' }),
        browser: ['Vauza Tamma CRM', 'Chrome', '120.0.0']
      });

      // Store session
      this.sessions.set(sessionName, {
        sock,
        qr: null,
        status: 'connecting',
        phoneNumber: null
      });

      // Update database
      await WhatsAppSession.upsert({
        sessionName,
        status: 'connecting'
      });

      // Setup event handlers
      this.setupEventHandlers(sessionName, sock, saveCreds);

      return {
        success: true,
        message: 'Session starting. Please check for QR code.',
        status: 'connecting'
      };
    } catch (error) {
      logger.error('Error starting Baileys session:', error);
      throw error;
    }
  }

  // Setup event handlers
  setupEventHandlers(sessionName, sock, saveCreds) {
    const session = this.sessions.get(sessionName);

    // Connection update
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // New QR code
        session.qr = qr;
        
        try {
          // Generate QR code as base64 image
          const qrImage = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          session.qrImage = qrImage;
          this.qrCodes.set(sessionName, qrImage);
          
          // Update database
          await WhatsAppSession.update(
            { 
              status: 'qr',
              qrCode: qrImage 
            },
            { where: { sessionName } }
          );

          // Print QR in terminal too
          qrcodeTerminal.generate(qr, { small: true });
          
          // Emit to frontend with base64 image
          if (global.io) {
            global.io.emit('session:qr', { 
              sessionName, 
              qr: qrImage 
            });
          }
        } catch (error) {
          logger.error('Error generating QR image:', error);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          logger.info('Reconnecting...');
          setTimeout(() => this.startSession(sessionName), 5000);
        } else {
          logger.info('Session logged out');
          this.sessions.delete(sessionName);
          await WhatsAppSession.update(
            { status: 'disconnected' },
            { where: { sessionName } }
          );
        }
      } else if (connection === 'open') {
        logger.info('Connected to WhatsApp');
        
        // Get phone number
        const phoneNumber = sock.user?.id?.split('@')[0] || '';
        session.status = 'connected';
        session.phoneNumber = phoneNumber;
        session.qr = null;
        this.qrCodes.delete(sessionName);

        // Update database
        await WhatsAppSession.update(
          { 
            status: 'connected',
            phoneNumber,
            connectedAt: new Date(),
            qrCode: null
          },
          { where: { sessionName } }
        );

        // Emit to frontend
        if (global.io) {
          global.io.emit('session:connected', { 
            sessionName, 
            phoneNumber,
            status: 'connected' 
          });
        }
      }
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);

    // Messages
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const message = m.messages[0];
        if (!message.message || message.key.fromMe) return;

        await this.handleIncomingMessage(sessionName, message);
      } catch (error) {
        logger.error('Error handling message:', error);
      }
    });

    // Message status updates
    sock.ev.on('messages.update', async (updates) => {
      for (const update of updates) {
        if (update.update.status) {
          await this.updateMessageStatus(update.key, update.update.status);
        }
      }
    });

    // Contacts update
    sock.ev.on('contacts.update', async (updates) => {
      for (const contact of updates) {
        await this.updateContact(contact);
      }
    });
  }

  // Stop session
  async stopSession(sessionName = 'default') {
    try {
      const session = this.sessions.get(sessionName);
      if (!session) {
        throw new Error('Session not found');
      }

      await session.sock.logout();
      this.sessions.delete(sessionName);
      this.qrCodes.delete(sessionName);

      await WhatsAppSession.update(
        { status: 'disconnected' },
        { where: { sessionName } }
      );

      return { success: true, message: 'Session stopped' };
    } catch (error) {
      logger.error('Error stopping session:', error);
      throw error;
    }
  }

  // Get session status
  async getSessionStatus(sessionName = 'default') {
    try {
      const session = this.sessions.get(sessionName);
      const dbSession = await WhatsAppSession.findOne({
        where: { sessionName }
      });

      if (!session) {
        return {
          status: 'disconnected',
          qr: null,
          phoneNumber: null
        };
      }

      return {
        status: session.status,
        qr: session.qrImage || this.qrCodes.get(sessionName),
        phoneNumber: session.phoneNumber,
        connectedAt: dbSession?.connectedAt
      };
    } catch (error) {
      logger.error('Error getting session status:', error);
      return { status: 'error' };
    }
  }

  // Send text message
  async sendTextMessage(sessionName, phoneNumber, text, quotedMessageId = null) {
    try {
      const session = this.sessions.get(sessionName);
      if (!session || session.status !== 'connected') {
        throw new Error('Session not connected');
      }

      const jid = this.formatJid(phoneNumber);
      const messageOptions = { text };
      
      if (quotedMessageId) {
        messageOptions.quoted = quotedMessageId;
      }

      const sent = await session.sock.sendMessage(jid, messageOptions);
      
      return {
        success: true,
        messageId: sent.key.id,
        timestamp: sent.messageTimestamp
      };
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  // Send media message
  async sendMediaMessage(sessionName, phoneNumber, mediaPath, caption = '', type = 'image') {
    try {
      const session = this.sessions.get(sessionName);
      if (!session || session.status !== 'connected') {
        throw new Error('Session not connected');
      }

      const jid = this.formatJid(phoneNumber);
      const mediaBuffer = await fs.readFile(mediaPath);
      
      const messageOptions = {
        caption,
        [type]: mediaBuffer
      };

      const sent = await session.sock.sendMessage(jid, messageOptions);
      
      return {
        success: true,
        messageId: sent.key.id,
        timestamp: sent.messageTimestamp
      };
    } catch (error) {
      logger.error('Error sending media:', error);
      throw error;
    }
  }

  // Get contacts
  async getContacts(sessionName = 'default') {
    try {
      const session = this.sessions.get(sessionName);
      if (!session || session.status !== 'connected') {
        return [];
      }

      // Baileys doesn't provide a direct way to get all contacts
      // We'll return contacts from our database instead
      const contacts = await Contact.findAll({
        where: { status: 'active' }
      });

      return contacts.map(c => ({
        id: c.phoneNumber,
        name: c.name,
        phoneNumber: c.phoneNumber,
        profilePicture: c.profilePicture
      }));
    } catch (error) {
      logger.error('Error getting contacts:', error);
      return [];
    }
  }

  // Check if number exists on WhatsApp
  async checkNumberExists(sessionName, phoneNumber) {
    try {
      const session = this.sessions.get(sessionName);
      if (!session || session.status !== 'connected') {
        return false;
      }

      const jid = this.formatJid(phoneNumber);
      const [result] = await session.sock.onWhatsApp(jid);
      
      return result?.exists || false;
    } catch (error) {
      logger.error('Error checking number:', error);
      return false;
    }
  }

  // Handle incoming message
  async handleIncomingMessage(sessionName, message) {
    try {
      const { key, message: msg, pushName } = message;
      const from = key.remoteJid;
      const phoneNumber = from.split('@')[0];

      // Update or create contact
      const [contact] = await Contact.upsert({
        phoneNumber,
        name: pushName || phoneNumber,
        lastMessageAt: new Date(),
        source: 'whatsapp'
      });

      // Get or create conversation
      const { Conversation } = require('../models');
      let conversation = await Conversation.findOne({
        where: { 
          contactId: contact.id,
          sessionId: sessionName,
          status: 'active'
        }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          contactId: contact.id,
          sessionId: sessionName,
          status: 'active',
          priority: 'medium'
        });
      }

      // Extract message content
      const content = msg.conversation || 
                     msg.extendedTextMessage?.text || 
                     msg.imageMessage?.caption ||
                     msg.videoMessage?.caption ||
                     '[Media]';

      // Save message
      const savedMessage = await Message.create({
        conversationId: conversation.id,
        phoneNumber,
        whatsappMessageId: key.id,
        content,
        direction: 'inbound',
        status: 'received',
        messageType: this.getMessageType(msg)
      });

      // Update conversation
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessageContent: content,
        unreadCount: conversation.unreadCount + 1
      });

      // Update conversation session (24-hour window)
      const { ConversationSession } = require('../models');
      await ConversationSession.upsert({
        contactId: contact.id,
        lastCustomerMessageAt: new Date(),
        windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // Emit to frontend
      if (global.io) {
        global.io.emit('message:new', {
          conversationId: conversation.id,
          message: savedMessage.toJSON()
        });
      }

      logger.info(`New message from ${phoneNumber}: ${content.substring(0, 50)}`);
    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  }

  // Update message status
  async updateMessageStatus(key, status) {
    try {
      const statusMap = {
        1: 'sent',
        2: 'delivered',
        3: 'read',
        4: 'played'
      };

      const messageStatus = statusMap[status] || 'unknown';

      await Message.update(
        { status: messageStatus },
        { where: { whatsappMessageId: key.id } }
      );

      // Emit to frontend
      if (global.io) {
        global.io.emit('message:status', {
          messageId: key.id,
          status: messageStatus
        });
      }
    } catch (error) {
      logger.error('Error updating message status:', error);
    }
  }

  // Update contact
  async updateContact(contactUpdate) {
    try {
      const phoneNumber = contactUpdate.id.split('@')[0];
      
      await Contact.upsert({
        phoneNumber,
        name: contactUpdate.name || contactUpdate.notify || phoneNumber,
        profilePicture: contactUpdate.imgUrl
      });
    } catch (error) {
      logger.error('Error updating contact:', error);
    }
  }

  // Helper functions
  formatJid(phoneNumber) {
    // Remove non-numeric chars
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing
    let formatted = cleaned;
    if (!formatted.startsWith('62')) {
      formatted = '62' + formatted.replace(/^0/, '');
    }
    
    return formatted + '@s.whatsapp.net';
  }

  parsePhoneNumber(jid) {
    return jid.split('@')[0];
  }

  getMessageType(message) {
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    return 'text';
  }
}

module.exports = new BaileysService();
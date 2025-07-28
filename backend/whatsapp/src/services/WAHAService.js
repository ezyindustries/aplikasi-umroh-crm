const axios = require('axios');
const EventEmitter = require('events');
const { WhatsAppSession } = require('../models');

class WAHAService extends EventEmitter {
  constructor() {
    super();
    this.baseURL = process.env.WAHA_BASE_URL || 'http://localhost:3000';
    this.apiKey = process.env.WAHA_API_KEY || '';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 30000
    });
  }

  // Session Management
  async startSession(sessionName = 'default') {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/start`);
      
      // Update session in database
      await WhatsAppSession.upsert({
        sessionName,
        status: 'connecting',
        lastHealthCheck: new Date()
      });

      return response.data;
    } catch (error) {
      console.error('Error starting session:', error.message);
      throw error;
    }
  }

  async stopSession(sessionName = 'default') {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/stop`);
      
      // Update session status
      await WhatsAppSession.update(
        { 
          status: 'disconnected',
          disconnectedAt: new Date()
        },
        { where: { sessionName } }
      );

      return response.data;
    } catch (error) {
      console.error('Error stopping session:', error.message);
      throw error;
    }
  }

  async getSessionStatus(sessionName = 'default') {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/status`);
      const data = response.data;

      // Update session in database
      const updateData = {
        status: data.status,
        lastHealthCheck: new Date()
      };

      if (data.qr) {
        updateData.qrCode = data.qr;
        updateData.qrCodeExpiresAt = new Date(Date.now() + 60000); // 60 seconds
      }

      if (data.phoneNumber) {
        updateData.phoneNumber = data.phoneNumber;
      }

      if (data.status === 'connected') {
        updateData.connectedAt = updateData.connectedAt || new Date();
      }

      await WhatsAppSession.upsert({
        sessionName,
        ...updateData
      });

      return data;
    } catch (error) {
      console.error('Error getting session status:', error.message);
      return { status: 'disconnected' };
    }
  }

  async getQRCode(sessionName = 'default') {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/qr`);
      return response.data;
    } catch (error) {
      console.error('Error getting QR code:', error.message);
      throw error;
    }
  }

  // Messaging
  async sendTextMessage(sessionName, phoneNumber, text) {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/messages/text`, {
        to: this.formatPhoneNumber(phoneNumber),
        text
      });

      return response.data;
    } catch (error) {
      console.error('Error sending text message:', error.message);
      throw error;
    }
  }

  async sendMediaMessage(sessionName, phoneNumber, mediaUrl, caption = '') {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/messages/media`, {
        to: this.formatPhoneNumber(phoneNumber),
        mediaUrl,
        caption
      });

      return response.data;
    } catch (error) {
      console.error('Error sending media message:', error.message);
      throw error;
    }
  }

  async sendTemplateMessage(sessionName, phoneNumber, template) {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/messages/template`, {
        to: this.formatPhoneNumber(phoneNumber),
        template
      });

      return response.data;
    } catch (error) {
      console.error('Error sending template message:', error.message);
      throw error;
    }
  }

  // Contact Management
  async getContacts(sessionName = 'default') {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/contacts`);
      return response.data;
    } catch (error) {
      console.error('Error getting contacts:', error.message);
      return [];
    }
  }

  async checkNumberExists(sessionName, phoneNumber) {
    try {
      const response = await this.client.get(
        `/api/sessions/${sessionName}/contacts/check/${this.formatPhoneNumber(phoneNumber)}`
      );
      return response.data.exists;
    } catch (error) {
      console.error('Error checking number:', error.message);
      return false;
    }
  }

  // Groups
  async getGroups(sessionName = 'default') {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/groups`);
      return response.data;
    } catch (error) {
      console.error('Error getting groups:', error.message);
      return [];
    }
  }

  // Media
  async downloadMedia(sessionName, mediaId) {
    try {
      const response = await this.client.get(
        `/api/sessions/${sessionName}/media/${mediaId}`,
        { responseType: 'arraybuffer' }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading media:', error.message);
      throw error;
    }
  }

  // Webhook Management
  async setWebhook(sessionName, webhookUrl) {
    try {
      const response = await this.client.post(`/api/sessions/${sessionName}/webhook`, {
        url: webhookUrl
      });

      // Update webhook URL in database
      await WhatsAppSession.update(
        { webhookUrl },
        { where: { sessionName } }
      );

      return response.data;
    } catch (error) {
      console.error('Error setting webhook:', error.message);
      throw error;
    }
  }

  // Utility Methods
  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('62') && cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    
    // Add @c.us suffix for WhatsApp
    return cleaned.includes('@') ? cleaned : `${cleaned}@c.us`;
  }

  parsePhoneNumber(whatsappId) {
    // Remove @c.us or @g.us suffix
    return whatsappId.replace(/@[cg]\.us$/, '');
  }

  // Health Check
  async healthCheck() {
    try {
      const sessions = await WhatsAppSession.findAll({
        where: { status: 'connected' }
      });

      for (const session of sessions) {
        await this.getSessionStatus(session.sessionName);
      }

      return true;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const wahaService = new WAHAService();

// Start health check interval
setInterval(() => {
  wahaService.healthCheck();
}, 10000); // Every 10 seconds

module.exports = wahaService;
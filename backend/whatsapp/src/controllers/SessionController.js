// Use RealWAHAService for exact WAHA API compatibility
const whatsappService = require('../services/RealWAHAService');
const { WhatsAppSession } = require('../models');
const logger = require('../utils/logger');

class SessionController {
  // Start WhatsApp session
  async start(req, res) {
    try {
      const { sessionId = 'default' } = req.body;
      
      logger.api.info('Starting WhatsApp session:', sessionId);
      
      const result = await whatsappService.startSession(sessionId);
      
      res.json({
        success: true,
        data: result,
        message: 'Session starting. Please check status for QR code.'
      });
    } catch (error) {
      logger.api.error('Error starting session:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Stop WhatsApp session
  async stop(req, res) {
    try {
      const { sessionId } = req.params;
      
      logger.api.info('Stopping WhatsApp session:', sessionId);
      
      await whatsappService.stopSession(sessionId);
      
      res.json({
        success: true,
        message: 'Session stopped successfully'
      });
    } catch (error) {
      logger.api.error('Error stopping session:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get session status
  async getStatus(req, res) {
    try {
      const { sessionId } = req.params;
      
      const status = await whatsappService.getSessionStatus(sessionId);
      
      // Get session from database
      const session = await WhatsAppSession.findOne({
        where: { sessionName: sessionId }
      });
      
      res.json({
        success: true,
        data: {
          status: status.status,
          qr: status.qr,
          phone: session?.phoneNumber || status.me?.id || status.me?.pushName,
          phoneNumber: status.me?.id,
          pushName: status.me?.pushName,
          connectedAt: session?.connectedAt,
          sessionInfo: session,
          me: status.me
        }
      });
    } catch (error) {
      logger.api.error('Error getting session status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all sessions
  async getAllSessions(req, res) {
    try {
      const sessions = await WhatsAppSession.findAll({
        attributes: ['id', 'sessionName', 'phoneNumber', 'status', 'connectedAt', 'lastHealthCheck']
      });
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.api.error('Error getting sessions:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Set webhook for session
  async setWebhook(req, res) {
    try {
      const { sessionId } = req.params;
      const { webhookUrl } = req.body;
      
      await whatsappService.setWebhook(sessionId, webhookUrl);
      
      res.json({
        success: true,
        message: 'Webhook set successfully'
      });
    } catch (error) {
      logger.api.error('Error setting webhook:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Reconnect session
  async reconnect(req, res) {
    try {
      const { sessionId } = req.params;
      
      logger.api.info('Reconnecting WhatsApp session:', sessionId);
      
      // Stop first
      await whatsappService.stopSession(sessionId);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start again
      const result = await whatsappService.startSession(sessionId);
      
      res.json({
        success: true,
        data: result,
        message: 'Session reconnecting. Please check status.'
      });
    } catch (error) {
      logger.api.error('Error reconnecting session:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Refresh QR code
  async refreshQR(req, res) {
    try {
      const { sessionId } = req.params;
      
      logger.api.info('Refreshing QR code for session:', sessionId);
      
      // Stop and restart session to get new QR
      await whatsappService.stopSession(sessionId);
      
      // Wait a bit before restarting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await whatsappService.startSession(sessionId);
      
      res.json({
        success: true,
        message: 'QR refresh initiated',
        data: result
      });
    } catch (error) {
      logger.api.error('Error refreshing QR:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Load chat history
  async loadChatHistory(req, res) {
    try {
      const { sessionId } = req.params;
      
      logger.api.info('Loading chat history for session:', sessionId);
      
      // Check if session is connected
      const status = await whatsappService.getSessionStatus(sessionId);
      if (status.status !== 'authenticated') {
        return res.status(400).json({
          success: false,
          error: 'Session not connected'
        });
      }
      
      // Load chats using WAHA service
      await whatsappService.loadExistingChats(sessionId);
      
      res.json({
        success: true,
        message: 'Chat history loading initiated'
      });
    } catch (error) {
      logger.api.error('Error loading chat history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get QR code directly
  async getQR(req, res) {
    try {
      const { sessionId } = req.params;
      
      logger.api.info('Getting QR for session:', sessionId);
      
      const qr = await whatsappService.getQRCode(sessionId);
      
      res.json({
        success: true,
        data: {
          qr: qr,
          hasQR: !!qr
        }
      });
    } catch (error) {
      logger.api.error('Error getting QR:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SessionController();

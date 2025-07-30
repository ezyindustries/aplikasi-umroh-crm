const express = require('express');
const router = express.Router();

// Controllers
const sessionController = require('../controllers/SessionController');
const messageController = require('../controllers/MessageController');
const contactController = require('../controllers/ContactController');
const conversationController = require('../controllers/ConversationController');

// Webhook handler
const webhookHandler = require('../services/WebhookHandler');

// Session manager
const sessionManager = require('../services/SessionManager');

// Rate limiting - removed global rate limiting to fix message sending
// const { createRateLimitMiddleware } = require('../config/rateLimiter');

// Session routes
router.post('/sessions/start', sessionController.start);
router.post('/sessions/:sessionId/stop', sessionController.stop);
router.get('/sessions/:sessionId/status', sessionController.getStatus);
router.get('/sessions', sessionController.getAllSessions);
router.post('/sessions/:sessionId/webhook', sessionController.setWebhook);
router.post('/sessions/:sessionId/reconnect', sessionController.reconnect);
router.post('/sessions/:sessionId/refresh-qr', sessionController.refreshQR);
router.post('/sessions/:sessionId/load-history', sessionController.loadChatHistory);
router.get('/sessions/:sessionId/qr', sessionController.getQR);

// Message routes
router.post('/messages/send', messageController.sendMessage);
router.get('/messages/:conversationId', messageController.getMessages);
router.get('/messages/search', messageController.searchMessages);
router.get('/messages/:messageId/status', messageController.getMessageStatus);
router.post('/messages/:messageId/star', messageController.toggleStar);
router.get('/messages/queue/status', messageController.getQueueStatus);

// Media endpoint
router.get('/messages/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const wahaService = require('../services/RealWAHAService');
    
    // Download media from WAHA
    const mediaBuffer = await wahaService.downloadMedia(mediaId);
    
    // Get message to determine mime type
    const Message = require('../models/Message');
    const message = await Message.findOne({ where: { mediaId } });
    
    if (message && message.mediaMimeType) {
      res.set('Content-Type', message.mediaMimeType);
    }
    
    res.send(mediaBuffer);
  } catch (error) {
    console.error('Error serving media:', error);
    res.status(404).json({ error: 'Media not found' });
  }
});

// Contact routes
router.get('/contacts', contactController.getContacts);
router.get('/contacts/:contactId', contactController.getContact);
router.post('/contacts', contactController.upsertContact);
router.put('/contacts/:contactId', contactController.updateContact);
router.post('/contacts/sync', contactController.syncContacts);
router.get('/contacts/:contactId/conversations', contactController.getContactConversations);
router.post('/contacts/:contactId/block', contactController.toggleBlock);
router.get('/contacts/:contactId/stats', contactController.getContactStats);

// Conversation routes
router.get('/conversations', conversationController.getConversations);
router.get('/conversations/:conversationId', conversationController.getConversation);
router.post('/conversations', conversationController.createConversation);
router.put('/conversations/:conversationId', conversationController.updateConversation);
router.post('/conversations/:conversationId/close', conversationController.closeConversation);
router.post('/conversations/:conversationId/archive', conversationController.archiveConversation);
router.post('/conversations/:conversationId/assign', conversationController.assignConversation);
router.post('/conversations/:conversationId/labels', conversationController.addLabel);
router.delete('/conversations/:conversationId/labels', conversationController.removeLabel);

// Session management endpoints
router.post('/sessions/restore', async (req, res) => {
  try {
    const { sessionName = 'default' } = req.body;
    const restored = await sessionManager.startSessionWithRestore(sessionName);
    
    res.json({
      success: restored,
      message: restored 
        ? 'Session restored successfully' 
        : 'Could not restore session, QR scan required',
      sessionName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to restore session',
      error: error.message
    });
  }
});

router.get('/sessions/backups', async (req, res) => {
  try {
    const backups = await sessionManager.listBackups();
    res.json({
      success: true,
      backups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list session backups',
      error: error.message
    });
  }
});

// Webhook endpoint moved to separate webhook routes file to avoid duplication

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Compliance status
router.get('/compliance/status', async (req, res) => {
  try {
    const wahaComplianceService = require('../services/WAHAComplianceService');
    const report = await wahaComplianceService.generateComplianceReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
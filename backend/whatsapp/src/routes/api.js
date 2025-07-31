const express = require('express');
const router = express.Router();

// Controllers
const sessionController = require('../controllers/SessionController');
const messageController = require('../controllers/MessageController');
const contactController = require('../controllers/ContactController');
const conversationController = require('../controllers/ConversationController');
const dashboardController = require('../controllers/DashboardController');
const groupController = require('../controllers/GroupController');

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
router.post('/sessions/:sessionId/sync-group-names', sessionController.syncGroupNames);

// Message routes
router.post('/messages/send', messageController.sendMessage);
router.get('/messages/:conversationId', messageController.getMessages);
router.get('/messages/search', messageController.searchMessages);
router.get('/messages/:messageId/status', messageController.getMessageStatus);
router.post('/messages/:messageId/star', messageController.toggleStar);
router.get('/messages/queue/status', messageController.getQueueStatus);

// Media endpoint - removed duplicate, see implementation below

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

// Dashboard routes
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/activity', dashboardController.getRecentActivity);
router.get('/dashboard/analytics', dashboardController.getConversionAnalytics);
router.get('/dashboard/lead-sources', dashboardController.getLeadSources);
router.get('/dashboard/ai-performance', dashboardController.getAIPerformance);

// Group routes
router.get('/groups', groupController.getGroups);
router.get('/groups/:groupId', groupController.getGroup);
router.post('/groups', groupController.createGroup);
router.put('/groups/:groupId', groupController.updateGroup);
router.post('/groups/:groupId/leave', groupController.leaveGroup);
router.post('/groups/:groupId/participants/add', groupController.addParticipants);
router.post('/groups/:groupId/participants/remove', groupController.removeParticipants);
router.post('/groups/:groupId/admin/promote', groupController.promoteParticipants);
router.post('/groups/:groupId/admin/demote', groupController.demoteParticipants);
router.get('/groups/:groupId/messages', groupController.getGroupMessages);
router.get('/groups/:groupId/invite-link', groupController.getInviteLink);
router.post('/groups/:groupId/invite-link/revoke', groupController.revokeInviteLink);

// Test endpoint
router.get('/dashboard/test', async (req, res) => {
  try {
    const { Contact, Conversation, Message } = require('../models');
    
    const contactCount = await Contact.count();
    const conversationCount = await Conversation.count();
    const messageCount = await Message.count();
    
    res.json({
      success: true,
      data: {
        contacts: contactCount,
        conversations: conversationCount,
        messages: messageCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Get media file
router.get('/messages/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const wahaService = require('../services/RealWAHAService');
    const mediaHandler = require('../services/MediaHandler');
    const logger = require('../utils/logger');
    
    logger.info(`Media request for ID: ${mediaId}`);
    
    // First try to get from local storage
    try {
      const localMedia = await mediaHandler.getMedia(mediaId);
      logger.info('Serving media from local storage');
      
      // Set CORS headers for images
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Content-Type', localMedia.mimeType);
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      
      return res.send(localMedia.data);
    } catch (localError) {
      logger.info('Media not found locally, trying WAHA...');
    }
    
    // Try different WAHA endpoints for media
    let mediaData = null;
    
    // First try the direct download endpoint
    try {
      const response = await wahaService.api.get(`/api/default/messages/${mediaId}/download`, {
        responseType: 'arraybuffer'
      });
      
      mediaData = {
        buffer: response.data,
        mimeType: response.headers['content-type'],
        fileName: response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1]
      };
    } catch (error) {
      logger.warn(`Direct download failed for ${mediaId}, trying files endpoint...`);
      
      // Try files endpoint
      try {
        const response = await wahaService.api.get(`/api/files/${mediaId}`, {
          responseType: 'arraybuffer'
        });
        
        mediaData = {
          buffer: response.data,
          mimeType: response.headers['content-type']
        };
      } catch (fileError) {
        logger.error(`Files endpoint also failed for ${mediaId}`);
      }
    }
    
    if (!mediaData || !mediaData.buffer) {
      logger.error(`No media data found for ${mediaId}`);
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }

    // Set appropriate content type and CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', mediaData.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${mediaData.fileName || 'media'}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Send the media buffer
    res.send(Buffer.from(mediaData.buffer));
    
  } catch (error) {
    logger.error('Error fetching media:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get media by message ID
router.get('/messages/:messageId/media', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { Message, MediaFile } = require('../models');
    
    const message = await Message.findByPk(messageId, {
      include: [{
        model: MediaFile,
        as: 'mediaFiles'
      }]
    });
    
    if (!message || !message.mediaId) {
      return res.status(404).json({
        success: false,
        error: 'Media not found for this message'
      });
    }
    
    // Redirect to media endpoint
    res.redirect(`/api/messages/media/${message.mediaId}`);
    
  } catch (error) {
    logger.error('Error fetching message media:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
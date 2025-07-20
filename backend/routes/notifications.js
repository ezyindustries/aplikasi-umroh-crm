const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const websocketService = require('../services/websocketService');
const { setupLogging } = require('../config/logging');
const logger = setupLogging();

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      limit = 50,
      offset = 0,
      unread_only = false,
      include_role_notifications = true
    } = req.query;

    const notifications = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unread_only: unread_only === 'true',
      include_role_notifications: include_role_notifications === 'true'
    });

    const totalCount = await notificationService.getNotificationCount(
      userId, 
      unread_only === 'true'
    );

    res.json({
      success: true,
      notifications,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + notifications.length < totalCount
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Get notification count
router.get('/count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only = true } = req.query;

    const count = await notificationService.getNotificationCount(
      userId, 
      unread_only === 'true'
    );

    res.json({
      success: true,
      count
    });
  } catch (error) {
    logger.error('Error fetching notification count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification count'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    await notificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const markedCount = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `${markedCount} notifications marked as read`
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Create notification (Admin only)
router.post('/', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      target_type,
      target_id,
      data = {},
      priority = 'normal',
      expires_at = null
    } = req.body;

    const notification = await notificationService.createNotification({
      type,
      title,
      message,
      target_type,
      target_id,
      data,
      priority,
      expires_at,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

// Get notification statistics (Admin only)
router.get('/stats', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { timeframe = '24 hours' } = req.query;
    const stats = await notificationService.getNotificationStats(timeframe);

    res.json({
      success: true,
      stats,
      timeframe
    });
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics'
    });
  }
});

// Get connected users (Admin only)
router.get('/connected-users', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const connectedUsers = websocketService.getConnectedUsers();
    
    res.json({
      success: true,
      connected_users: connectedUsers,
      total_connected: connectedUsers.length
    });
  } catch (error) {
    logger.error('Error fetching connected users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch connected users'
    });
  }
});

// Send direct message to user (Admin only)
router.post('/direct-message', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { target_user_id, message } = req.body;
    const fromUserId = req.user.id;

    const sent = websocketService.sendDirectMessage(fromUserId, target_user_id, message);

    if (sent) {
      res.json({
        success: true,
        message: 'Direct message sent successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Target user is not online'
      });
    }
  } catch (error) {
    logger.error('Error sending direct message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send direct message'
    });
  }
});

// Broadcast message to role (Admin only)
router.post('/broadcast-role', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { role, message, type = 'broadcast' } = req.body;

    websocketService.broadcastToRole(role, 'broadcast_message', {
      type,
      message,
      from: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role
      }
    });

    res.json({
      success: true,
      message: `Message broadcasted to ${role} role`
    });
  } catch (error) {
    logger.error('Error broadcasting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message'
    });
  }
});

// Send system alert (Admin only)
router.post('/system-alert', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { level, message, data = {} } = req.body;

    await notificationService.notifySystemAlert(level, message, data);
    websocketService.broadcastSystemAlert(level, message, data);

    res.json({
      success: true,
      message: 'System alert sent successfully'
    });
  } catch (error) {
    logger.error('Error sending system alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send system alert'
    });
  }
});

// Test WebSocket connection
router.post('/test-websocket', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isOnline = websocketService.isUserOnline(userId);

    if (isOnline) {
      websocketService.sendNotificationToUser(userId, {
        id: 'test',
        type: 'test',
        title: 'Test Notification',
        message: 'WebSocket connection is working!',
        data: { test: true },
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Test notification sent via WebSocket'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'User is not connected via WebSocket'
      });
    }
  } catch (error) {
    logger.error('Error testing WebSocket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test WebSocket connection'
    });
  }
});

module.exports = router;
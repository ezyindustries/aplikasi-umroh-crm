const { query } = require('../config/database');
const { setupLogging } = require('../config/logging');
const websocketService = require('./websocketService');
const logger = setupLogging();

class NotificationService {
  constructor() {
    this.notificationTypes = {
      JAMAAH_REGISTERED: 'jamaah_registered',
      JAMAAH_UPDATED: 'jamaah_updated',
      PAYMENT_RECEIVED: 'payment_received',
      PAYMENT_VERIFIED: 'payment_verified',
      PAYMENT_REJECTED: 'payment_rejected',
      DOCUMENT_UPLOADED: 'document_uploaded',
      DOCUMENT_VERIFIED: 'document_verified',
      DOCUMENT_REJECTED: 'document_rejected',
      PACKAGE_FULL: 'package_full',
      VISA_STATUS_UPDATED: 'visa_status_updated',
      SYSTEM_ALERT: 'system_alert',
      BACKUP_COMPLETED: 'backup_completed',
      BULK_IMPORT_COMPLETED: 'bulk_import_completed'
    };

    this.notificationTargets = {
      USER: 'user',
      ROLE: 'role',
      ALL: 'all'
    };
  }

  // Create notification in database
  async createNotification(notificationData) {
    try {
      const {
        type,
        title,
        message,
        target_type = this.notificationTargets.USER,
        target_id,
        data = {},
        priority = 'normal', // low, normal, high, urgent
        expires_at = null
      } = notificationData;

      const result = await query(
        `INSERT INTO notifications 
         (type, title, message, target_type, target_id, data, priority, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [type, title, message, target_type, target_id, JSON.stringify(data), priority, expires_at]
      );

      const notification = result.rows[0];
      logger.info(`Notification created: ${notification.id} - ${title}`);

      // Send real-time notification
      await this.sendRealTimeNotification(notification);

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send real-time notification via WebSocket
  async sendRealTimeNotification(notification) {
    try {
      switch (notification.target_type) {
        case this.notificationTargets.USER:
          websocketService.sendNotificationToUser(notification.target_id, notification);
          break;
          
        case this.notificationTargets.ROLE:
          websocketService.broadcastToRole(notification.target_id, 'notification', notification);
          break;
          
        case this.notificationTargets.ALL:
          websocketService.broadcastToAll('notification', notification);
          break;
      }
    } catch (error) {
      logger.error('Error sending real-time notification:', error);
    }
  }

  // Get notifications for user
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        unread_only = false,
        include_role_notifications = true
      } = options;

      let sql = `
        SELECT n.*, u.full_name as sender_name
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE (
          (n.target_type = 'user' AND n.target_id = $1)
          ${include_role_notifications ? `
          OR (n.target_type = 'role' AND n.target_id = (
            SELECT role FROM users WHERE id = $1
          ))
          OR n.target_type = 'all'
          ` : ''}
        )
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
      `;

      const params = [userId];

      if (unread_only) {
        sql += ` AND n.id NOT IN (
          SELECT notification_id FROM notification_reads 
          WHERE user_id = $1
        )`;
      }

      sql += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      await query(
        `INSERT INTO notification_reads (notification_id, user_id, read_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (notification_id, user_id) DO NOTHING`,
        [notificationId, userId]
      );

      logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      // Get all unread notifications for user
      const unreadNotifications = await this.getUserNotifications(userId, { unread_only: true });
      
      for (const notification of unreadNotifications) {
        await this.markAsRead(notification.id, userId);
      }

      logger.info(`All notifications marked as read for user ${userId}`);
      return unreadNotifications.length;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get notification count for user
  async getNotificationCount(userId, unreadOnly = true) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM notifications n
        WHERE (
          (n.target_type = 'user' AND n.target_id = $1)
          OR (n.target_type = 'role' AND n.target_id = (
            SELECT role FROM users WHERE id = $1
          ))
          OR n.target_type = 'all'
        )
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
      `;

      if (unreadOnly) {
        sql += ` AND n.id NOT IN (
          SELECT notification_id FROM notification_reads 
          WHERE user_id = $1
        )`;
      }

      const result = await query(sql, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting notification count:', error);
      throw error;
    }
  }

  // Predefined notification methods
  async notifyJamaahRegistered(jamaah, createdBy) {
    return await this.createNotification({
      type: this.notificationTypes.JAMAAH_REGISTERED,
      title: 'Jamaah Baru Terdaftar',
      message: `${jamaah.full_name} telah mendaftar untuk paket ${jamaah.package_name}`,
      target_type: this.notificationTargets.ROLE,
      target_id: 'Marketing',
      data: { jamaah_id: jamaah.id, package_id: jamaah.package_id },
      priority: 'normal'
    });
  }

  async notifyPaymentReceived(payment, createdBy) {
    return await this.createNotification({
      type: this.notificationTypes.PAYMENT_RECEIVED,
      title: 'Pembayaran Baru Diterima',
      message: `Pembayaran ${this.formatCurrency(payment.amount)} dari ${payment.jamaah_name}`,
      target_type: this.notificationTargets.ROLE,
      target_id: 'Keuangan',
      data: { payment_id: payment.id, jamaah_id: payment.jamaah_id },
      priority: 'high'
    });
  }

  async notifyPaymentVerified(payment, verifiedBy) {
    // Notify jamaah owner (Marketing who registered them)
    const jamaahResult = await query(
      'SELECT created_by FROM jamaah WHERE id = $1',
      [payment.jamaah_id]
    );

    if (jamaahResult.rows.length > 0) {
      await this.createNotification({
        type: this.notificationTypes.PAYMENT_VERIFIED,
        title: 'Pembayaran Diverifikasi',
        message: `Pembayaran ${payment.jamaah_name} telah diverifikasi`,
        target_type: this.notificationTargets.USER,
        target_id: jamaahResult.rows[0].created_by,
        data: { payment_id: payment.id, jamaah_id: payment.jamaah_id },
        priority: 'normal'
      });
    }
  }

  async notifyDocumentUploaded(document, uploadedBy) {
    return await this.createNotification({
      type: this.notificationTypes.DOCUMENT_UPLOADED,
      title: 'Dokumen Baru Diupload',
      message: `Dokumen ${document.document_type} untuk ${document.jamaah_name}`,
      target_type: this.notificationTargets.ROLE,
      target_id: 'Tim Visa',
      data: { document_id: document.id, jamaah_id: document.jamaah_id },
      priority: 'normal'
    });
  }

  async notifyDocumentVerified(document, verifiedBy) {
    // Notify document uploader
    await this.createNotification({
      type: this.notificationTypes.DOCUMENT_VERIFIED,
      title: 'Dokumen Diverifikasi',
      message: `Dokumen ${document.document_type} untuk ${document.jamaah_name} telah diverifikasi`,
      target_type: this.notificationTargets.USER,
      target_id: document.uploaded_by,
      data: { document_id: document.id, jamaah_id: document.jamaah_id },
      priority: 'normal'
    });
  }

  async notifyPackageFull(packageInfo) {
    return await this.createNotification({
      type: this.notificationTypes.PACKAGE_FULL,
      title: 'Paket Umroh Penuh',
      message: `Paket ${packageInfo.name} telah mencapai kuota maksimal`,
      target_type: this.notificationTargets.ROLE,
      target_id: 'Marketing',
      data: { package_id: packageInfo.id },
      priority: 'high'
    });
  }

  async notifySystemAlert(level, message, data = {}) {
    const target = level === 'critical' ? this.notificationTargets.ALL : this.notificationTargets.ROLE;
    const targetId = level === 'critical' ? null : 'Admin';

    return await this.createNotification({
      type: this.notificationTypes.SYSTEM_ALERT,
      title: `Alert Sistem: ${level.toUpperCase()}`,
      message,
      target_type: target,
      target_id: targetId,
      data,
      priority: level === 'critical' ? 'urgent' : 'high'
    });
  }

  async notifyBulkImportCompleted(importResult, userId) {
    return await this.createNotification({
      type: this.notificationTypes.BULK_IMPORT_COMPLETED,
      title: 'Import Data Selesai',
      message: `Import berhasil: ${importResult.success_count} data, ${importResult.error_count} error`,
      target_type: this.notificationTargets.USER,
      target_id: userId,
      data: importResult,
      priority: 'normal'
    });
  }

  // Utility methods
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const { useSQLite } = require('../config/database');
      const nowQuery = useSQLite ? 'datetime("now")' : 'NOW()';
      
      const result = await query(
        `DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < ${nowQuery}`
      );
      
      if (result.rowCount > 0) {
        logger.info(`Cleaned up ${result.rowCount} expired notifications`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired notifications:', error);
    }
  }

  // Get notification statistics
  async getNotificationStats(timeframe = '24 hours') {
    try {
      const result = await query(`
        SELECT 
          type,
          priority,
          COUNT(*) as count,
          COUNT(CASE WHEN nr.notification_id IS NULL THEN 1 END) as unread_count
        FROM notifications n
        LEFT JOIN notification_reads nr ON n.id = nr.notification_id
        WHERE n.created_at > NOW() - INTERVAL '${timeframe}'
        GROUP BY type, priority
        ORDER BY count DESC
      `);

      return result.rows;
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
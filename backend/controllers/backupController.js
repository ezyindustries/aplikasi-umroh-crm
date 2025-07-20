const backupService = require('../services/backupService');
const { logActivity } = require('../utils/activityLogger');

class BackupController {

  // Create manual backup
  static async createBackup(req, res, next) {
    try {
      const { type = 'full' } = req.body;
      
      if (!['full', 'database', 'files'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid backup type. Must be: full, database, or files'
        });
      }

      const result = await backupService.createManualBackup(req.user.id, type);

      await logActivity(req.user.id, 'backup', 'create', `Manual backup created: ${type}`, req.ip);

      res.json({
        success: true,
        data: result,
        message: `${type} backup created successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  // Get backup history
  static async getHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = await backupService.getBackupHistory(limit);

      await logActivity(req.user.id, 'backup', 'read', 'Viewed backup history', req.ip);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available backup files
  static async getAvailableBackups(req, res, next) {
    try {
      const backups = await backupService.getAvailableBackups();

      await logActivity(req.user.id, 'backup', 'read', 'Viewed available backups', req.ip);

      res.json({
        success: true,
        data: backups
      });
    } catch (error) {
      next(error);
    }
  }

  // Restore database from backup
  static async restoreDatabase(req, res, next) {
    try {
      const { backup_file } = req.body;
      
      if (!backup_file) {
        return res.status(400).json({
          success: false,
          error: 'Backup file is required'
        });
      }

      // Verify file exists in backup directory
      const availableBackups = await backupService.getAvailableBackups();
      const backupFile = availableBackups.find(backup => backup.name === backup_file);
      
      if (!backupFile) {
        return res.status(404).json({
          success: false,
          error: 'Backup file not found'
        });
      }

      if (backupFile.type !== 'database') {
        return res.status(400).json({
          success: false,
          error: 'Selected file is not a database backup'
        });
      }

      await backupService.restoreDatabase(backupFile.path, req.user.id);

      await logActivity(req.user.id, 'backup', 'restore', `Database restored from: ${backup_file}`, req.ip);

      res.json({
        success: true,
        message: 'Database restored successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get backup statistics
  static async getStatistics(req, res, next) {
    try {
      const stats = await backupService.getBackupStatistics();
      const history = await backupService.getBackupHistory(10);
      
      // Calculate additional statistics
      const successfulBackups = history.filter(b => b.status === 'completed').length;
      const failedBackups = history.filter(b => b.status === 'failed').length;
      const lastBackup = history.length > 0 ? history[0] : null;

      const statistics = {
        ...stats,
        successfulBackups,
        failedBackups,
        totalBackups: successfulBackups + failedBackups,
        lastBackup,
        successRate: successfulBackups + failedBackups > 0 
          ? Math.round((successfulBackups / (successfulBackups + failedBackups)) * 100) 
          : 0
      };

      await logActivity(req.user.id, 'backup', 'read', 'Viewed backup statistics', req.ip);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  // Download backup file
  static async downloadBackup(req, res, next) {
    try {
      const { filename } = req.params;
      
      // Verify file exists in backup directory
      const availableBackups = await backupService.getAvailableBackups();
      const backupFile = availableBackups.find(backup => backup.name === filename);
      
      if (!backupFile) {
        return res.status(404).json({
          success: false,
          error: 'Backup file not found'
        });
      }

      await logActivity(req.user.id, 'backup', 'download', `Downloaded backup: ${filename}`, req.ip);

      res.download(backupFile.path, filename);
    } catch (error) {
      next(error);
    }
  }

  // Delete backup file
  static async deleteBackup(req, res, next) {
    try {
      const { filename } = req.params;
      
      // Verify file exists in backup directory
      const availableBackups = await backupService.getAvailableBackups();
      const backupFile = availableBackups.find(backup => backup.name === filename);
      
      if (!backupFile) {
        return res.status(404).json({
          success: false,
          error: 'Backup file not found'
        });
      }

      const fs = require('fs').promises;
      await fs.unlink(backupFile.path);

      await logActivity(req.user.id, 'backup', 'delete', `Deleted backup: ${filename}`, req.ip);

      res.json({
        success: true,
        message: 'Backup file deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Test backup system
  static async testBackup(req, res, next) {
    try {
      const testResults = [];

      // Test database connection
      try {
        await backupService.createDatabaseBackup();
        testResults.push({ test: 'database_backup', status: 'success', message: 'Database backup test successful' });
      } catch (error) {
        testResults.push({ test: 'database_backup', status: 'failed', message: error.message });
      }

      // Test files backup
      try {
        await backupService.createFilesBackup();
        testResults.push({ test: 'files_backup', status: 'success', message: 'Files backup test successful' });
      } catch (error) {
        testResults.push({ test: 'files_backup', status: 'failed', message: error.message });
      }

      // Test cleanup
      try {
        await backupService.cleanupOldBackups();
        testResults.push({ test: 'cleanup', status: 'success', message: 'Cleanup test successful' });
      } catch (error) {
        testResults.push({ test: 'cleanup', status: 'failed', message: error.message });
      }

      const overallStatus = testResults.every(result => result.status === 'success') ? 'success' : 'partial';

      await logActivity(req.user.id, 'backup', 'test', `Backup system test completed: ${overallStatus}`, req.ip);

      res.json({
        success: true,
        data: {
          status: overallStatus,
          tests: testResults
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BackupController;
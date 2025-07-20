const express = require('express');
const BackupController = require('../controllers/backupController');
const { authenticate, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get backup statistics
router.get('/statistics', 
  checkPermission('backup', 'read'),
  BackupController.getStatistics
);

// Get backup history
router.get('/history', 
  checkPermission('backup', 'read'),
  BackupController.getHistory
);

// Get available backup files
router.get('/files', 
  checkPermission('backup', 'read'),
  BackupController.getAvailableBackups
);

// Test backup system
router.post('/test', 
  checkPermission('backup', 'create'),
  BackupController.testBackup
);

// Create manual backup
router.post('/create', 
  checkPermission('backup', 'create'),
  BackupController.createBackup
);

// Restore database from backup
router.post('/restore', 
  checkPermission('backup', 'restore'),
  BackupController.restoreDatabase
);

// Download backup file
router.get('/download/:filename', 
  checkPermission('backup', 'read'),
  BackupController.downloadBackup
);

// Delete backup file
router.delete('/files/:filename', 
  checkPermission('backup', 'delete'),
  BackupController.deleteBackup
);

module.exports = router;
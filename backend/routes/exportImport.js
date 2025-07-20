const express = require('express');
const ExportImportController = require('../controllers/exportImportController');
const { authenticate, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Template generation routes
router.get('/templates/jamaah', 
  checkPermission('export', 'read'),
  ExportImportController.generateJamaahTemplate
);

router.get('/templates/payments', 
  checkPermission('export', 'read'),
  ExportImportController.generatePaymentTemplate
);

// Export routes
router.get('/export/jamaah', 
  checkPermission('export', 'read'),
  ExportImportController.exportJamaah
);

router.get('/export/payments', 
  checkPermission('export', 'read'),
  ExportImportController.exportPayments
);

router.get('/export/packages', 
  checkPermission('export', 'read'),
  ExportImportController.exportPackages
);

router.get('/export/groups', 
  checkPermission('export', 'read'),
  ExportImportController.exportGroups
);

// Batch export
router.post('/export/batch', 
  checkPermission('export', 'read'),
  ExportImportController.batchExport
);

// Import routes
router.post('/import/jamaah', 
  checkPermission('import', 'create'),
  ExportImportController.uploadFile,
  ExportImportController.importJamaah
);

// Statistics and management
router.get('/statistics', 
  checkPermission('export', 'read'),
  ExportImportController.getStatistics
);

router.get('/history', 
  checkPermission('export', 'read'),
  ExportImportController.getHistory
);

router.post('/cleanup', 
  checkPermission('export', 'delete'),
  ExportImportController.cleanupOldExports
);

module.exports = router;
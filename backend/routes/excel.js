const express = require('express');
const ExcelController = require('../controllers/excelController');
const { authenticate, checkPermission } = require('../middleware/auth');
const { excelUpload, handleMulterError } = require('../middleware/upload');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Download template for import
router.get('/template/jamaah', 
  checkPermission('jamaah', 'create'),
  ExcelController.downloadTemplate
);

// Import jamaah from Excel
router.post('/import/jamaah', 
  checkPermission('jamaah', 'create'),
  excelUpload.single('file'),
  handleMulterError,
  ExcelController.importJamaah
);

// Export jamaah to Excel
router.get('/export/jamaah', 
  checkPermission('jamaah', 'read'),
  ExcelController.exportJamaah
);

module.exports = router;
const express = require('express');
const DocumentController = require('../controllers/documentController');
const { authenticate, checkPermission } = require('../middleware/auth');
const { documentUpload, handleMulterError } = require('../middleware/upload');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get document statistics
router.get('/statistics', 
  checkPermission('documents', 'read'),
  DocumentController.getStatistics
);

// Get unverified documents
router.get('/unverified', 
  checkPermission('documents', 'read'),
  DocumentController.getUnverified
);

// Get documents by type
router.get('/type/:type', 
  checkPermission('documents', 'read'),
  DocumentController.getByType
);

// Get documents by jamaah ID
router.get('/jamaah/:jamaah_id', 
  checkPermission('documents', 'read'),
  DocumentController.getByJamaah
);

// Get all documents with filters
router.get('/', 
  checkPermission('documents', 'read'),
  DocumentController.getAll
);

// Get document by ID
router.get('/:id', 
  checkPermission('documents', 'read'),
  DocumentController.getById
);

// Get file info
router.get('/:id/info', 
  checkPermission('documents', 'read'),
  DocumentController.getFileInfo
);

// View document file (inline)
router.get('/:id/view', 
  checkPermission('documents', 'read'),
  DocumentController.viewFile
);

// Download document file
router.get('/:id/download', 
  checkPermission('documents', 'read'),
  DocumentController.downloadFile
);

// Upload document
router.post('/upload', 
  checkPermission('documents', 'create'),
  documentUpload.single('file'),
  handleMulterError,
  DocumentController.upload
);

// Verify document
router.patch('/:id/verify', 
  checkPermission('documents', 'update'),
  DocumentController.verify
);

// Bulk verify documents
router.patch('/bulk-verify', 
  checkPermission('documents', 'update'),
  DocumentController.bulkVerify
);

// Delete document
router.delete('/:id', 
  checkPermission('documents', 'delete'),
  DocumentController.delete
);

module.exports = router;
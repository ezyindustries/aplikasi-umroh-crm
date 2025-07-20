const express = require('express');
const JamaahController = require('../controllers/jamaahController');
const { authenticate, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get jamaah statistics
router.get('/statistics', 
  checkPermission('jamaah', 'read'),
  JamaahController.getStatistics
);

// Check NIK availability
router.get('/check-nik/:nik', 
  checkPermission('jamaah', 'read'),
  JamaahController.checkNik
);

// Check passport availability
router.get('/check-passport/:passport_number', 
  checkPermission('jamaah', 'read'),
  JamaahController.checkPassport
);

// Get all jamaah with filters and pagination
router.get('/', 
  checkPermission('jamaah', 'read'),
  JamaahController.getAll
);

// Get jamaah by ID
router.get('/:id', 
  checkPermission('jamaah', 'read'),
  JamaahController.getById
);

// Create new jamaah
router.post('/', 
  checkPermission('jamaah', 'create'),
  JamaahController.create
);

// Update jamaah
router.put('/:id', 
  checkPermission('jamaah', 'update'),
  JamaahController.update
);

// Update jamaah status
router.patch('/:id/status', 
  checkPermission('jamaah', 'update'),
  JamaahController.updateStatus
);

// Bulk update jamaah
router.patch('/bulk-update', 
  checkPermission('jamaah', 'update'),
  JamaahController.bulkUpdate
);

// Delete jamaah (soft delete)
router.delete('/:id', 
  checkPermission('jamaah', 'delete'),
  JamaahController.delete
);

module.exports = router;
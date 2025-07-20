const express = require('express');
const PackageController = require('../controllers/packageController');
const { authenticate, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get package statistics
router.get('/statistics', 
  checkPermission('packages', 'read'),
  PackageController.getStatistics
);

// Get available packages
router.get('/available', 
  checkPermission('packages', 'read'),
  PackageController.getAvailable
);

// Get popular packages
router.get('/popular', 
  checkPermission('packages', 'read'),
  PackageController.getPopular
);

// Get occupancy report
router.get('/occupancy-report', 
  checkPermission('packages', 'read'),
  PackageController.getOccupancyReport
);

// Get packages by date range
router.get('/date-range', 
  checkPermission('packages', 'read'),
  PackageController.getByDateRange
);

// Get all packages with filters
router.get('/', 
  checkPermission('packages', 'read'),
  PackageController.getAll
);

// Get package by ID
router.get('/:id', 
  checkPermission('packages', 'read'),
  PackageController.getById
);

// Get package with jamaah details
router.get('/:id/jamaah', 
  checkPermission('packages', 'read'),
  PackageController.getWithJamaah
);

// Check package capacity
router.get('/:id/capacity', 
  checkPermission('packages', 'read'),
  PackageController.checkCapacity
);

// Create new package
router.post('/', 
  checkPermission('packages', 'create'),
  PackageController.create
);

// Duplicate package
router.post('/:id/duplicate', 
  checkPermission('packages', 'create'),
  PackageController.duplicate
);

// Update package
router.put('/:id', 
  checkPermission('packages', 'update'),
  PackageController.update
);

// Toggle package status (activate/deactivate)
router.patch('/:id/toggle-status', 
  checkPermission('packages', 'update'),
  PackageController.toggleStatus
);

// Update package capacity (recalculate from jamaah count)
router.patch('/:id/update-capacity', 
  checkPermission('packages', 'update'),
  PackageController.updateCapacity
);

// Delete package
router.delete('/:id', 
  checkPermission('packages', 'delete'),
  PackageController.delete
);

module.exports = router;
const express = require('express');
const GroupController = require('../controllers/groupController');
const { authenticate, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get group statistics
router.get('/statistics', 
  checkPermission('groups', 'read'),
  GroupController.getStatistics
);

// Get available jamaah for group assignment
router.get('/available-jamaah', 
  checkPermission('groups', 'read'),
  GroupController.getAvailableJamaah
);

// Auto-assign jamaah to groups
router.post('/auto-assign', 
  checkPermission('groups', 'create'),
  GroupController.autoAssignJamaah
);

// Generate manifest for group
router.get('/:id/manifest', 
  checkPermission('groups', 'read'),
  GroupController.generateManifest
);

// Group member management
router.post('/:groupId/members', 
  checkPermission('groups', 'update'),
  GroupController.addMember
);

router.delete('/:groupId/members/:jamaahId', 
  checkPermission('groups', 'update'),
  GroupController.removeMember
);

router.put('/:groupId/members/:jamaahId', 
  checkPermission('groups', 'update'),
  GroupController.updateMember
);

router.post('/:groupId/members/bulk', 
  checkPermission('groups', 'update'),
  GroupController.bulkAddMembers
);

// Get all groups with filters
router.get('/', 
  checkPermission('groups', 'read'),
  GroupController.getAll
);

// Get group by ID
router.get('/:id', 
  checkPermission('groups', 'read'),
  GroupController.getById
);

// Create new group
router.post('/', 
  checkPermission('groups', 'create'),
  GroupController.create
);

// Update group
router.put('/:id', 
  checkPermission('groups', 'update'),
  GroupController.update
);

// Delete group
router.delete('/:id', 
  checkPermission('groups', 'delete'),
  GroupController.delete
);

module.exports = router;
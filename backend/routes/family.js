const express = require('express');
const FamilyController = require('../controllers/familyController');
const { authenticate, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get family relation statistics
router.get('/statistics', 
  checkPermission('jamaah', 'read'),
  FamilyController.getStatistics
);

// Get relation types list
router.get('/relation-types', 
  checkPermission('jamaah', 'read'),
  FamilyController.getRelationTypes
);

// Get jamaah without family relations
router.get('/without-family', 
  checkPermission('jamaah', 'read'),
  FamilyController.getJamaahWithoutFamily
);

// Get families (groups)
router.get('/families', 
  checkPermission('jamaah', 'read'),
  FamilyController.getFamilies
);

// Get family relations by jamaah ID
router.get('/jamaah/:jamaah_id', 
  checkPermission('jamaah', 'read'),
  FamilyController.getByJamaah
);

// Get family tree for jamaah
router.get('/jamaah/:jamaah_id/tree', 
  checkPermission('jamaah', 'read'),
  FamilyController.getFamilyTree
);

// Get mahram relations for jamaah
router.get('/jamaah/:jamaah_id/mahram', 
  checkPermission('jamaah', 'read'),
  FamilyController.getMahramRelations
);

// Check if two jamaah are mahram
router.get('/check-mahram/:jamaah_id1/:jamaah_id2', 
  checkPermission('jamaah', 'read'),
  FamilyController.checkMahram
);

// Get all family relations with filters
router.get('/', 
  checkPermission('jamaah', 'read'),
  FamilyController.getAll
);

// Get family relation by ID
router.get('/:id', 
  checkPermission('jamaah', 'read'),
  FamilyController.getById
);

// Create new family relation
router.post('/', 
  checkPermission('jamaah', 'update'),
  FamilyController.create
);

// Bulk create family relations
router.post('/bulk-create', 
  checkPermission('jamaah', 'update'),
  FamilyController.bulkCreate
);

// Validate mahram for group travel
router.post('/validate-group-mahram', 
  checkPermission('jamaah', 'read'),
  FamilyController.validateGroupMahram
);

// Update family relation
router.put('/:id', 
  checkPermission('jamaah', 'update'),
  FamilyController.update
);

// Delete family relation
router.delete('/:id', 
  checkPermission('jamaah', 'update'),
  FamilyController.delete
);

module.exports = router;
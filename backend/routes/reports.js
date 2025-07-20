const express = require('express');
const ReportController = require('../controllers/reportController');
const { authenticate, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get dashboard summary
router.get('/dashboard', 
  checkPermission('reports', 'read'),
  ReportController.getDashboard
);

// Get jamaah analysis report
router.get('/jamaah-analysis', 
  checkPermission('reports', 'read'),
  ReportController.getJamaahAnalysis
);

// Get financial report
router.get('/financial', 
  checkPermission('reports', 'read'),
  ReportController.getFinancialReport
);

// Get package performance report
router.get('/packages', 
  checkPermission('reports', 'read'),
  ReportController.getPackageReport
);

// Get visa status report
router.get('/visa', 
  checkPermission('reports', 'read'),
  ReportController.getVisaReport
);

// Get custom report
router.get('/custom', 
  checkPermission('reports', 'read'),
  ReportController.getCustomReport
);

// Export jamaah data to Excel
router.get('/export/jamaah', 
  checkPermission('reports', 'read'),
  ReportController.exportJamaah
);

module.exports = router;
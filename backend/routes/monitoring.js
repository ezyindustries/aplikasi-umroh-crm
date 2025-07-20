const express = require('express');
const MonitoringController = require('../controllers/monitoringController');
const { authenticate, checkPermission, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Simple health check (no auth required for load balancers)
router.get('/health', MonitoringController.simpleHealthCheck);

// Detailed health check (auth required)
router.get('/health/detailed', 
  authenticate,
  checkPermission('monitoring', 'read'),
  MonitoringController.getHealth
);

// System metrics
router.get('/metrics', 
  authenticate,
  checkPermission('monitoring', 'read'),
  MonitoringController.getMetrics
);

// Historical metrics
router.get('/metrics/historical', 
  authenticate,
  checkPermission('monitoring', 'read'),
  MonitoringController.getHistoricalMetrics
);

// System information
router.get('/system', 
  authenticate,
  checkPermission('monitoring', 'read'),
  MonitoringController.getSystemInfo
);

// Database status
router.get('/database', 
  authenticate,
  checkPermission('monitoring', 'read'),
  MonitoringController.getDatabaseStatus
);

// System diagnostics
router.post('/diagnostics', 
  authenticate,
  checkPermission('monitoring', 'read'),
  MonitoringController.runDiagnostics
);

// Application logs
router.get('/logs', 
  authenticate,
  checkPermission('monitoring', 'read'),
  MonitoringController.getLogs
);

// Update monitoring thresholds
router.put('/thresholds', 
  authenticate,
  checkPermission('monitoring', 'update'),
  MonitoringController.updateThresholds
);

module.exports = router;
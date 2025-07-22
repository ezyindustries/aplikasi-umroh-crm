const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const jamaahRoutes = require('./jamaah');
const packageRoutes = require('./packages');
const groupRoutes = require('./groups');
const paymentRoutes = require('./payments');
const financeRoutes = require('./finance');
const marketingRoutes = require('./marketing');
const automationRoutes = require('./automation');
const documentRoutes = require('./documents');
const dashboardRoutes = require('./dashboard');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Vauza Tamma Management System API',
    version: '1.0.0'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Vauza Tamma Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      jamaah: '/api/jamaah',
      packages: '/api/packages',
      groups: '/api/groups',
      payments: '/api/payments',
      finance: '/api/finance',
      marketing: '/api/marketing',
      automation: '/api/automation',
      documents: '/api/documents',
      dashboard: '/api/dashboard'
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/jamaah', jamaahRoutes);
router.use('/packages', packageRoutes);
router.use('/groups', groupRoutes);
router.use('/payments', paymentRoutes);
router.use('/finance', financeRoutes);
router.use('/marketing', marketingRoutes);
router.use('/automation', automationRoutes);
router.use('/documents', documentRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
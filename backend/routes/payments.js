const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authenticate, checkPermission } = require('../middleware/auth');
const { documentUpload, handleMulterError } = require('../middleware/upload');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get payment statistics
router.get('/statistics', 
  checkPermission('payments', 'read'),
  PaymentController.getStatistics
);

// Get unverified payments
router.get('/unverified', 
  checkPermission('payments', 'read'),
  PaymentController.getUnverified
);

// Get payment methods statistics
router.get('/methods/stats', 
  checkPermission('payments', 'read'),
  PaymentController.getMethodStats
);

// Get daily payment report
router.get('/daily-report', 
  checkPermission('payments', 'read'),
  PaymentController.getDailyReport
);

// Get payments by jamaah ID
router.get('/jamaah/:jamaah_id', 
  checkPermission('payments', 'read'),
  PaymentController.getByJamaah
);

// Get all payments with filters
router.get('/', 
  checkPermission('payments', 'read'),
  PaymentController.getAll
);

// Get payment by ID
router.get('/:id', 
  checkPermission('payments', 'read'),
  PaymentController.getById
);

// Create new payment
router.post('/', 
  checkPermission('payments', 'create'),
  PaymentController.create
);

// Upload payment receipt
router.post('/:id/receipt', 
  checkPermission('payments', 'update'),
  documentUpload.single('receipt'),
  handleMulterError,
  PaymentController.uploadReceipt
);

// Update payment
router.put('/:id', 
  checkPermission('payments', 'update'),
  PaymentController.update
);

// Verify payment
router.patch('/:id/verify', 
  checkPermission('payments', 'update'),
  PaymentController.verify
);

// Bulk verify payments
router.patch('/bulk-verify', 
  checkPermission('payments', 'update'),
  PaymentController.bulkVerify
);

// Delete payment
router.delete('/:id', 
  checkPermission('payments', 'delete'),
  PaymentController.delete
);

module.exports = router;
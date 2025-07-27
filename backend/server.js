const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./models');
const { setupLogging } = require('./config/logging');
const securityConfig = require('./config/security');
const performanceService = require('./services/performanceService');
const monitoringService = require('./services/monitoringService');
const websocketService = require('./services/websocketService');
const notificationService = require('./services/notificationService');
const { errorHandler } = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/auditLogger');
const { 
  helmetConfig, 
  securityHeaders, 
  validateRequest, 
  sanitizeInput 
} = require('./middleware/securityMiddleware');
const {
  requestTimer,
  optimizeDatabase,
  memoryMonitor,
  optimizeQueryParams,
  collectMetrics
} = require('./middleware/performanceMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const jamaahRoutes = require('./routes/jamaah');
const packageRoutes = require('./routes/packages');
const paymentRoutes = require('./routes/payments');
const documentRoutes = require('./routes/documents');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const excelRoutes = require('./routes/excel');
const familyRoutes = require('./routes/family');
const groupRoutes = require('./routes/groups');
const backupRoutes = require('./routes/backup');
const exportImportRoutes = require('./routes/exportImport');
const monitoringRoutes = require('./routes/monitoring');
const metricsRoutes = require('./routes/metrics');
const docsRoutes = require('./routes/docs');
const brosurRoutes = require('./routes/brosur');
const notificationsRoutes = require('./routes/notifications');
const crmRoutes = require('./routes/crm');

const app = express();
const server = http.createServer(app);

// Setup logging
const logger = setupLogging();

// Validate environment variables for security
try {
  securityConfig.validateEnvironment();
} catch (error) {
  logger.error('Security validation failed:', error.message);
  process.exit(1);
}

// Enhanced security middleware
app.use(helmetConfig);
app.use(securityHeaders);
app.use(compression());

// Trust proxy for production deployments
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Request validation and sanitization
app.use(validateRequest);
app.use(sanitizeInput);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Enhanced CORS configuration
app.use(cors(securityConfig.getCorsConfig()));

// Performance optimization middleware
app.use(requestTimer);
app.use(memoryMonitor);
app.use(optimizeQueryParams);
app.use(collectMetrics);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database optimization middleware
app.use(optimizeDatabase);

// Audit logging middleware
app.use(auditLogger);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/jamaah', jamaahRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/data', exportImportRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/brosur', brosurRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/crm', crmRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// Initialize database and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Initialize performance service
    await performanceService.initialize();
    logger.info('Performance service initialized');
    
    // Initialize WebSocket service
    websocketService.initialize(server);
    logger.info('WebSocket service initialized');
    
    // Make websocket accessible for CRM
    app.locals.io = websocketService.io;
    
    // Cleanup expired notifications on startup
    await notificationService.cleanupExpiredNotifications();
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`WebSocket server ready for real-time connections`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await performanceService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await performanceService.shutdown();
  process.exit(0);
});

startServer();

module.exports = app;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIO = require('socket.io');

// Import configurations and utilities
const { initDatabase } = require('./src/models');
const logger = require('./src/utils/logger');
const apiRoutes = require('./src/routes/api');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Using WhatsAppWebService (WAHA-compatible implementation)

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.IO for real-time updates
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:8000', 'file://', 'null', '*'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6
});

// Make io globally accessible
global.io = io;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (file://, mobile apps, etc)
    if (!origin) return callback(null, true);
    
    // Allow all origins for development
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'Content-Type']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.api.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WhatsApp CRM Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Import webhook routes
const webhookRoutes = require('./src/routes/webhooks');

// Webhook routes (must be before main API routes for proper routing)
app.use('/api/webhooks', webhookRoutes);

// Media-specific CORS middleware
app.use('/api/messages/media', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
});

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected:', {
    id: socket.id,
    transport: socket.conn.transport.name,
    query: socket.handshake.query,
    headers: socket.handshake.headers.origin
  });

  // Send connection acknowledgment
  socket.emit('connect:success', {
    id: socket.id,
    transport: socket.conn.transport.name
  });

  // Join room based on session
  socket.on('join:session', (sessionId) => {
    socket.join(`session:${sessionId}`);
    logger.info(`Socket ${socket.id} joined session:${sessionId}`);
    socket.emit('join:session:success', { sessionId });
  });

  // Join conversation room
  socket.on('join:conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    logger.info(`Socket ${socket.id} joined conversation:${conversationId}`);
    socket.emit('join:conversation:success', { conversationId });
  });

  // Leave conversation room
  socket.on('leave:conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    logger.info(`Socket ${socket.id} left conversation:${conversationId}`);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    logger.info('Client disconnected:', {
      id: socket.id,
      reason: reason
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error('Socket error:', {
      id: socket.id,
      error: error.message
    });
  });
});

// Emit events for real-time updates
const emitMessageUpdate = (conversationId, message) => {
  io.to(`conversation:${conversationId}`).emit('message:new', message);
};

const emitStatusUpdate = (conversationId, status) => {
  io.to(`conversation:${conversationId}`).emit('message:status', status);
};

const emitConversationUpdate = (conversationId, update) => {
  io.emit('conversation:update', { conversationId, ...update });
};

// Export emit functions for use in controllers
global.emitMessageUpdate = emitMessageUpdate;
global.emitStatusUpdate = emitStatusUpdate;
global.emitConversationUpdate = emitConversationUpdate;

// Start server
const PORT = process.env.PORT || 3001;

// Import and initialize message poller as fallback
const MessagePoller = require('./src/services/MessagePoller');
const messagePoller = new MessagePoller();

// Import session manager for persistent sessions
const sessionManager = require('./src/services/SessionManager');

const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized successfully');

    // Start server
    server.listen(PORT, async () => {
      logger.info(`WhatsApp CRM Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`WAHA URL: ${process.env.WAHA_BASE_URL}`);
      logger.info(`Webhook endpoint: http://localhost:${PORT}/api/webhooks/waha`);
      
      // Try to restore session automatically
      logger.info('🔄 Attempting to restore WhatsApp session...');
      const sessionRestored = await sessionManager.startSessionWithRestore('default');
      
      if (sessionRestored) {
        logger.info('✅ WhatsApp session restored successfully - No QR scan needed!');
      } else {
        logger.warn('⚠️ Could not restore session - QR scan may be required');
        logger.info('📱 Access http://localhost:3000/dashboard to scan QR code');
      }
      
      // Start message polling as fallback
      logger.info('Starting message polling as webhook fallback...');
      messagePoller.startPolling('default');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  messagePoller.stopPolling();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
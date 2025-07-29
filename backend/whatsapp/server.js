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
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
  }
});

// Make io globally accessible
global.io = io;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
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

// Webhook routes (must be before main API routes for proper routing)
const webhookRoutes = require('./src/routes/webhooks');
app.use('/api/webhooks', webhookRoutes);

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  // Join room based on session
  socket.on('join:session', (sessionId) => {
    socket.join(`session:${sessionId}`);
    logger.info(`Socket ${socket.id} joined session:${sessionId}`);
  });

  // Join conversation room
  socket.on('join:conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    logger.info(`Socket ${socket.id} joined conversation:${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave:conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    logger.info(`Socket ${socket.id} left conversation:${conversationId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
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

const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized successfully');

    // Start server
    server.listen(PORT, () => {
      logger.info(`WhatsApp CRM Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`WAHA URL: ${process.env.WAHA_BASE_URL}`);
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
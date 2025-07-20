const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { setupLogging } = require('../config/logging');
const logger = setupLogging();

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userInfo
    this.rooms = new Map(); // roomName -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details from database
        const userResult = await query(
          'SELECT id, username, full_name, role FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.user = userResult.rows[0];
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket service initialized');
  }

  handleConnection(socket) {
    const user = socket.user;
    
    // Store user connection
    this.connectedUsers.set(user.id, socket.id);
    this.userSockets.set(socket.id, user);

    // Join user to their role-based room
    socket.join(`role_${user.role}`);
    socket.join(`user_${user.id}`);

    logger.info(`User connected: ${user.full_name} (${user.role}) - Socket: ${socket.id}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Terhubung ke server real-time',
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role
      },
      timestamp: new Date().toISOString()
    });

    // Broadcast user online status to admins
    this.broadcastToRole('Admin', 'user_status', {
      type: 'user_online',
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role
      },
      timestamp: new Date().toISOString()
    });

    // Handle custom events
    this.setupEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  setupEventHandlers(socket) {
    const user = socket.user;

    // Join specific rooms
    socket.on('join_room', (roomName) => {
      socket.join(roomName);
      
      if (!this.rooms.has(roomName)) {
        this.rooms.set(roomName, new Set());
      }
      this.rooms.get(roomName).add(socket.id);
      
      socket.emit('joined_room', { room: roomName });
      logger.info(`User ${user.full_name} joined room: ${roomName}`);
    });

    // Leave specific rooms
    socket.on('leave_room', (roomName) => {
      socket.leave(roomName);
      
      if (this.rooms.has(roomName)) {
        this.rooms.get(roomName).delete(socket.id);
        if (this.rooms.get(roomName).size === 0) {
          this.rooms.delete(roomName);
        }
      }
      
      socket.emit('left_room', { room: roomName });
    });

    // Handle typing indicators for chat
    socket.on('typing_start', (data) => {
      socket.to(data.room || `role_${user.role}`).emit('user_typing', {
        user: user.full_name,
        room: data.room
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.room || `role_${user.role}`).emit('user_stop_typing', {
        user: user.full_name,
        room: data.room
      });
    });

    // Handle ping/pong for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  }

  handleDisconnection(socket) {
    const user = this.userSockets.get(socket.id);
    
    if (user) {
      this.connectedUsers.delete(user.id);
      this.userSockets.delete(socket.id);

      // Remove from all rooms
      for (const [roomName, socketIds] of this.rooms.entries()) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          this.rooms.delete(roomName);
        }
      }

      logger.info(`User disconnected: ${user.full_name} - Socket: ${socket.id}`);

      // Broadcast user offline status to admins
      this.broadcastToRole('Admin', 'user_status', {
        type: 'user_offline',
        user: {
          id: user.id,
          name: user.full_name,
          role: user.role
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Notification methods
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: notification.created_at || new Date().toISOString(),
        read: false
      });
      
      logger.info(`Notification sent to user ${userId}: ${notification.title}`);
      return true;
    }
    return false;
  }

  broadcastToRole(role, event, data) {
    if (this.io) {
      this.io.to(`role_${role}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Broadcast to role ${role}: ${event}`);
    }
  }

  broadcastToRoom(roomName, event, data) {
    if (this.io) {
      this.io.to(roomName).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastToAll(event, data) {
    if (this.io) {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Activity broadcasting methods
  broadcastJamaahActivity(action, jamaah, user) {
    const activityData = {
      type: 'jamaah_activity',
      action, // 'created', 'updated', 'deleted'
      jamaah: {
        id: jamaah.id,
        name: jamaah.full_name,
        nik: jamaah.nik
      },
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role
      }
    };

    // Broadcast to all relevant roles
    this.broadcastToRole('Admin', 'activity_update', activityData);
    this.broadcastToRole('Marketing', 'activity_update', activityData);
    this.broadcastToRole('Tim Visa', 'activity_update', activityData);
  }

  broadcastPaymentActivity(action, payment, user) {
    const activityData = {
      type: 'payment_activity',
      action, // 'recorded', 'verified', 'rejected'
      payment: {
        id: payment.id,
        amount: payment.amount,
        jamaah_name: payment.jamaah_name,
        reference_number: payment.reference_number
      },
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role
      }
    };

    // Broadcast to finance and admin
    this.broadcastToRole('Admin', 'activity_update', activityData);
    this.broadcastToRole('Keuangan', 'activity_update', activityData);
    this.broadcastToRole('Marketing', 'activity_update', activityData);
  }

  broadcastDocumentActivity(action, document, user) {
    const activityData = {
      type: 'document_activity',
      action, // 'uploaded', 'verified', 'rejected'
      document: {
        id: document.id,
        type: document.document_type,
        jamaah_name: document.jamaah_name,
        file_name: document.file_name
      },
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role
      }
    };

    // Broadcast to relevant roles
    this.broadcastToRole('Admin', 'activity_update', activityData);
    this.broadcastToRole('Marketing', 'activity_update', activityData);
    this.broadcastToRole('Tim Visa', 'activity_update', activityData);
  }

  // System alerts
  broadcastSystemAlert(level, message, data = {}) {
    const alertData = {
      type: 'system_alert',
      level, // 'info', 'warning', 'error', 'critical'
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (level === 'critical') {
      this.broadcastToAll('system_alert', alertData);
    } else {
      this.broadcastToRole('Admin', 'system_alert', alertData);
    }
  }

  // Real-time statistics updates
  broadcastStatsUpdate(statsType, stats) {
    this.broadcastToRole('Admin', 'stats_update', {
      type: statsType,
      stats,
      timestamp: new Date().toISOString()
    });

    this.broadcastToRole('Marketing', 'stats_update', {
      type: statsType,
      stats,
      timestamp: new Date().toISOString()
    });
  }

  // Get connected users info
  getConnectedUsers() {
    const users = [];
    for (const [socketId, user] of this.userSockets.entries()) {
      users.push({
        socketId,
        userId: user.id,
        name: user.full_name,
        role: user.role,
        connectedAt: new Date().toISOString() // Would need to track this properly
      });
    }
    return users;
  }

  // Get room information
  getRoomInfo(roomName) {
    const socketIds = this.rooms.get(roomName);
    if (!socketIds) return null;

    const users = [];
    for (const socketId of socketIds) {
      const user = this.userSockets.get(socketId);
      if (user) {
        users.push({
          userId: user.id,
          name: user.full_name,
          role: user.role
        });
      }
    }

    return {
      roomName,
      userCount: users.length,
      users
    };
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Send direct message between users
  sendDirectMessage(fromUserId, toUserId, message) {
    const toSocketId = this.connectedUsers.get(toUserId);
    const fromUser = this.userSockets.get(this.connectedUsers.get(fromUserId));
    
    if (toSocketId && fromUser && this.io) {
      this.io.to(toSocketId).emit('direct_message', {
        from: {
          id: fromUser.id,
          name: fromUser.full_name,
          role: fromUser.role
        },
        message,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }
}

// Export singleton instance
module.exports = new WebSocketService();
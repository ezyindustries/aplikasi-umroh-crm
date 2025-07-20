// Integration tests for WebSocket functionality
const { io: Client } = require('socket.io-client');
const http = require('http');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup');
const app = require('../../server');
const websocketService = require('../../services/websocketService');

describe('WebSocket Integration', () => {
  let server;
  let clientSocket;
  let serverPort;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create HTTP server
    server = http.createServer(app);
    
    // Initialize WebSocket service
    websocketService.initialize(server);
    
    // Start server on random port
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    if (server) {
      server.close();
    }
  });

  beforeEach((done) => {
    // Create client connection
    clientSocket = new Client(`http://localhost:${serverPort}`, {
      auth: {
        token: 'test-jwt-token' // Mock token for testing
      }
    });

    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Management', () => {
    test('should connect with valid token', (done) => {
      const testClient = new Client(`http://localhost:${serverPort}`, {
        auth: {
          token: 'valid-test-token'
        }
      });

      testClient.on('connect', () => {
        expect(testClient.connected).toBe(true);
        testClient.disconnect();
        done();
      });

      testClient.on('connect_error', (error) => {
        done(error);
      });
    });

    test('should receive welcome message on connection', (done) => {
      clientSocket.on('connected', (data) => {
        expect(data.message).toBeDefined();
        expect(data.user).toBeDefined();
        done();
      });
    });

    test('should handle disconnection gracefully', (done) => {
      clientSocket.on('disconnect', (reason) => {
        expect(reason).toBeDefined();
        done();
      });

      clientSocket.disconnect();
    });
  });

  describe('Room Management', () => {
    test('should join room successfully', (done) => {
      clientSocket.emit('join_room', 'test-room');
      
      clientSocket.on('room_joined', (data) => {
        expect(data.room).toBe('test-room');
        expect(data.success).toBe(true);
        done();
      });
    });

    test('should leave room successfully', (done) => {
      // First join a room
      clientSocket.emit('join_room', 'test-room');
      
      clientSocket.on('room_joined', () => {
        // Then leave the room
        clientSocket.emit('leave_room', 'test-room');
      });

      clientSocket.on('room_left', (data) => {
        expect(data.room).toBe('test-room');
        expect(data.success).toBe(true);
        done();
      });
    });
  });

  describe('Notification Broadcasting', () => {
    test('should receive notification broadcast', (done) => {
      const testNotification = {
        id: 'test-notification-1',
        type: 'jamaah_registered',
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { test: true }
      };

      clientSocket.on('notification', (notification) => {
        expect(notification.id).toBe(testNotification.id);
        expect(notification.type).toBe(testNotification.type);
        expect(notification.title).toBe(testNotification.title);
        expect(notification.message).toBe(testNotification.message);
        done();
      });

      // Simulate server broadcasting notification
      setTimeout(() => {
        websocketService.broadcastNotification(testNotification);
      }, 100);
    });

    test('should receive activity updates', (done) => {
      const testActivity = {
        id: 'activity-1',
        type: 'jamaah_created',
        user: 'Test User',
        details: 'Created new jamaah',
        timestamp: new Date().toISOString()
      };

      clientSocket.on('activity_update', (activity) => {
        expect(activity.id).toBe(testActivity.id);
        expect(activity.type).toBe(testActivity.type);
        expect(activity.user).toBe(testActivity.user);
        done();
      });

      // Simulate server broadcasting activity
      setTimeout(() => {
        websocketService.broadcastActivity(testActivity);
      }, 100);
    });
  });

  describe('Direct Messaging', () => {
    test('should receive direct message', (done) => {
      const testMessage = {
        from: { id: 1, name: 'Admin User' },
        message: 'This is a direct message',
        timestamp: new Date().toISOString()
      };

      clientSocket.on('direct_message', (data) => {
        expect(data.from.name).toBe(testMessage.from.name);
        expect(data.message).toBe(testMessage.message);
        done();
      });

      // Simulate sending direct message
      setTimeout(() => {
        websocketService.sendDirectMessage(1, 'test-user-id', testMessage.message);
      }, 100);
    });
  });

  describe('System Alerts', () => {
    test('should receive system alert', (done) => {
      const testAlert = {
        level: 'warning',
        message: 'System maintenance scheduled',
        data: { scheduledTime: '2024-01-01T00:00:00Z' }
      };

      clientSocket.on('system_alert', (alert) => {
        expect(alert.level).toBe(testAlert.level);
        expect(alert.message).toBe(testAlert.message);
        done();
      });

      // Simulate system alert
      setTimeout(() => {
        websocketService.broadcastSystemAlert(testAlert.level, testAlert.message, testAlert.data);
      }, 100);
    });
  });

  describe('User Status Updates', () => {
    test('should receive user online notification', (done) => {
      clientSocket.on('user_status', (data) => {
        if (data.type === 'user_online') {
          expect(data.user).toBeDefined();
          expect(data.user.id).toBeDefined();
          done();
        }
      });

      // Simulate another user coming online
      setTimeout(() => {
        const mockUser = { id: 2, name: 'Another User' };
        websocketService.broadcastUserStatus('user_online', mockUser);
      }, 100);
    });

    test('should receive user offline notification', (done) => {
      clientSocket.on('user_status', (data) => {
        if (data.type === 'user_offline') {
          expect(data.user).toBeDefined();
          expect(data.user.id).toBeDefined();
          done();
        }
      });

      // Simulate user going offline
      setTimeout(() => {
        const mockUser = { id: 2, name: 'Another User' };
        websocketService.broadcastUserStatus('user_offline', mockUser);
      }, 100);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid room name', (done) => {
      clientSocket.emit('join_room', ''); // Invalid empty room name
      
      clientSocket.on('error', (error) => {
        expect(error.message).toBeDefined();
        done();
      });
    });

    test('should handle connection errors gracefully', (done) => {
      const badClient = new Client(`http://localhost:${serverPort}`, {
        auth: {
          token: 'invalid-token'
        }
      });

      badClient.on('connect_error', (error) => {
        expect(error).toBeDefined();
        done();
      });
    });
  });

  describe('Performance', () => {
    test('should handle multiple concurrent connections', async () => {
      const clients = [];
      const connectionPromises = [];

      // Create 10 concurrent connections
      for (let i = 0; i < 10; i++) {
        const client = new Client(`http://localhost:${serverPort}`, {
          auth: {
            token: `test-token-${i}`
          }
        });

        const promise = new Promise((resolve) => {
          client.on('connect', resolve);
        });

        clients.push(client);
        connectionPromises.push(promise);
      }

      // Wait for all connections
      await Promise.all(connectionPromises);

      // Verify all clients are connected
      expect(clients.every(client => client.connected)).toBe(true);

      // Cleanup
      clients.forEach(client => client.disconnect());
    });

    test('should handle rapid message broadcasting', (done) => {
      let receivedCount = 0;
      const messageCount = 50;

      clientSocket.on('notification', () => {
        receivedCount++;
        if (receivedCount === messageCount) {
          done();
        }
      });

      // Send rapid notifications
      for (let i = 0; i < messageCount; i++) {
        setTimeout(() => {
          websocketService.broadcastNotification({
            id: `rapid-${i}`,
            type: 'test',
            title: `Rapid Message ${i}`,
            message: `This is rapid message ${i}`
          });
        }, i * 10); // 10ms intervals
      }
    });
  });
});
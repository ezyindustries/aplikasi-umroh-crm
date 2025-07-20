import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activities, setActivities] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!isAuthenticated || !token || socket?.connected) {
      return;
    }

    const serverUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    
    const newSocket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setConnectionStatus('connected');
      toast.success('Terhubung ke server real-time', {
        duration: 2000,
        position: 'bottom-right'
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
      toast.error('Gagal terhubung ke server real-time', {
        duration: 3000,
        position: 'bottom-right'
      });
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      toast.success('Koneksi real-time dipulihkan', {
        duration: 2000,
        position: 'bottom-right'
      });
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnecting', (attemptNumber) => {
      console.log('Attempting to reconnect...', attemptNumber);
      setConnectionStatus('reconnecting');
    });

    // Application-specific event handlers
    newSocket.on('connected', (data) => {
      console.log('Welcome message:', data);
    });

    newSocket.on('notification', (notification) => {
      console.log('New notification:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep last 100
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast(notification.message, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: getNotificationColor(notification.type),
          color: 'white'
        },
        icon: getNotificationIcon(notification.type)
      });
    });

    newSocket.on('activity_update', (activity) => {
      console.log('Activity update:', activity);
      setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50
    });

    newSocket.on('user_status', (data) => {
      console.log('User status update:', data);
      if (data.type === 'user_online') {
        setConnectedUsers(prev => {
          const exists = prev.find(u => u.id === data.user.id);
          if (!exists) {
            return [...prev, data.user];
          }
          return prev;
        });
      } else if (data.type === 'user_offline') {
        setConnectedUsers(prev => prev.filter(u => u.id !== data.user.id));
      }
    });

    newSocket.on('stats_update', (data) => {
      console.log('Stats update:', data);
      // This can be handled by individual components that need stats
    });

    newSocket.on('system_alert', (alert) => {
      console.log('System alert:', alert);
      
      const alertStyles = {
        critical: { background: '#dc3545', duration: 0 }, // Red, persistent
        error: { background: '#dc3545', duration: 8000 },   // Red
        warning: { background: '#ffc107', duration: 6000 }, // Yellow
        info: { background: '#17a2b8', duration: 4000 }     // Blue
      };

      const style = alertStyles[alert.level] || alertStyles.info;
      
      toast(alert.message, {
        duration: style.duration,
        position: 'top-center',
        style: { ...style, color: 'white', fontWeight: 'bold' },
        icon: '⚠️'
      });
    });

    newSocket.on('broadcast_message', (data) => {
      console.log('Broadcast message:', data);
      toast(data.message, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#28a745',
          color: 'white'
        },
        icon: '📢'
      });
    });

    newSocket.on('direct_message', (data) => {
      console.log('Direct message:', data);
      toast(`Pesan dari ${data.from.name}: ${data.message}`, {
        duration: 6000,
        position: 'top-right',
        style: {
          background: '#007bff',
          color: 'white'
        },
        icon: '💬'
      });
    });

    setSocket(newSocket);
  }, [isAuthenticated, token, socket?.connected]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnectionStatus('disconnected');
      setNotifications([]);
      setUnreadCount(0);
      setActivities([]);
      setConnectedUsers([]);
    }
  }, [socket]);

  // Send message to server
  const emit = useCallback((event, data) => {
    if (socket?.connected) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }, [socket]);

  // Join a room
  const joinRoom = useCallback((roomName) => {
    return emit('join_room', roomName);
  }, [emit]);

  // Leave a room
  const leaveRoom = useCallback((roomName) => {
    return emit('leave_room', roomName);
  }, [emit]);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !socket) {
      connect();
    } else if (!isAuthenticated && socket) {
      disconnect();
    }

    return () => {
      // Cleanup on unmount
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, token, connect, disconnect, socket]);

  // Helper functions
  const getNotificationColor = (type) => {
    const colors = {
      jamaah_registered: '#28a745',
      payment_received: '#007bff',
      payment_verified: '#28a745',
      payment_rejected: '#dc3545',
      document_uploaded: '#17a2b8',
      document_verified: '#28a745',
      document_rejected: '#dc3545',
      package_full: '#ffc107',
      system_alert: '#dc3545',
      default: '#6c757d'
    };
    return colors[type] || colors.default;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      jamaah_registered: '👤',
      payment_received: '💰',
      payment_verified: '✅',
      payment_rejected: '❌',
      document_uploaded: '📄',
      document_verified: '✅',
      document_rejected: '❌',
      package_full: '⚠️',
      system_alert: '🚨',
      default: '📢'
    };
    return icons[type] || icons.default;
  };

  const value = {
    socket,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    notifications,
    unreadCount,
    activities,
    connectedUsers,
    connect,
    disconnect,
    emit,
    joinRoom,
    leaveRoom,
    markNotificationAsRead,
    clearAllNotifications
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  MenuList,
  Typography,
  Box,
  Divider,
  Chip,
  Button,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Circle,
  CheckCircle,
  Warning,
  Info,
  Error,
  Close,
  MarkEmailRead,
  Delete,
  OpenInNew,
  PersonAdd,
  Payment,
  Receipt,
  UploadFile,
  VerifiedUser,
  Cancel,
  GroupWork,
  WifiOff,
  Wifi
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';
import axios from 'axios';

const NotificationCenter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [dbUnreadCount, setDbUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const {
    notifications: wsNotifications,
    unreadCount: wsUnreadCount,
    isConnected,
    markNotificationAsRead,
    clearAllNotifications
  } = useWebSocket();

  // Combine WebSocket and database notifications
  const allNotifications = [...wsNotifications, ...dbNotifications]
    .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))
    .slice(0, 20); // Show only last 20 notifications

  const totalUnreadCount = wsUnreadCount + dbUnreadCount;

  const open = Boolean(anchorEl);

  // Load database notifications on mount and when menu opens
  useEffect(() => {
    if (open) {
      fetchDbNotifications();
    }
  }, [open]);

  const fetchDbNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [notificationsRes, countRes] = await Promise.all([
        axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 10, unread_only: false }
        }),
        axios.get('/api/notifications/count', {
          headers: { Authorization: `Bearer ${token}` },
          params: { unread_only: true }
        })
      ]);

      setDbNotifications(notificationsRes.data.notifications || []);
      setDbUnreadCount(countRes.data.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read in WebSocket if it's a WS notification
      if (notification.id && !notification.id.toString().startsWith('db_')) {
        markNotificationAsRead(notification.id);
      }
      
      // Mark as read in database if it's a DB notification
      if (notification.id && notification.id.toString().startsWith('db_')) {
        const token = localStorage.getItem('token');
        await axios.patch(`/api/notifications/${notification.id.replace('db_', '')}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Refresh DB notifications
        fetchDbNotifications();
      }

      // Navigate if there's an action
      if (notification.action) {
        navigate(notification.action);
      } else if (notification.data?.action) {
        navigate(notification.data.action);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    handleClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all WebSocket notifications as read
      clearAllNotifications();
      
      // Mark all database notifications as read
      const token = localStorage.getItem('token');
      await axios.patch('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh DB notifications
      fetchDbNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleRemoveNotification = async (notification) => {
    try {
      if (notification.id && notification.id.toString().startsWith('db_')) {
        // For database notifications, mark as read (we don't actually delete them)
        const token = localStorage.getItem('token');
        await axios.patch(`/api/notifications/${notification.id.replace('db_', '')}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchDbNotifications();
      } else {
        // For WebSocket notifications, remove from local state
        markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
      case 'payment_verified':
      case 'document_verified':
        return <CheckCircle color="success" sx={{ fontSize: 16 }} />;
      case 'warning':
      case 'package_full':
        return <Warning color="warning" sx={{ fontSize: 16 }} />;
      case 'error':
      case 'payment_rejected':
      case 'document_rejected':
      case 'system_alert':
        return <Error color="error" sx={{ fontSize: 16 }} />;
      case 'jamaah_registered':
        return <PersonAdd color="primary" sx={{ fontSize: 16 }} />;
      case 'payment_received':
        return <Payment color="primary" sx={{ fontSize: 16 }} />;
      case 'document_uploaded':
        return <UploadFile color="info" sx={{ fontSize: 16 }} />;
      case 'info':
      default:
        return <Info color="info" sx={{ fontSize: 16 }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
      case 'payment_verified':
      case 'document_verified':
        return 'success.light';
      case 'warning':
      case 'package_full':
        return 'warning.light';
      case 'error':
      case 'payment_rejected':
      case 'document_rejected':
      case 'system_alert':
        return 'error.light';
      case 'jamaah_registered':
      case 'payment_received':
        return 'primary.light';
      case 'document_uploaded':
      case 'info':
      default:
        return 'info.light';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diff = now - notificationTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const isNotificationRead = (notification) => {
    // For WebSocket notifications, check the read property
    if (!notification.id || !notification.id.toString().startsWith('db_')) {
      return notification.read || false;
    }
    
    // For database notifications, they should have a read status
    return notification.read || false;
  };

  return (
    <>
      <Tooltip title={`Notifikasi ${!isConnected ? '(Offline)' : ''}`}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={totalUnreadCount} color="error">
            {totalUnreadCount > 0 ? <NotificationsActive /> : <Notifications />}
          </Badge>
          {!isConnected && (
            <WifiOff 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                fontSize: 12, 
                color: 'warning.main' 
              }} 
            />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            overflow: 'visible'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">
                Notifikasi
              </Typography>
              {isConnected ? (
                <Wifi color="success" sx={{ fontSize: 16 }} />
              ) : (
                <WifiOff color="warning" sx={{ fontSize: 16 }} />
              )}
            </Box>
            <Box display="flex" gap={1}>
              {totalUnreadCount > 0 && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<MarkEmailRead />}
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  Tandai Semua Dibaca
                </Button>
              )}
            </Box>
          </Box>
          
          {totalUnreadCount > 0 && (
            <Chip
              label={`${totalUnreadCount} belum dibaca`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
          
          {!isConnected && (
            <Alert severity="warning" sx={{ mt: 1, p: 1 }}>
              <Typography variant="caption">
                Koneksi real-time terputus. Notifikasi baru mungkin tertunda.
              </Typography>
            </Alert>
          )}
        </Box>

        <Divider />

        {/* Notifications List */}
        <MenuList sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Memuat notifikasi...
              </Typography>
            </Box>
          ) : allNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Belum ada notifikasi
              </Typography>
            </Box>
          ) : (
            allNotifications.map((notification, index) => {
              const isRead = isNotificationRead(notification);
              const timestamp = notification.created_at || notification.timestamp;
              
              return (
                <MenuItem
                  key={`${notification.id || 'temp'}-${index}`}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    p: 2,
                    borderLeft: isRead ? 'none' : `3px solid`,
                    borderLeftColor: isRead ? 'transparent' : getNotificationColor(notification.type),
                    backgroundColor: isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24, mr: 1 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Typography variant="subtitle2" sx={{ flex: 1 }}>
                          {notification.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {!isRead && (
                            <Circle color="primary" sx={{ fontSize: 8 }} />
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNotification(notification);
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <Close sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(timestamp)}
                          {(notification.action || notification.data?.action) && (
                            <>
                              {' • '}
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                Klik untuk buka
                                <OpenInNew sx={{ fontSize: 12 }} />
                              </Box>
                            </>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </MenuItem>
              );
            })
          )}
        </MenuList>

        {allNotifications.length > 10 && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button 
                variant="text" 
                size="small"
                onClick={() => navigate('/notifications')}
              >
                Lihat Semua Notifikasi
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
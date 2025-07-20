import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Button
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Warning,
  Error,
  Info
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

const NotificationToast = () => {
  const [toastQueue, setToastQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const { notifications } = useWebSocket();

  // Monitor new notifications and add to toast queue
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      // Only show toast for very recent notifications (less than 5 seconds old)
      const notificationAge = Date.now() - latestNotification.timestamp.getTime();
      
      if (notificationAge < 5000 && !latestNotification.read) {
        setToastQueue(prev => {
          // Avoid duplicates
          const exists = prev.some(toast => toast.id === latestNotification.id);
          if (exists) return prev;
          
          return [...prev, {
            id: latestNotification.id,
            title: latestNotification.title,
            message: latestNotification.message,
            type: latestNotification.type,
            action: latestNotification.action
          }];
        });
      }
    }
  }, [notifications]);

  // Process toast queue
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      setCurrentToast(toastQueue[0]);
      setToastQueue(prev => prev.slice(1));
    }
  }, [currentToast, toastQueue]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setCurrentToast(null);
  };

  const handleAction = () => {
    if (currentToast?.action && window.location.pathname !== currentToast.action) {
      window.location.href = currentToast.action;
    }
    setCurrentToast(null);
  };

  const getSeverity = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info':
      default: return 'info';
    }
  };

  if (!currentToast) return null;

  return (
    <Snackbar
      open={!!currentToast}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }} // Account for app bar height
    >
      <Alert
        severity={getSeverity(currentToast.type)}
        onClose={handleClose}
        sx={{ 
          width: '100%',
          maxWidth: 400,
          '& .MuiAlert-message': { width: '100%' }
        }}
        action={
          currentToast.action ? (
            <Button
              color="inherit"
              size="small"
              onClick={handleAction}
              sx={{ ml: 1 }}
            >
              Buka
            </Button>
          ) : null
        }
      >
        <AlertTitle>{currentToast.title}</AlertTitle>
        <Typography variant="body2">
          {currentToast.message}
        </Typography>
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast;
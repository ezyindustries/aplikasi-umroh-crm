import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Person,
  Payment,
  UploadFile,
  Edit,
  Delete,
  Add,
  Refresh,
  FilterList,
  Timeline,
  Wifi,
  WifiOff
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';
import axios from 'axios';

const ActivityFeed = ({ maxItems = 50, showRefresh = true, autoRefresh = true }) => {
  const [dbActivities, setDbActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRealTimeOnly, setShowRealTimeOnly] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { activities: wsActivities, isConnected } = useWebSocket();

  // Combine WebSocket and database activities
  const allActivities = showRealTimeOnly 
    ? wsActivities 
    : [...wsActivities, ...dbActivities]
        .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))
        .slice(0, maxItems);

  useEffect(() => {
    if (!showRealTimeOnly) {
      fetchDbActivities();
    }
  }, [showRealTimeOnly]);

  useEffect(() => {
    if (autoRefresh && !showRealTimeOnly) {
      const interval = setInterval(() => {
        fetchDbActivities();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, showRealTimeOnly]);

  const fetchDbActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Note: We would need to create an activities endpoint
      // For now, we'll use a placeholder or fetch from audit logs
      const response = await axios.get('/api/monitoring/activities', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 }
      });

      setDbActivities(response.data.activities || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching activities:', error);
      // If activities endpoint doesn't exist, we'll just use WebSocket data
      setDbActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'jamaah_created':
      case 'jamaah_registered':
        return <Person color="primary" />;
      case 'jamaah_updated':
        return <Edit color="info" />;
      case 'jamaah_deleted':
        return <Delete color="error" />;
      case 'payment_created':
      case 'payment_received':
        return <Payment color="success" />;
      case 'payment_updated':
        return <Edit color="warning" />;
      case 'document_uploaded':
        return <UploadFile color="info" />;
      case 'package_created':
        return <Add color="primary" />;
      default:
        return <Timeline color="action" />;
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'jamaah_created':
      case 'package_created':
        return 'primary';
      case 'jamaah_updated':
      case 'payment_updated':
        return 'info';
      case 'jamaah_deleted':
        return 'error';
      case 'payment_created':
      case 'payment_received':
        return 'success';
      case 'document_uploaded':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diff = now - activityTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return activityTime.toLocaleDateString('id-ID');
  };

  const formatActivityMessage = (activity) => {
    const user = activity.user_name || activity.user?.name || 'Sistem';
    const action = activity.action || activity.type;
    const details = activity.details || activity.message || '';

    switch (action) {
      case 'jamaah_created':
        return `${user} menambah jamaah baru${details ? `: ${details}` : ''}`;
      case 'jamaah_updated':
        return `${user} mengubah data jamaah${details ? `: ${details}` : ''}`;
      case 'jamaah_deleted':
        return `${user} menghapus jamaah${details ? `: ${details}` : ''}`;
      case 'payment_created':
        return `${user} menambah pembayaran baru${details ? `: ${details}` : ''}`;
      case 'payment_updated':
        return `${user} mengubah pembayaran${details ? `: ${details}` : ''}`;
      case 'document_uploaded':
        return `${user} mengunggah dokumen${details ? `: ${details}` : ''}`;
      case 'package_created':
        return `${user} membuat paket baru${details ? `: ${details}` : ''}`;
      default:
        return details || `${user} melakukan ${action}`;
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Timeline />
            <Typography variant="h6">
              Aktivitas Terkini
            </Typography>
            {isConnected ? (
              <Wifi color="success" sx={{ fontSize: 16 }} />
            ) : (
              <WifiOff color="warning" sx={{ fontSize: 16 }} />
            )}
          </Box>
        }
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={showRealTimeOnly}
                  onChange={(e) => setShowRealTimeOnly(e.target.checked)}
                  size="small"
                />
              }
              label="Real-time saja"
              sx={{ mr: 1 }}
            />
            {showRefresh && !showRealTimeOnly && (
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={fetchDbActivities}
                  disabled={loading}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      />
      
      <CardContent sx={{ pt: 0 }}>
        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="caption">
              Koneksi real-time terputus. Aktivitas terbaru mungkin tidak muncul.
            </Typography>
          </Alert>
        )}

        {showRealTimeOnly && wsActivities.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Timeline sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Belum ada aktivitas real-time
            </Typography>
          </Box>
        )}

        {loading && !showRealTimeOnly ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Memuat aktivitas...
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {allActivities.map((activity, index) => {
              const timestamp = activity.created_at || activity.timestamp;
              const isRealTime = !activity.id || !activity.id.toString().startsWith('db_');
              
              return (
                <ListItem
                  key={`${activity.id || 'temp'}-${index}`}
                  sx={{
                    px: 0,
                    py: 1,
                    borderLeft: isRealTime ? '3px solid' : 'none',
                    borderLeftColor: 'primary.main',
                    backgroundColor: isRealTime ? 'action.hover' : 'transparent'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {getActivityIcon(activity.action || activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {formatActivityMessage(activity)}
                        </Typography>
                        <Chip
                          label={activity.action || activity.type}
                          size="small"
                          color={getActivityColor(activity.action || activity.type)}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(timestamp)}
                        </Typography>
                        {isRealTime && (
                          <Chip
                            label="Real-time"
                            size="small"
                            color="primary"
                            variant="filled"
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}

        {!showRealTimeOnly && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Terakhir diperbarui: {lastRefresh.toLocaleTimeString('id-ID')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
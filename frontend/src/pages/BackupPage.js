import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Tooltip,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Backup,
  Restore,
  Download,
  Delete,
  Refresh,
  CloudUpload,
  Storage,
  Schedule,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';

import { backupAPI } from '../services/api';

const BackupPage = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create'); // create, restore
  const [selectedBackup, setSelectedBackup] = useState('');
  const [backupType, setBackupType] = useState('full');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Fetch backup statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'backup-statistics',
    backupAPI.getStatistics,
    {
      select: data => data.data,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  );

  // Fetch backup history
  const { data: history, isLoading: historyLoading } = useQuery(
    'backup-history',
    () => backupAPI.getHistory(50),
    {
      select: data => data.data
    }
  );

  // Fetch available backup files
  const { data: backupFiles, isLoading: filesLoading } = useQuery(
    'backup-files',
    backupAPI.getAvailableBackups,
    {
      select: data => data.data
    }
  );

  // Create backup mutation
  const createBackupMutation = useMutation(backupAPI.createBackup, {
    onSuccess: () => {
      queryClient.invalidateQueries('backup-statistics');
      queryClient.invalidateQueries('backup-history');
      queryClient.invalidateQueries('backup-files');
      setOpenDialog(false);
      enqueueSnackbar('Backup berhasil dibuat', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.error || 'Gagal membuat backup', { variant: 'error' });
    }
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation(backupAPI.restoreDatabase, {
    onSuccess: () => {
      queryClient.invalidateQueries('backup-history');
      setOpenDialog(false);
      enqueueSnackbar('Database berhasil direstore', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.error || 'Gagal restore database', { variant: 'error' });
    }
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation(backupAPI.deleteBackup, {
    onSuccess: () => {
      queryClient.invalidateQueries('backup-files');
      queryClient.invalidateQueries('backup-statistics');
      enqueueSnackbar('Backup berhasil dihapus', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.error || 'Gagal menghapus backup', { variant: 'error' });
    }
  });

  // Test backup mutation
  const testBackupMutation = useMutation(backupAPI.testBackup, {
    onSuccess: (data) => {
      const testResults = data.data;
      if (testResults.status === 'success') {
        enqueueSnackbar('Semua test backup berhasil', { variant: 'success' });
      } else {
        enqueueSnackbar('Beberapa test backup gagal', { variant: 'warning' });
      }
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.error || 'Test backup gagal', { variant: 'error' });
    }
  });

  const handleCreateBackup = () => {
    createBackupMutation.mutate({ type: backupType });
  };

  const handleRestoreBackup = () => {
    if (!selectedBackup) {
      enqueueSnackbar('Pilih file backup terlebih dahulu', { variant: 'error' });
      return;
    }

    if (window.confirm('Yakin ingin restore database? Semua data saat ini akan diganti!')) {
      restoreBackupMutation.mutate({ backup_file: selectedBackup });
    }
  };

  const handleDeleteBackup = (filename) => {
    if (window.confirm(`Yakin ingin menghapus backup ${filename}?`)) {
      deleteBackupMutation.mutate(filename);
    }
  };

  const handleDownloadBackup = (filename) => {
    window.open(`/api/backup/download/${filename}`, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'failed': return <Error />;
      case 'pending': return <Info />;
      default: return <Info />;
    }
  };

  const formatFileSize = (sizeMB) => {
    if (sizeMB < 1) return `${(sizeMB * 1024).toFixed(1)} KB`;
    if (sizeMB < 1024) return `${sizeMB.toFixed(1)} MB`;
    return `${(sizeMB / 1024).toFixed(1)} GB`;
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="between">
          <Box>
            <Typography variant="h4" component="div" gutterBottom>
              {value || 0}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Statistics Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Backup"
          value={stats?.totalBackups}
          icon={<Storage />}
          color="primary"
          subtitle={`${stats?.fileCount || 0} files`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={<CheckCircle />}
          color="success"
          subtitle={`${stats?.successfulBackups || 0} berhasil`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Storage Used"
          value={formatFileSize(stats?.totalSizeMB || 0)}
          icon={<Assessment />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Last Backup"
          value={stats?.lastBackup ? 
            new Date(stats.lastBackup.created_at).toLocaleDateString('id-ID') : 
            'Never'
          }
          icon={<Schedule />}
          color="warning"
          subtitle={stats?.lastBackup?.backup_type}
        />
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<Backup />}
                onClick={() => {
                  setDialogType('create');
                  setOpenDialog(true);
                }}
                disabled={createBackupMutation.isLoading}
              >
                Create Backup
              </Button>
              <Button
                variant="outlined"
                startIcon={<Restore />}
                onClick={() => {
                  setDialogType('restore');
                  setOpenDialog(true);
                }}
                disabled={restoreBackupMutation.isLoading}
              >
                Restore Database
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => testBackupMutation.mutate()}
                disabled={testBackupMutation.isLoading}
              >
                Test System
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  queryClient.invalidateQueries('backup-statistics');
                  queryClient.invalidateQueries('backup-history');
                  queryClient.invalidateQueries('backup-files');
                }}
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* System Status */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Scheduled Backups</Typography>
                  <Typography variant="body2">
                    • Daily database backup at 2:00 AM<br/>
                    • Weekly full backup on Sundays at 3:00 AM<br/>
                    • Old backups cleaned up daily at 4:00 AM
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Storage Management</Typography>
                  <Typography variant="body2">
                    Keeping last 30 backup files. Older files are automatically deleted.
                    Current usage: {formatFileSize(stats?.totalSizeMB || 0)}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const HistoryTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Backup History
        </Typography>
        {historyLoading && <LinearProgress />}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Files</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Created By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {new Date(item.created_at).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.backup_type} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(item.status)}
                      label={item.status}
                      size="small"
                      color={getStatusColor(item.status)}
                    />
                  </TableCell>
                  <TableCell>{item.file_count || '-'}</TableCell>
                  <TableCell>
                    {item.total_size_mb ? formatFileSize(item.total_size_mb) : '-'}
                  </TableCell>
                  <TableCell>
                    {item.duration_seconds ? formatDuration(item.duration_seconds) : '-'}
                  </TableCell>
                  <TableCell>{item.created_by || 'System'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const FilesTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Available Backup Files
        </Typography>
        {filesLoading && <LinearProgress />}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Modified</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backupFiles?.map((file) => (
                <TableRow key={file.name}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={file.type} 
                      size="small" 
                      color={file.type === 'database' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{formatFileSize(file.sizeMB)}</TableCell>
                  <TableCell>
                    {new Date(file.mtime).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Download">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDownloadBackup(file.name)}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteBackup(file.name)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Backup Management
        </Typography>
      </Box>

      {/* Loading States */}
      {(createBackupMutation.isLoading || restoreBackupMutation.isLoading || testBackupMutation.isLoading) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <LinearProgress sx={{ mt: 1 }} />
          {createBackupMutation.isLoading && 'Creating backup...'}
          {restoreBackupMutation.isLoading && 'Restoring database...'}
          {testBackupMutation.isLoading && 'Testing backup system...'}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab icon={<Assessment />} label="Overview" />
          <Tab icon={<Schedule />} label="History" />
          <Tab icon={<Storage />} label="Files" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && <OverviewTab />}
      {currentTab === 1 && <HistoryTab />}
      {currentTab === 2 && <FilesTab />}

      {/* Create Backup Dialog */}
      <Dialog open={openDialog && dialogType === 'create'} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create Manual Backup</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Backup Type</InputLabel>
            <Select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              label="Backup Type"
            >
              <MenuItem value="full">Full Backup (Database + Files)</MenuItem>
              <MenuItem value="database">Database Only</MenuItem>
              <MenuItem value="files">Files Only</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 2 }}>
            This will create a backup of the selected components. The process may take several minutes.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateBackup}
            variant="contained"
            disabled={createBackupMutation.isLoading}
          >
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Database Dialog */}
      <Dialog open={openDialog && dialogType === 'restore'} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Restore Database</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Backup File</InputLabel>
            <Select
              value={selectedBackup}
              onChange={(e) => setSelectedBackup(e.target.value)}
              label="Select Backup File"
            >
              {backupFiles?.filter(file => file.type === 'database').map((file) => (
                <MenuItem key={file.name} value={file.name}>
                  {file.name} ({formatFileSize(file.sizeMB)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Warning:</strong> This will replace all current data with the backup data. 
            This action cannot be undone. Make sure you have a recent backup before proceeding.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRestoreBackup}
            variant="contained"
            color="warning"
            disabled={restoreBackupMutation.isLoading || !selectedBackup}
          >
            Restore Database
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupPage;
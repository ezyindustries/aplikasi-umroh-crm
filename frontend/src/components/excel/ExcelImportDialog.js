import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  TableChart as TableIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const ExcelImportDialog = ({ open, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');

  const steps = ['Upload File', 'Validasi Data', 'Import Selesai'];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        setError('File harus berformat Excel (.xlsx atau .xls)');
        return;
      }
      setSelectedFile(acceptedFiles[0]);
      setError('');
    }
  });

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/excel/template/jamaah', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_jamaah.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Gagal mendownload template');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Pilih file Excel terlebih dahulu');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/excel/import/jamaah', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setImportResult(response.data);
      setActiveStep(1);
      
      // If there are no errors, move to final step
      if (response.data.errors.length === 0) {
        setTimeout(() => setActiveStep(2), 1000);
      }
      
    } catch (error) {
      setError(error.response?.data?.message || 'Terjadi kesalahan saat mengimport file');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedWithErrors = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/excel/import/jamaah/force', {
        import_id: importResult.import_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setImportResult(prev => ({ ...prev, ...response.data }));
      setActiveStep(2);
    } catch (error) {
      setError('Gagal melanjutkan import');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setImportResult(null);
    setError('');
    setUploadProgress(0);
    onClose();
  };

  const handleFinish = () => {
    onSuccess(importResult);
    handleClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderUploadStep = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DownloadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Download Template
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Download template Excel untuk memastikan format data yang benar
              </Typography>
              <Button
                variant="outlined"
                onClick={downloadTemplate}
                startIcon={<DownloadIcon />}
                fullWidth
              >
                Download Template
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <UploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Upload File Excel
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Pilih file Excel yang berisi data jamaah
              </Typography>
              <Paper
                {...getRootProps()}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <input {...getInputProps()} />
                <TableIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="body2">
                  {isDragActive ? 'Lepaskan file di sini' : 'Drag & drop atau klik untuk memilih'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Format: .xlsx, .xls
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {selectedFile && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="info">
            <Typography variant="subtitle2">File Dipilih:</Typography>
            <Typography variant="body2">
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </Typography>
          </Alert>
        </Box>
      )}

      {loading && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom>
            Upload Progress: {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
    </Box>
  );

  const renderValidationStep = () => (
    <Box>
      {importResult && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {importResult.success_count}
                </Typography>
                <Typography variant="body2">Data Valid</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" color="error.main">
                  {importResult.error_count}
                </Typography>
                <Typography variant="body2">Error</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {importResult.warning_count || 0}
                </Typography>
                <Typography variant="body2">Warning</Typography>
              </CardContent>
            </Card>
          </Grid>

          {importResult.errors.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Error Details:
              </Typography>
              <List>
                {importResult.errors.slice(0, 10).map((error, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Baris ${error.row}: ${error.message}`}
                      secondary={error.data ? `Data: ${JSON.stringify(error.data)}` : ''}
                    />
                  </ListItem>
                ))}
                {importResult.errors.length > 10 && (
                  <ListItem>
                    <ListItemText
                      primary={`... dan ${importResult.errors.length - 10} error lainnya`}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
          )}

          {importResult.warnings && importResult.warnings.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Warnings:
              </Typography>
              <List>
                {importResult.warnings.slice(0, 5).map((warning, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Baris ${warning.row}: ${warning.message}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );

  const renderSuccessStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Import Berhasil!
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        {importResult?.success_count} data jamaah berhasil diimport
      </Typography>
      {importResult?.error_count > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {importResult.error_count} data memiliki error dan tidak diimport
        </Alert>
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Import Data Jamaah dari Excel
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && renderUploadStep()}
        {activeStep === 1 && renderValidationStep()}
        {activeStep === 2 && renderSuccessStep()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 2 ? 'Tutup' : 'Batal'}
        </Button>
        
        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            Upload & Validasi
          </Button>
        )}
        
        {activeStep === 1 && importResult?.errors.length > 0 && (
          <Button
            variant="outlined"
            onClick={handleProceedWithErrors}
            disabled={loading}
          >
            Lanjutkan (Skip Error)
          </Button>
        )}
        
        {activeStep === 2 && (
          <Button
            variant="contained"
            onClick={handleFinish}
          >
            Selesai
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExcelImportDialog;
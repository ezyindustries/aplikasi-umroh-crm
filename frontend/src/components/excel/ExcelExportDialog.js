import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  TextField
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  TableChart as TableIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const ExcelExportDialog = ({ open, onClose, dataType = 'jamaah' }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState('');
  
  const [exportConfig, setExportConfig] = useState({
    format: 'xlsx',
    includeHeaders: true,
    dateRange: {
      start: null,
      end: null
    },
    filters: {
      package_id: '',
      verification_status: '',
      payment_status: '',
      visa_status: ''
    },
    columns: {
      jamaah: {
        personal_data: true,
        passport_data: true,
        package_info: true,
        payment_info: false,
        visa_info: false,
        medical_info: false
      },
      payments: {
        jamaah_info: true,
        payment_details: true,
        verification_info: true,
        bank_info: true
      },
      documents: {
        jamaah_info: true,
        document_details: true,
        verification_info: true,
        file_info: true
      }
    }
  });

  useEffect(() => {
    if (open) {
      loadPackages();
    }
  }, [open]);

  const loadPackages = async () => {
    try {
      const response = await axios.get('/api/packages', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setExportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: value
      }
    }));
  };

  const handleDateChange = (field, date) => {
    setExportConfig(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date
      }
    }));
  };

  const handleColumnChange = (category, field, checked) => {
    setExportConfig(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [dataType]: {
          ...prev.columns[dataType],
          [field]: checked
        }
      }
    }));
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        format: exportConfig.format,
        include_headers: exportConfig.includeHeaders,
        columns: exportConfig.columns[dataType],
        ...exportConfig.filters
      };

      if (exportConfig.dateRange.start) {
        params.start_date = exportConfig.dateRange.start.toISOString().split('T')[0];
      }
      if (exportConfig.dateRange.end) {
        params.end_date = exportConfig.dateRange.end.toISOString().split('T')[0];
      }

      const response = await axios.get(`/api/excel/export/${dataType}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `${dataType}_${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Gagal mengexport data');
    } finally {
      setLoading(false);
    }
  };

  const getDataTypeLabel = () => {
    switch (dataType) {
      case 'jamaah':
        return 'Data Jamaah';
      case 'payments':
        return 'Data Pembayaran';
      case 'documents':
        return 'Data Dokumen';
      default:
        return 'Data';
    }
  };

  const renderColumnSelection = () => {
    const columns = exportConfig.columns[dataType];
    
    switch (dataType) {
      case 'jamaah':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Pilih Kolom yang Akan Diexport:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.personal_data}
                    onChange={(e) => handleColumnChange('jamaah', 'personal_data', e.target.checked)}
                  />
                }
                label="Data Pribadi"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.passport_data}
                    onChange={(e) => handleColumnChange('jamaah', 'passport_data', e.target.checked)}
                  />
                }
                label="Data Paspor"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.package_info}
                    onChange={(e) => handleColumnChange('jamaah', 'package_info', e.target.checked)}
                  />
                }
                label="Info Paket"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.payment_info}
                    onChange={(e) => handleColumnChange('jamaah', 'payment_info', e.target.checked)}
                  />
                }
                label="Info Pembayaran"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.visa_info}
                    onChange={(e) => handleColumnChange('jamaah', 'visa_info', e.target.checked)}
                  />
                }
                label="Info Visa"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.medical_info}
                    onChange={(e) => handleColumnChange('jamaah', 'medical_info', e.target.checked)}
                  />
                }
                label="Info Medis"
              />
            </Grid>
          </Grid>
        );
      case 'payments':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Pilih Kolom yang Akan Diexport:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.jamaah_info}
                    onChange={(e) => handleColumnChange('payments', 'jamaah_info', e.target.checked)}
                  />
                }
                label="Info Jamaah"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.payment_details}
                    onChange={(e) => handleColumnChange('payments', 'payment_details', e.target.checked)}
                  />
                }
                label="Detail Pembayaran"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.verification_info}
                    onChange={(e) => handleColumnChange('payments', 'verification_info', e.target.checked)}
                  />
                }
                label="Info Verifikasi"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columns.bank_info}
                    onChange={(e) => handleColumnChange('payments', 'bank_info', e.target.checked)}
                  />
                }
                label="Info Bank"
              />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TableIcon sx={{ mr: 2 }} />
            Export {getDataTypeLabel()} ke Excel
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Format Selection */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Format Export
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Format File</InputLabel>
                    <Select
                      value={exportConfig.format}
                      label="Format File"
                      onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                    >
                      <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                      <MenuItem value="xls">Excel Legacy (.xls)</MenuItem>
                      <MenuItem value="csv">CSV (.csv)</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportConfig.includeHeaders}
                        onChange={(e) => setExportConfig(prev => ({ 
                          ...prev, 
                          includeHeaders: e.target.checked 
                        }))}
                      />
                    }
                    label="Sertakan Header Kolom"
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rentang Tanggal
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <DatePicker
                      label="Tanggal Mulai"
                      value={exportConfig.dateRange.start}
                      onChange={(date) => handleDateChange('start', date)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      inputFormat="dd/MM/yyyy"
                    />
                  </Box>
                  <DatePicker
                    label="Tanggal Akhir"
                    value={exportConfig.dateRange.end}
                    onChange={(date) => handleDateChange('end', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    inputFormat="dd/MM/yyyy"
                    minDate={exportConfig.dateRange.start}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Filters */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Filter Data
                  </Typography>
                  <Grid container spacing={2}>
                    {dataType === 'jamaah' && (
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Paket Umroh</InputLabel>
                          <Select
                            value={exportConfig.filters.package_id}
                            label="Paket Umroh"
                            onChange={(e) => handleFilterChange('package_id', e.target.value)}
                          >
                            <MenuItem value="">Semua Paket</MenuItem>
                            {packages.map((pkg) => (
                              <MenuItem key={pkg.id} value={pkg.id}>
                                {pkg.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    
                    {(dataType === 'payments' || dataType === 'documents') && (
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Status Verifikasi</InputLabel>
                          <Select
                            value={exportConfig.filters.verification_status}
                            label="Status Verifikasi"
                            onChange={(e) => handleFilterChange('verification_status', e.target.value)}
                          >
                            <MenuItem value="">Semua Status</MenuItem>
                            <MenuItem value="pending">Menunggu</MenuItem>
                            <MenuItem value="verified">Terverifikasi</MenuItem>
                            <MenuItem value="rejected">Ditolak</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Column Selection */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  {renderColumnSelection()}
                </CardContent>
              </Card>
            </Grid>

            {/* Summary */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Ringkasan Export:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`Format: ${exportConfig.format.toUpperCase()}`} size="small" />
                  <Chip label={`Data: ${getDataTypeLabel()}`} size="small" />
                  {exportConfig.filters.package_id && (
                    <Chip label="Dengan Filter Paket" size="small" />
                  )}
                  {exportConfig.dateRange.start && (
                    <Chip label="Dengan Filter Tanggal" size="small" />
                  )}
                </Box>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {loading ? 'Mengexport...' : 'Export Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ExcelExportDialog;
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const PaymentForm = ({ payment: editingPayment, onSuccess, onCancel }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jamaahOptions, setJamaahOptions] = useState([]);
  const [packagesOptions, setPackagesOptions] = useState([]);
  const [loadingJamaah, setLoadingJamaah] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  
  const [formData, setFormData] = useState({
    jamaah_id: '',
    package_id: '',
    amount: '',
    payment_date: new Date(),
    payment_method: '',
    reference_number: '',
    bank_name: '',
    account_number: '',
    notes: '',
    receipt_file: '',
    verification_status: 'pending'
  });

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        jamaah_id: editingPayment.jamaah_id || '',
        package_id: editingPayment.package_id || '',
        amount: editingPayment.amount || '',
        payment_date: editingPayment.payment_date ? new Date(editingPayment.payment_date) : new Date(),
        payment_method: editingPayment.payment_method || '',
        reference_number: editingPayment.reference_number || '',
        bank_name: editingPayment.bank_name || '',
        account_number: editingPayment.account_number || '',
        notes: editingPayment.notes || '',
        receipt_file: editingPayment.receipt_file || '',
        verification_status: editingPayment.verification_status || 'pending'
      });
      
      // Load selected jamaah info
      if (editingPayment.jamaah_id) {
        loadJamaahById(editingPayment.jamaah_id);
      }
    }
    loadPackages();
  }, [editingPayment]);

  const loadJamaahById = async (jamaahId) => {
    try {
      const response = await axios.get(`/api/jamaah/${jamaahId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJamaahOptions([{
        id: response.data.id,
        label: `${response.data.full_name} (${response.data.nik})`,
        ...response.data
      }]);
    } catch (error) {
      console.error('Failed to load jamaah:', error);
    }
  };

  const loadJamaah = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) {
      setJamaahOptions([]);
      return;
    }

    setLoadingJamaah(true);
    try {
      const response = await axios.get('/api/jamaah', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: inputValue, limit: 20 }
      });
      
      const options = response.data.jamaah.map(j => ({
        id: j.id,
        label: `${j.full_name} (${j.nik})`,
        ...j
      }));
      setJamaahOptions(options);
    } catch (error) {
      console.error('Failed to load jamaah:', error);
    } finally {
      setLoadingJamaah(false);
    }
  };

  const loadPackages = async () => {
    setLoadingPackages(true);
    try {
      const response = await axios.get('/api/packages', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100, active_only: true }
      });
      setPackagesOptions(response.data.packages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFormData({ ...formData, [field]: value });
  };

  const handleJamaahChange = (event, value) => {
    setFormData({ 
      ...formData, 
      jamaah_id: value ? value.id : '',
      package_id: value?.package_id || formData.package_id // Auto-select package if jamaah has one
    });
  };

  const handleDateChange = (field) => (date) => {
    setFormData({ ...formData, [field]: date });
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PAY${timestamp}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        payment_date: formData.payment_date ? formData.payment_date.toISOString().split('T')[0] : null,
        amount: parseFloat(formData.amount) || 0,
        reference_number: formData.reference_number || generateReferenceNumber()
      };

      if (editingPayment) {
        await axios.put(`/api/payments/${editingPayment.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/payments', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    'Transfer Bank',
    'Virtual Account',
    'E-Wallet',
    'Kartu Kredit',
    'Cash',
    'Cicilan',
    'Lainnya'
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={jamaahOptions}
              getOptionLabel={(option) => option.label || ''}
              value={jamaahOptions.find(j => j.id === formData.jamaah_id) || null}
              onChange={handleJamaahChange}
              onInputChange={(event, value) => loadJamaah(value)}
              loading={loadingJamaah}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pilih Jamaah"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingJamaah ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Paket Umroh</InputLabel>
              <Select
                value={formData.package_id}
                label="Paket Umroh"
                onChange={handleChange('package_id')}
                disabled={loadingPackages}
              >
                {packagesOptions.map((pkg) => (
                  <MenuItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(pkg.price)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Jumlah Pembayaran"
              type="number"
              value={formData.amount}
              onChange={handleChange('amount')}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                inputProps: { min: 0 }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Tanggal Pembayaran"
              value={formData.payment_date}
              onChange={handleDateChange('payment_date')}
              renderInput={(params) => <TextField {...params} fullWidth required />}
              inputFormat="dd/MM/yyyy"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Metode Pembayaran</InputLabel>
              <Select
                value={formData.payment_method}
                label="Metode Pembayaran"
                onChange={handleChange('payment_method')}
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nomor Referensi"
              value={formData.reference_number}
              onChange={handleChange('reference_number')}
              placeholder="Akan dibuat otomatis jika kosong"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nama Bank"
              value={formData.bank_name}
              onChange={handleChange('bank_name')}
              placeholder="Contoh: BCA, Mandiri, BRI"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nomor Rekening"
              value={formData.account_number}
              onChange={handleChange('account_number')}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="URL Bukti Transfer"
              value={formData.receipt_file}
              onChange={handleChange('receipt_file')}
              placeholder="https://drive.google.com/file/d/xxx atau URL gambar"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Catatan"
              value={formData.notes}
              onChange={handleChange('notes')}
              placeholder="Catatan tambahan mengenai pembayaran"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status Verifikasi</InputLabel>
              <Select
                value={formData.verification_status}
                label="Status Verifikasi"
                onChange={handleChange('verification_status')}
              >
                <MenuItem value="pending">Menunggu Verifikasi</MenuItem>
                <MenuItem value="verified">Terverifikasi</MenuItem>
                <MenuItem value="rejected">Ditolak</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingPayment ? 'Simpan Perubahan' : 'Catat Pembayaran')}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default PaymentForm;
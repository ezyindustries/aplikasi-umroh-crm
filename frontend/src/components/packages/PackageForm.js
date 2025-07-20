import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  InputAdornment,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const PackageForm = ({ package: editingPackage, onSuccess, onCancel }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    departure_date: null,
    return_date: null,
    airline: '',
    flight_number: '',
    transit_city: '',
    seat_count: '',
    medina_hotel: '',
    makkah_hotel: '',
    price: '',
    description: '',
    brochure_image: '',
    is_active: true
  });

  useEffect(() => {
    if (editingPackage) {
      setFormData({
        name: editingPackage.name || '',
        departure_date: editingPackage.departure_date ? new Date(editingPackage.departure_date) : null,
        return_date: editingPackage.return_date ? new Date(editingPackage.return_date) : null,
        airline: editingPackage.airline || '',
        flight_number: editingPackage.flight_number || '',
        transit_city: editingPackage.transit_city || '',
        seat_count: editingPackage.seat_count || '',
        medina_hotel: editingPackage.medina_hotel || '',
        makkah_hotel: editingPackage.makkah_hotel || '',
        price: editingPackage.price || '',
        description: editingPackage.description || '',
        brochure_image: editingPackage.brochure_image || '',
        is_active: editingPackage.is_active !== false
      });
    }
  }, [editingPackage]);

  const handleChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFormData({ ...formData, [field]: value });
  };

  const handleDateChange = (field) => (date) => {
    setFormData({ ...formData, [field]: date });
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        departure_date: formData.departure_date ? formData.departure_date.toISOString().split('T')[0] : null,
        return_date: formData.return_date ? formData.return_date.toISOString().split('T')[0] : null,
        seat_count: parseInt(formData.seat_count) || 0,
        price: parseFloat(formData.price) || 0
      };

      if (editingPackage) {
        await axios.put(`/api/packages/${editingPackage.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/packages', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan paket');
    } finally {
      setLoading(false);
    }
  };

  const validateDates = () => {
    if (formData.departure_date && formData.return_date) {
      return formData.return_date >= formData.departure_date;
    }
    return true;
  };

  const calculateDuration = () => {
    if (formData.departure_date && formData.return_date) {
      const diffTime = Math.abs(formData.return_date - formData.departure_date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} hari`;
    }
    return '-';
  };

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
            <TextField
              fullWidth
              label="Nama Paket"
              value={formData.name}
              onChange={handleChange('name')}
              required
              placeholder="Contoh: Umroh Ramadhan 2024"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Tanggal Keberangkatan"
              value={formData.departure_date}
              onChange={handleDateChange('departure_date')}
              renderInput={(params) => <TextField {...params} fullWidth required />}
              inputFormat="dd/MM/yyyy"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Tanggal Kepulangan"
              value={formData.return_date}
              onChange={handleDateChange('return_date')}
              renderInput={(params) => <TextField {...params} fullWidth required />}
              inputFormat="dd/MM/yyyy"
              minDate={formData.departure_date}
            />
          </Grid>

          {formData.departure_date && formData.return_date && (
            <Grid item xs={12}>
              <Alert severity="info">
                Durasi perjalanan: {calculateDuration()}
                {!validateDates() && ' - Tanggal kepulangan harus setelah tanggal keberangkatan'}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Maskapai Penerbangan"
              value={formData.airline}
              onChange={handleChange('airline')}
              required
              placeholder="Contoh: Garuda Indonesia"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nomor Penerbangan"
              value={formData.flight_number}
              onChange={handleChange('flight_number')}
              placeholder="Contoh: GA 123"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Kota Transit"
              value={formData.transit_city}
              onChange={handleChange('transit_city')}
              placeholder="Contoh: Dubai, Doha (kosongkan jika direct)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Jumlah Kursi"
              type="number"
              value={formData.seat_count}
              onChange={handleChange('seat_count')}
              required
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Akomodasi Hotel
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Hotel Madinah"
              value={formData.medina_hotel}
              onChange={handleChange('medina_hotel')}
              required
              placeholder="Contoh: Millennium Aqeeq Hotel"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Hotel Makkah"
              value={formData.makkah_hotel}
              onChange={handleChange('makkah_hotel')}
              required
              placeholder="Contoh: Pullman Zamzam Makkah"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Harga Paket"
              type="number"
              value={formData.price}
              onChange={handleChange('price')}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                inputProps: { min: 0 }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="URL Gambar Brosur"
              value={formData.brochure_image}
              onChange={handleChange('brochure_image')}
              placeholder="https://example.com/brochure.jpg"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Deskripsi Paket"
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Deskripsi fasilitas, include/exclude, dll"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleSwitchChange('is_active')}
                />
              }
              label="Paket Aktif"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !validateDates()}
          >
            {loading ? <CircularProgress size={24} /> : (editingPackage ? 'Simpan Perubahan' : 'Tambah Paket')}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default PackageForm;
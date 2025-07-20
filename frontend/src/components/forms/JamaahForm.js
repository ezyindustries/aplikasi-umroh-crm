import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { id } from 'date-fns/locale';
import { jamaahAPI } from '../../services/api';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const steps = [
  'Data Pribadi',
  'Data Paspor',
  'Informasi Tambahan',
  'Review & Submit'
];

const JamaahForm = ({ jamaahId, onSuccess, onCancel }) => {
  const { token } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [nikCheck, setNikCheck] = useState({ loading: false, exists: false });
  const [passportCheck, setPassportCheck] = useState({ loading: false, exists: false });
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
    trigger
  } = useForm({
    defaultValues: {
      full_name: '',
      nik: '',
      birth_place: '',
      birth_date: null,
      gender: '',
      marital_status: '',
      address: '',
      phone: '',
      email: '',
      emergency_contact: '',
      emergency_phone: '',
      passport_number: '',
      passport_issue_date: null,
      passport_expiry_date: null,
      passport_issue_place: '',
      package_id: '',
      medical_notes: '',
      is_elderly: false,
      special_needs: ''
    }
  });

  const watchedNik = watch('nik');
  const watchedPassport = watch('passport_number');

  // Load existing data if editing
  useEffect(() => {
    if (jamaahId) {
      loadJamaahData();
    }
    loadPackages();
  }, [jamaahId]);

  // Check NIK uniqueness
  useEffect(() => {
    if (watchedNik && watchedNik.length === 16) {
      checkNikUniqueness(watchedNik);
    }
  }, [watchedNik]);

  // Check passport uniqueness
  useEffect(() => {
    if (watchedPassport && watchedPassport.length > 0) {
      checkPassportUniqueness(watchedPassport);
    }
  }, [watchedPassport]);

  const loadJamaahData = async () => {
    setLoading(true);
    try {
      const response = await jamaahAPI.getById(jamaahId);
      const jamaah = response.data;
      
      // Set form values
      Object.keys(jamaah).forEach(key => {
        if (key.includes('_date') && jamaah[key]) {
          setValue(key, new Date(jamaah[key]));
        } else {
          setValue(key, jamaah[key]);
        }
      });
    } catch (error) {
      toast.error('Gagal memuat data jamaah');
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    setPackagesLoading(true);
    try {
      const response = await axios.get('/api/packages', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100, active_only: true }
      });
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setPackagesLoading(false);
    }
  };

  const checkNikUniqueness = async (nik) => {
    setNikCheck({ loading: true, exists: false });
    try {
      const response = await jamaahAPI.checkNik(nik);
      const exists = response.data.exists && 
        (!jamaahId || response.data.jamaah?.id !== parseInt(jamaahId));
      setNikCheck({ loading: false, exists });
    } catch (error) {
      setNikCheck({ loading: false, exists: false });
    }
  };

  const checkPassportUniqueness = async (passport) => {
    setPassportCheck({ loading: true, exists: false });
    try {
      const response = await jamaahAPI.checkPassport(passport);
      const exists = response.data.exists && 
        (!jamaahId || response.data.jamaah?.id !== parseInt(jamaahId));
      setPassportCheck({ loading: false, exists });
    } catch (error) {
      setPassportCheck({ loading: false, exists: false });
    }
  };

  const validateNik = (value) => {
    if (!value) return 'NIK wajib diisi';
    if (value.length !== 16) return 'NIK harus 16 digit';
    if (!/^\d+$/.test(value)) return 'NIK hanya boleh berisi angka';
    if (nikCheck.exists) return 'NIK sudah terdaftar';
    return true;
  };

  const validatePassport = (value) => {
    if (value && passportCheck.exists) return 'Nomor paspor sudah terdaftar';
    return true;
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid && !nikCheck.exists && !passportCheck.exists) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getFieldsForStep = (step) => {
    switch (step) {
      case 0:
        return ['full_name', 'nik', 'birth_place', 'birth_date', 'gender', 'marital_status', 'address', 'phone', 'email', 'package_id'];
      case 1:
        return ['passport_number', 'passport_issue_date', 'passport_expiry_date', 'passport_issue_place'];
      case 2:
        return ['emergency_contact', 'emergency_phone', 'medical_notes', 'special_needs'];
      default:
        return [];
    }
  };

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      // Format dates
      const formattedData = {
        ...data,
        birth_date: data.birth_date ? data.birth_date.toISOString().split('T')[0] : null,
        passport_issue_date: data.passport_issue_date ? data.passport_issue_date.toISOString().split('T')[0] : null,
        passport_expiry_date: data.passport_expiry_date ? data.passport_expiry_date.toISOString().split('T')[0] : null,
      };

      if (jamaahId) {
        await jamaahAPI.update(jamaahId, formattedData);
        toast.success('Data jamaah berhasil diperbarui');
      } else {
        await jamaahAPI.create(formattedData);
        toast.success('Data jamaah berhasil ditambahkan');
      }
      
      onSuccess && onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderPersonalDataStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Data Pribadi
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Controller
          name="full_name"
          control={control}
          rules={{ required: 'Nama lengkap wajib diisi' }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nama Lengkap"
              error={!!errors.full_name}
              helperText={errors.full_name?.message}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="nik"
          control={control}
          rules={{ validate: validateNik }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="NIK"
              inputProps={{ maxLength: 16 }}
              error={!!errors.nik || nikCheck.exists}
              helperText={
                errors.nik?.message || 
                (nikCheck.loading ? 'Memeriksa...' : '') ||
                (nikCheck.exists ? 'NIK sudah terdaftar' : '')
              }
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="birth_place"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Tempat Lahir"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="birth_date"
          control={control}
          render={({ field }) => (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
              <DatePicker
                label="Tanggal Lahir"
                value={field.value}
                onChange={field.onChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="gender"
          control={control}
          rules={{ required: 'Jenis kelamin wajib dipilih' }}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Jenis Kelamin</InputLabel>
              <Select {...field} label="Jenis Kelamin">
                <MenuItem value="M">Laki-laki</MenuItem>
                <MenuItem value="F">Perempuan</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="marital_status"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Status Pernikahan</InputLabel>
              <Select {...field} label="Status Pernikahan">
                <MenuItem value="single">Belum Menikah</MenuItem>
                <MenuItem value="married">Menikah</MenuItem>
                <MenuItem value="divorced">Cerai</MenuItem>
                <MenuItem value="widowed">Janda/Duda</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Alamat"
              multiline
              rows={3}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nomor Telepon"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="email"
          control={control}
          rules={{
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Format email tidak valid'
            }
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Email"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Pilihan Paket
          </Typography>
        </Divider>
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="package_id"
          control={control}
          rules={{ required: 'Paket umroh wajib dipilih' }}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.package_id}>
              <InputLabel>Paket Umroh</InputLabel>
              <Select 
                {...field} 
                label="Paket Umroh"
                disabled={packagesLoading}
              >
                {packagesLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} /> Loading...
                  </MenuItem>
                ) : packages.length === 0 ? (
                  <MenuItem disabled>
                    Tidak ada paket tersedia
                  </MenuItem>
                ) : (
                  packages.map((pkg) => (
                    <MenuItem key={pkg.id} value={pkg.id}>
                      <Box>
                        <Typography variant="body1">
                          {pkg.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(pkg.departure_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} - Rp {pkg.price?.toLocaleString('id-ID')}
                        </Typography>
                        {pkg.jamaah_count >= pkg.seat_count && (
                          <Typography variant="caption" color="error" display="block">
                            (Kuota penuh)
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.package_id && (
                <Typography variant="caption" color="error">
                  {errors.package_id.message}
                </Typography>
              )}
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  );

  const renderPassportDataStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Data Paspor
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="passport_number"
          control={control}
          rules={{ validate: validatePassport }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nomor Paspor"
              error={!!errors.passport_number || passportCheck.exists}
              helperText={
                errors.passport_number?.message ||
                (passportCheck.loading ? 'Memeriksa...' : '') ||
                (passportCheck.exists ? 'Nomor paspor sudah terdaftar' : '')
              }
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="passport_issue_place"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Tempat Terbit Paspor"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="passport_issue_date"
          control={control}
          render={({ field }) => (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
              <DatePicker
                label="Tanggal Terbit Paspor"
                value={field.value}
                onChange={field.onChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="passport_expiry_date"
          control={control}
          render={({ field }) => (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
              <DatePicker
                label="Tanggal Kadaluarsa Paspor"
                value={field.value}
                onChange={field.onChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          )}
        />
      </Grid>
    </Grid>
  );

  const renderAdditionalInfoStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Informasi Tambahan
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="emergency_contact"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Kontak Darurat"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="emergency_phone"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Telepon Darurat"
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="medical_notes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Catatan Medis"
              multiline
              rows={3}
              placeholder="Riwayat penyakit, alergi, atau kondisi medis khusus"
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="special_needs"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Kebutuhan Khusus"
              multiline
              rows={2}
              placeholder="Kebutuhan diet, mobilitas, atau bantuan khusus lainnya"
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="is_elderly"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Jamaah Lansia (memerlukan perhatian khusus)"
            />
          )}
        />
      </Grid>
    </Grid>
  );

  const renderReviewStep = () => {
    const formData = getValues();
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Review Data
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Silakan periksa kembali data yang telah diisi sebelum menyimpan.
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Data Pribadi
              </Typography>
              <Typography variant="body2">Nama: {formData.full_name}</Typography>
              <Typography variant="body2">NIK: {formData.nik}</Typography>
              <Typography variant="body2">
                Jenis Kelamin: {formData.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
              </Typography>
              <Typography variant="body2">
                Tanggal Lahir: {formData.birth_date ? formData.birth_date.toLocaleDateString('id-ID') : '-'}
              </Typography>
              <Typography variant="body2">Telepon: {formData.phone || '-'}</Typography>
              <Typography variant="body2">Email: {formData.email || '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Data Paspor
              </Typography>
              <Typography variant="body2">Nomor: {formData.passport_number || '-'}</Typography>
              <Typography variant="body2">Tempat Terbit: {formData.passport_issue_place || '-'}</Typography>
              <Typography variant="body2">
                Tanggal Terbit: {formData.passport_issue_date ? formData.passport_issue_date.toLocaleDateString('id-ID') : '-'}
              </Typography>
              <Typography variant="body2">
                Kadaluarsa: {formData.passport_expiry_date ? formData.passport_expiry_date.toLocaleDateString('id-ID') : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Paket Umroh
              </Typography>
              <Typography variant="body2">
                {packages.find(p => p.id === formData.package_id)?.name || '-'}
              </Typography>
              {packages.find(p => p.id === formData.package_id) && (
                <Typography variant="caption" color="text.secondary">
                  Keberangkatan: {new Date(packages.find(p => p.id === formData.package_id).departure_date).toLocaleDateString('id-ID')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {(formData.medical_notes || formData.special_needs || formData.is_elderly) && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Informasi Tambahan
                </Typography>
                {formData.medical_notes && (
                  <Typography variant="body2">Catatan Medis: {formData.medical_notes}</Typography>
                )}
                {formData.special_needs && (
                  <Typography variant="body2">Kebutuhan Khusus: {formData.special_needs}</Typography>
                )}
                {formData.is_elderly && (
                  <Typography variant="body2" color="warning.main">⚠️ Jamaah Lansia</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderPersonalDataStep();
      case 1:
        return renderPassportDataStep();
      case 2:
        return renderAdditionalInfoStep();
      case 3:
        return renderReviewStep();
      default:
        return 'Unknown step';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {jamaahId ? 'Edit Data Jamaah' : 'Tambah Jamaah Baru'}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit(onSubmit)}>
          {getStepContent(activeStep)}

          <Divider sx={{ my: 3 }} />

          <Box display="flex" justifyContent="space-between">
            <Button
              onClick={onCancel}
              disabled={submitLoading}
            >
              Batal
            </Button>

            <Box>
              {activeStep > 0 && (
                <Button
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                  disabled={submitLoading}
                >
                  Kembali
                </Button>
              )}
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitLoading || nikCheck.exists || passportCheck.exists}
                  startIcon={submitLoading ? <CircularProgress size={20} /> : null}
                >
                  {submitLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={nikCheck.loading || passportCheck.loading || nikCheck.exists || passportCheck.exists}
                >
                  Selanjutnya
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default JamaahForm;
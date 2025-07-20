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
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  InputAdornment,
  Avatar,
  Stack,
  useTheme,
  alpha,
  Collapse,
  LinearProgress
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  LocationOn,
  Cake,
  Badge as BadgeIcon,
  CheckCircle,
  Error,
  Save,
  Cancel,
  NavigateNext,
  NavigateBefore,
  Flight,
  Hotel
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { id } from 'date-fns/locale';
import { jamaahAPI, packagesAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { glassEffect, modernShadow, gradientText } from '../../theme/modernTheme';

const MotionPaper = motion(Paper);
const MotionCard = motion(Card);
const MotionBox = motion(Box);

const steps = [
  {
    label: 'Data Pribadi',
    description: 'Informasi dasar jamaah',
    icon: <Person />
  },
  {
    label: 'Data Paspor',
    description: 'Informasi paspor dan visa',
    icon: <Flight />
  },
  {
    label: 'Informasi Tambahan',
    description: 'Detail kontak dan akomodasi',
    icon: <Hotel />
  },
  {
    label: 'Review & Submit',
    description: 'Periksa dan simpan data',
    icon: <Save />
  }
];

const ModernJamaahForm = ({ jamaahId, onSuccess, onCancel }) => {
  const theme = useTheme();
  const { token } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [nikCheck, setNikCheck] = useState({ loading: false, exists: false, valid: null });
  const [passportCheck, setPassportCheck] = useState({ loading: false, exists: false, valid: null });
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { control, handleSubmit, watch, setValue, formState: { errors, isValid, dirtyFields } } = useForm({
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      nik: '',
      gender: '',
      birth_place: '',
      birth_date: null,
      nationality: 'Indonesian',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      phone: '',
      email: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      passport_number: '',
      passport_issued_date: null,
      passport_expiry: null,
      passport_issued_place: '',
      package_id: '',
      special_requests: '',
      medical_conditions: '',
      dietary_restrictions: '',
      room_preference: 'double',
      mahram_name: '',
      mahram_relationship: '',
      mahram_phone: ''
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadPackages();
    if (jamaahId) {
      loadJamaahData();
    }
  }, [jamaahId]);

  const loadPackages = async () => {
    setPackagesLoading(true);
    try {
      const response = await packagesAPI.getAll();
      setPackages(response.data.data || []);
    } catch (error) {
      toast.error('Gagal memuat data paket');
    } finally {
      setPackagesLoading(false);
    }
  };

  const loadJamaahData = async () => {
    setLoading(true);
    try {
      const response = await jamaahAPI.getById(jamaahId);
      const jamaah = response.data;
      
      Object.keys(jamaah).forEach(key => {
        if (jamaah[key] !== null && jamaah[key] !== undefined) {
          setValue(key, jamaah[key]);
        }
      });
    } catch (error) {
      toast.error('Gagal memuat data jamaah');
    } finally {
      setLoading(false);
    }
  };

  const checkNikUniqueness = async (nik) => {
    if (!nik || nik.length !== 16) {
      setNikCheck({ loading: false, exists: false, valid: false });
      return;
    }

    setNikCheck({ loading: true, exists: false, valid: null });
    try {
      const response = await jamaahAPI.checkUniqueness({ nik, exclude_id: jamaahId });
      setNikCheck({ 
        loading: false, 
        exists: response.data.exists, 
        valid: !response.data.exists 
      });
    } catch (error) {
      setNikCheck({ loading: false, exists: false, valid: null });
    }
  };

  const checkPassportUniqueness = async (passportNumber) => {
    if (!passportNumber) {
      setPassportCheck({ loading: false, exists: false, valid: null });
      return;
    }

    setPassportCheck({ loading: true, exists: false, valid: null });
    try {
      const response = await jamaahAPI.checkUniqueness({ 
        passport_number: passportNumber, 
        exclude_id: jamaahId 
      });
      setPassportCheck({ 
        loading: false, 
        exists: response.data.exists, 
        valid: !response.data.exists 
      });
    } catch (error) {
      setPassportCheck({ loading: false, exists: false, valid: null });
    }
  };

  const validateStep = (step) => {
    const stepFields = {
      0: ['full_name', 'nik', 'gender', 'birth_place', 'birth_date'],
      1: ['passport_number', 'passport_issued_date', 'passport_expiry'],
      2: ['phone', 'email', 'address'],
      3: []
    };

    const fieldsToCheck = stepFields[step] || [];
    return fieldsToCheck.every(field => !errors[field] && watchedValues[field]);
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      toast.error('Mohon lengkapi semua field yang diperlukan');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      if (jamaahId) {
        await jamaahAPI.update(jamaahId, data);
        toast.success('Data jamaah berhasil diperbarui');
      } else {
        await jamaahAPI.create(data);
        toast.success('Data jamaah berhasil disimpan');
      }
      onSuccess && onSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Gagal menyimpan data';
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const getFieldIcon = (fieldName) => {
    const iconMap = {
      full_name: <Person />,
      nik: <BadgeIcon />,
      phone: <Phone />,
      email: <Email />,
      address: <LocationOn />,
      birth_place: <LocationOn />,
      birth_date: <Cake />,
      passport_number: <Flight />,
    };
    return iconMap[fieldName];
  };

  const getValidationIcon = (fieldName, value) => {
    if (fieldName === 'nik' && nikCheck.loading) {
      return <CircularProgress size={20} />;
    }
    if (fieldName === 'nik' && nikCheck.valid === true) {
      return <CheckCircle color="success" />;
    }
    if (fieldName === 'nik' && nikCheck.valid === false) {
      return <Error color="error" />;
    }
    if (fieldName === 'passport_number' && passportCheck.loading) {
      return <CircularProgress size={20} />;
    }
    if (fieldName === 'passport_number' && passportCheck.valid === true) {
      return <CheckCircle color="success" />;
    }
    if (fieldName === 'passport_number' && passportCheck.valid === false) {
      return <Error color="error" />;
    }
    
    if (errors[fieldName]) {
      return <Error color="error" />;
    }
    if (dirtyFields[fieldName] && value && !errors[fieldName]) {
      return <CheckCircle color="success" />;
    }
    return null;
  };

  const renderPersonalDataStep = () => (
    <MotionBox
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Data Pribadi
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Masukkan informasi pribadi jamaah dengan lengkap dan benar
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <Controller
            name="full_name"
            control={control}
            rules={{ required: 'Nama lengkap wajib diisi' }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap sesuai KTP"
                error={!!errors.full_name}
                helperText={errors.full_name?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {getFieldIcon('full_name')}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {getValidationIcon('full_name', field.value)}
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Controller
            name="gender"
            control={control}
            rules={{ required: 'Jenis kelamin wajib dipilih' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel>Jenis Kelamin</InputLabel>
                <Select
                  {...field}
                  label="Jenis Kelamin"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="M">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>♂</Avatar>
                      <span>Laki-laki</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="F">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>♀</Avatar>
                      <span>Perempuan</span>
                    </Stack>
                  </MenuItem>
                </Select>
                {errors.gender && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.gender.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="nik"
            control={control}
            rules={{ 
              required: 'NIK wajib diisi',
              pattern: {
                value: /^\d{16}$/,
                message: 'NIK harus 16 digit angka'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="NIK (Nomor Induk Kependudukan)"
                placeholder="1234567890123456"
                error={!!errors.nik || nikCheck.exists}
                helperText={
                  errors.nik?.message || 
                  (nikCheck.exists ? 'NIK sudah terdaftar' : '') ||
                  (nikCheck.valid ? 'NIK tersedia' : '')
                }
                onChange={(e) => {
                  field.onChange(e);
                  const value = e.target.value;
                  if (value.length === 16) {
                    checkNikUniqueness(value);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {getFieldIcon('nik')}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {getValidationIcon('nik', field.value)}
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="phone"
            control={control}
            rules={{ 
              required: 'Nomor telepon wajib diisi',
              pattern: {
                value: /^(\+62|62|0)[0-9]{8,13}$/,
                message: 'Format nomor telepon tidak valid'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nomor Telepon"
                placeholder="08123456789"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {getFieldIcon('phone')}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {getValidationIcon('phone', field.value)}
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="birth_place"
            control={control}
            rules={{ required: 'Tempat lahir wajib diisi' }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Tempat Lahir"
                placeholder="Jakarta"
                error={!!errors.birth_place}
                helperText={errors.birth_place?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {getFieldIcon('birth_place')}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {getValidationIcon('birth_place', field.value)}
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="birth_date"
            control={control}
            rules={{ required: 'Tanggal lahir wajib diisi' }}
            render={({ field }) => (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
                <DatePicker
                  {...field}
                  label="Tanggal Lahir"
                  inputFormat="dd/MM/yyyy"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.birth_date}
                      helperText={errors.birth_date?.message}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="address"
            control={control}
            rules={{ required: 'Alamat wajib diisi' }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label="Alamat Lengkap"
                placeholder="Masukkan alamat lengkap sesuai KTP"
                error={!!errors.address}
                helperText={errors.address?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      {getFieldIcon('address')}
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>
      </Grid>
    </MotionBox>
  );

  const renderPassportDataStep = () => (
    <MotionBox
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Data Paspor
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Masukkan informasi paspor untuk keperluan visa dan perjalanan
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="passport_number"
            control={control}
            rules={{ 
              required: 'Nomor paspor wajib diisi',
              pattern: {
                value: /^[A-Z]\d{7}$/,
                message: 'Format paspor tidak valid (contoh: A1234567)'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nomor Paspor"
                placeholder="A1234567"
                error={!!errors.passport_number || passportCheck.exists}
                helperText={
                  errors.passport_number?.message || 
                  (passportCheck.exists ? 'Nomor paspor sudah terdaftar' : '') ||
                  (passportCheck.valid ? 'Nomor paspor tersedia' : '')
                }
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  field.onChange(value);
                  if (value.length >= 8) {
                    checkPassportUniqueness(value);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {getFieldIcon('passport_number')}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {getValidationIcon('passport_number', field.value)}
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="passport_issued_place"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Tempat Terbit Paspor"
                placeholder="Jakarta"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="passport_issued_date"
            control={control}
            rules={{ required: 'Tanggal terbit paspor wajib diisi' }}
            render={({ field }) => (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
                <DatePicker
                  {...field}
                  label="Tanggal Terbit Paspor"
                  inputFormat="dd/MM/yyyy"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.passport_issued_date}
                      helperText={errors.passport_issued_date?.message}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="passport_expiry"
            control={control}
            rules={{ required: 'Tanggal kadaluarsa paspor wajib diisi' }}
            render={({ field }) => (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
                <DatePicker
                  {...field}
                  label="Tanggal Kadaluarsa Paspor"
                  inputFormat="dd/MM/yyyy"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.passport_expiry}
                      helperText={errors.passport_expiry?.message}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>

        {/* Passport validity check */}
        {watchedValues.passport_expiry && (
          <Grid item xs={12}>
            <Alert 
              severity={
                new Date(watchedValues.passport_expiry) > new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) 
                  ? 'success' 
                  : 'warning'
              }
              sx={{ borderRadius: 2 }}
            >
              {new Date(watchedValues.passport_expiry) > new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                ? 'Paspor masih berlaku untuk perjalanan umroh'
                : 'Perhatian: Paspor akan kadaluarsa dalam 6 bulan. Pastikan untuk memperpanjang sebelum keberangkatan.'
              }
            </Alert>
          </Grid>
        )}
      </Grid>
    </MotionBox>
  );

  const renderAdditionalInfoStep = () => (
    <MotionBox
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Informasi Tambahan
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Lengkapi informasi kontak dan preferensi akomodasi
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="email"
            control={control}
            rules={{ 
              required: 'Email wajib diisi',
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
                placeholder="nama@email.com"
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {getFieldIcon('email')}
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {getValidationIcon('email', field.value)}
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="package_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Paket Umroh</InputLabel>
                <Select
                  {...field}
                  label="Paket Umroh"
                  disabled={packagesLoading}
                  sx={{ borderRadius: 2 }}
                >
                  {packages.map((pkg) => (
                    <MenuItem key={pkg.id} value={pkg.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {pkg.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(pkg.price)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="emergency_contact_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nama Kontak Darurat"
                placeholder="Nama keluarga yang dapat dihubungi"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="emergency_contact_phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Telepon Kontak Darurat"
                placeholder="08123456789"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="medical_conditions"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label="Kondisi Medis"
                placeholder="Tuliskan kondisi medis yang perlu diperhatikan (opsional)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            )}
          />
        </Grid>
      </Grid>
    </MotionBox>
  );

  const renderReviewStep = () => (
    <MotionBox
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Review Data
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Periksa kembali semua data sebelum menyimpan
      </Typography>

      <Stack spacing={3}>
        {/* Personal Data Card */}
        <MotionCard
          sx={{ ...glassEffect }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Data Pribadi
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Nama:</Typography>
                <Typography variant="body2" fontWeight={600}>{watchedValues.full_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">NIK:</Typography>
                <Typography variant="body2" fontWeight={600}>{watchedValues.nik}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Jenis Kelamin:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {watchedValues.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Telepon:</Typography>
                <Typography variant="body2" fontWeight={600}>{watchedValues.phone}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </MotionCard>

        {/* Passport Data Card */}
        <MotionCard
          sx={{ ...glassEffect }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Data Paspor
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Nomor Paspor:</Typography>
                <Typography variant="body2" fontWeight={600}>{watchedValues.passport_number}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Kadaluarsa:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {watchedValues.passport_expiry ? new Date(watchedValues.passport_expiry).toLocaleDateString('id-ID') : '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </MotionCard>

        {/* Progress Bar */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Kelengkapan Data
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={85} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }
            }} 
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            85% data telah lengkap
          </Typography>
        </Box>
      </Stack>
    </MotionBox>
  );

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
        return null;
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
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{ ...glassEffect, p: 4 }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          fontWeight={800}
          sx={{ ...gradientText, mb: 1 }}
        >
          {jamaahId ? 'Edit Data Jamaah' : 'Tambah Jamaah Baru'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Lengkapi formulir dengan data yang akurat dan valid
        </Typography>
      </Box>

      {/* Stepper */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                icon={
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: index <= activeStep ? 'primary.main' : 'grey.300',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  >
                    {index < activeStep ? <CheckCircle /> : step.icon}
                  </Avatar>
                }
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {step.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ minHeight: 400 }}>
          <AnimatePresence mode="wait">
            {getStepContent(activeStep)}
          </AnimatePresence>
        </Box>

        {/* Form Errors */}
        {Object.keys(formErrors).length > 0 && (
          <Collapse in={true}>
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Terdapat kesalahan pada form:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {Object.entries(formErrors).map(([field, errors]) => (
                  <li key={field}>
                    <Typography variant="body2">
                      {field}: {Array.isArray(errors) ? errors.join(', ') : errors}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          </Collapse>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={onCancel}
            variant="outlined"
            startIcon={<Cancel />}
            sx={{ borderRadius: 2 }}
          >
            Batal
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                variant="outlined"
                startIcon={<NavigateBefore />}
                sx={{ borderRadius: 2 }}
              >
                Kembali
              </Button>
            )}

            {activeStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="contained"
                endIcon={<NavigateNext />}
                disabled={!validateStep(activeStep)}
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }}
              >
                Lanjut
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={submitLoading || !isValid}
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`
                }}
              >
                {submitLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Menyimpan...
                  </>
                ) : (
                  jamaahId ? 'Perbarui Data' : 'Simpan Data'
                )}
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </MotionPaper>
  );
};

export default ModernJamaahForm;
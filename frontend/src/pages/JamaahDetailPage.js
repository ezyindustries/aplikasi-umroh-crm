import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  MoreVert,
  Person,
  ContactPage,
  Description,
  Payment,
  Group,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  FlightTakeoff,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth';
import { jamaahAPI } from '../services/api';

const JamaahDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [currentTab, setCurrentTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Fetch jamaah data
  const { data: jamaah, isLoading, error } = useQuery(
    ['jamaah', id],
    () => jamaahAPI.getById(id),
    {
      select: response => response.data,
      enabled: !!id
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(jamaahAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('jamaah');
      toast.success('Data jamaah berhasil dihapus');
      navigate('/jamaah');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal menghapus data');
    }
  });

  const handleEdit = () => {
    navigate(`/jamaah/${id}/edit`);
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    deleteMutation.mutate(id);
    setDeleteDialog(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'registered': 'default',
      'confirmed': 'primary',
      'departed': 'success',
      'cancelled': 'error',
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'error',
      'paid': 'success',
      'partial': 'warning',
      'unpaid': 'error'
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status, type) => {
    const labels = {
      jamaah_status: {
        'registered': 'Terdaftar',
        'confirmed': 'Konfirmasi',
        'departed': 'Berangkat',
        'cancelled': 'Batal'
      },
      visa_status: {
        'pending': 'Pending',
        'approved': 'Disetujui',
        'rejected': 'Ditolak'
      },
      payment_status: {
        'unpaid': 'Belum Bayar',
        'partial': 'Sebagian',
        'paid': 'Lunas'
      }
    };
    return labels[type]?.[status] || status;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !jamaah) {
    return (
      <Box>
        <Alert severity="error">
          Gagal memuat data jamaah. Silakan kembali dan coba lagi.
        </Alert>
      </Box>
    );
  }

  const PersonalInfoTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informasi Pribadi
            </Typography>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Nama Lengkap
              </Typography>
              <Typography variant="body1">
                {jamaah.full_name}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                NIK
              </Typography>
              <Typography variant="body1">
                {jamaah.nik}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Jenis Kelamin
              </Typography>
              <Typography variant="body1">
                {jamaah.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Tempat, Tanggal Lahir
              </Typography>
              <Typography variant="body1">
                {jamaah.birth_place}, {formatDate(jamaah.birth_date)}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Status Pernikahan
              </Typography>
              <Typography variant="body1">
                {jamaah.marital_status || '-'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kontak
            </Typography>
            <Box mb={2} display="flex" alignItems="center">
              <Phone sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Telepon
                </Typography>
                <Typography variant="body1">
                  {jamaah.phone || '-'}
                </Typography>
              </Box>
            </Box>
            <Box mb={2} display="flex" alignItems="center">
              <Email sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {jamaah.email || '-'}
                </Typography>
              </Box>
            </Box>
            <Box mb={2} display="flex" alignItems="flex-start">
              <LocationOn sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Alamat
                </Typography>
                <Typography variant="body1">
                  {jamaah.address || '-'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kontak Darurat
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nama Kontak Darurat
                </Typography>
                <Typography variant="body1">
                  {jamaah.emergency_contact || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Telepon Darurat
                </Typography>
                <Typography variant="body1">
                  {jamaah.emergency_phone || '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const PassportInfoTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Paspor
            </Typography>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Nomor Paspor
              </Typography>
              <Typography variant="body1">
                {jamaah.passport_number || '-'}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Tempat Terbit
              </Typography>
              <Typography variant="body1">
                {jamaah.passport_issue_place || '-'}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Tanggal Terbit
              </Typography>
              <Typography variant="body1">
                {formatDate(jamaah.passport_issue_date)}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Tanggal Kadaluarsa
              </Typography>
              <Typography variant="body1">
                {formatDate(jamaah.passport_expiry_date)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Status Visa
            </Typography>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                size="small"
                color={getStatusColor(jamaah.visa_status)}
                label={getStatusLabel(jamaah.visa_status, 'visa_status')}
              />
            </Box>
            {jamaah.visa_number && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nomor Visa
                </Typography>
                <Typography variant="body1">
                  {jamaah.visa_number}
                </Typography>
              </Box>
            )}
            {jamaah.visa_issue_date && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tanggal Terbit Visa
                </Typography>
                <Typography variant="body1">
                  {formatDate(jamaah.visa_issue_date)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const MedicalInfoTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informasi Kesehatan
            </Typography>
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status Lansia
              </Typography>
              <Chip
                size="small"
                color={jamaah.is_elderly ? 'warning' : 'default'}
                icon={jamaah.is_elderly ? <Warning /> : <CheckCircle />}
                label={jamaah.is_elderly ? 'Ya' : 'Tidak'}
              />
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Catatan Medis
              </Typography>
              <Typography variant="body1">
                {jamaah.medical_notes || 'Tidak ada catatan medis'}
              </Typography>
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Kebutuhan Khusus
              </Typography>
              <Typography variant="body1">
                {jamaah.special_needs || 'Tidak ada kebutuhan khusus'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const StatusTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Status Jamaah
            </Typography>
            <Box textAlign="center">
              <Chip
                size="large"
                color={getStatusColor(jamaah.jamaah_status)}
                label={getStatusLabel(jamaah.jamaah_status, 'jamaah_status')}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Tanggal Registrasi: {formatDate(jamaah.registration_date)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Status Pembayaran
            </Typography>
            <Box textAlign="center">
              <Chip
                size="large"
                color={getStatusColor(jamaah.payment_status)}
                label={getStatusLabel(jamaah.payment_status, 'payment_status')}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Total: {formatCurrency(jamaah.total_payment)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sisa: {formatCurrency(jamaah.remaining_payment)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Paket & Grup
            </Typography>
            <Box textAlign="center">
              <Typography variant="body1" gutterBottom>
                {jamaah.package_name || 'Belum ditentukan'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Grup: {jamaah.group_number || 'Belum ditentukan'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bus: {jamaah.bus_number || 'Belum ditentukan'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kamar: {jamaah.room_number || 'Belum ditentukan'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/jamaah')}
            sx={{ mr: 2 }}
          >
            Kembali
          </Button>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {jamaah.full_name?.charAt(0) || 'J'}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {jamaah.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                NIK: {jamaah.nik}
              </Typography>
            </Box>
          </Box>
        </Box>

        {hasRole(['Admin', 'Marketing', 'Tim Visa']) && (
          <Box>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <Edit />
                </ListItemIcon>
                Edit Data
              </MenuItem>
              {hasRole(['Admin']) && (
                <MenuItem onClick={() => setDeleteDialog(true)}>
                  <ListItemIcon>
                    <Delete />
                  </ListItemIcon>
                  Hapus Data
                </MenuItem>
              )}
            </Menu>
          </Box>
        )}
      </Box>

      {/* Status Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Chip
                color={getStatusColor(jamaah.jamaah_status)}
                label={getStatusLabel(jamaah.jamaah_status, 'jamaah_status')}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Chip
                color={getStatusColor(jamaah.visa_status)}
                label={getStatusLabel(jamaah.visa_status, 'visa_status')}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Chip
                color={getStatusColor(jamaah.payment_status)}
                label={getStatusLabel(jamaah.payment_status, 'payment_status')}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab icon={<Person />} label="Data Pribadi" />
          <Tab icon={<ContactPage />} label="Paspor & Visa" />
          <Tab icon={<Description />} label="Kesehatan" />
          <Tab icon={<Info />} label="Status" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box mt={3}>
        {currentTab === 0 && <PersonalInfoTab />}
        {currentTab === 1 && <PassportInfoTab />}
        {currentTab === 2 && <MedicalInfoTab />}
        {currentTab === 3 && <StatusTab />}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus data jamaah{' '}
            <strong>{jamaah.full_name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JamaahDetailPage;
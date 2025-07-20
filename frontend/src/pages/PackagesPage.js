import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  TablePagination,
  Grid,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  AirplaneTicket as AirplaneIcon,
  Hotel as HotelIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import PackageForm from '../components/packages/PackageForm';

const PackagesPage = () => {
  const { token } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPackages, setTotalPackages] = useState(0);
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    totalSeats: 0,
    occupiedSeats: 0
  });

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/packages', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setPackages(response.data.packages);
      setTotalPackages(response.data.total);
      
      // Calculate stats
      const active = response.data.packages.filter(p => p.is_active).length;
      const totalSeats = response.data.packages.reduce((sum, p) => sum + (p.seat_count || 0), 0);
      const occupiedSeats = response.data.packages.reduce((sum, p) => sum + (p.jamaah_count || 0), 0);
      
      setStats({
        totalPackages: response.data.total,
        activePackages: active,
        totalSeats,
        occupiedSeats
      });
    } catch (error) {
      showSnackbar('Gagal memuat data paket', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [page, rowsPerPage, search]);

  const handleCreate = () => {
    setEditingPackage(null);
    setFormOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/packages/${packageToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Paket berhasil dihapus', 'success');
      fetchPackages();
      setDeleteConfirmOpen(false);
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Gagal menghapus paket', 'error');
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingPackage(null);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    fetchPackages();
    showSnackbar(editingPackage ? 'Paket berhasil diperbarui' : 'Paket berhasil dibuat', 'success');
  };

  const handleViewDetail = (pkg) => {
    setSelectedPackage(pkg);
    setDetailOpen(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Manajemen Paket Umroh
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Tambah Paket
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AirplaneIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Total Paket
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalPackages}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Paket Aktif
                </Typography>
              </Box>
              <Typography variant="h4">{stats.activePackages}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Total Kursi
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalSeats}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Kursi Terisi
                </Typography>
              </Box>
              <Typography variant="h4">{stats.occupiedSeats}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Cari nama paket, maskapai, atau hotel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            onClick={fetchPackages}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Packages Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nama Paket</TableCell>
              <TableCell>Tanggal Keberangkatan</TableCell>
              <TableCell>Maskapai</TableCell>
              <TableCell>Hotel Madinah</TableCell>
              <TableCell>Hotel Makkah</TableCell>
              <TableCell align="right">Harga</TableCell>
              <TableCell align="center">Kursi</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <Typography variant="subtitle2">{pkg.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {pkg.flight_number || '-'}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(pkg.departure_date)}</TableCell>
                <TableCell>{pkg.airline}</TableCell>
                <TableCell>{pkg.medina_hotel}</TableCell>
                <TableCell>{pkg.makkah_hotel}</TableCell>
                <TableCell align="right">{formatCurrency(pkg.price)}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${pkg.jamaah_count || 0}/${pkg.seat_count}`}
                    color={pkg.jamaah_count >= pkg.seat_count ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={pkg.is_active ? 'Aktif' : 'Nonaktif'}
                    color={pkg.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Detail">
                    <IconButton size="small" onClick={() => handleViewDetail(pkg)}>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(pkg)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hapus">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setPackageToDelete(pkg);
                        setDeleteConfirmOpen(true);
                      }}
                      disabled={pkg.jamaah_count > 0}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalPackages}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Baris per halaman:"
        />
      </TableContainer>

      {/* Package Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={handleFormClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPackage ? 'Edit Paket' : 'Tambah Paket Baru'}
        </DialogTitle>
        <DialogContent>
          <PackageForm
            package={editingPackage}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Package Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detail Paket</DialogTitle>
        <DialogContent>
          {selectedPackage && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Nama Paket</Typography>
                  <Typography variant="body1" gutterBottom>{selectedPackage.name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Chip
                    label={selectedPackage.is_active ? 'Aktif' : 'Nonaktif'}
                    color={selectedPackage.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Tanggal Keberangkatan</Typography>
                  <Typography variant="body1" gutterBottom>{formatDate(selectedPackage.departure_date)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Tanggal Kepulangan</Typography>
                  <Typography variant="body1" gutterBottom>{formatDate(selectedPackage.return_date)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Maskapai</Typography>
                  <Typography variant="body1" gutterBottom>{selectedPackage.airline}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">No. Penerbangan</Typography>
                  <Typography variant="body1" gutterBottom>{selectedPackage.flight_number || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Kota Transit</Typography>
                  <Typography variant="body1" gutterBottom>{selectedPackage.transit_city || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Jumlah Kursi</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPackage.jamaah_count || 0} / {selectedPackage.seat_count}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Hotel Madinah</Typography>
                  <Typography variant="body1" gutterBottom>{selectedPackage.medina_hotel}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Hotel Makkah</Typography>
                  <Typography variant="body1" gutterBottom>{selectedPackage.makkah_hotel}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Harga</Typography>
                  <Typography variant="h6" gutterBottom>{formatCurrency(selectedPackage.price)}</Typography>
                </Grid>
                {selectedPackage.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Deskripsi</Typography>
                    <Typography variant="body1" gutterBottom>{selectedPackage.description}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Anda yakin ingin menghapus paket &quot;{packageToDelete?.name}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Batal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PackagesPage;
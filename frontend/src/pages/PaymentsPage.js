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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import PaymentForm from '../components/payments/PaymentForm';

const PaymentsPage = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPayments, setTotalPayments] = useState(0);
  const [stats, setStats] = useState({
    totalPayments: 0,
    verifiedPayments: 0,
    pendingPayments: 0,
    totalAmount: 0
  });

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payments', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          status: statusFilter,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setPayments(response.data.payments);
      setTotalPayments(response.data.total);
      
      // Calculate stats
      const verified = response.data.payments.filter(p => p.verification_status === 'verified').length;
      const pending = response.data.payments.filter(p => p.verification_status === 'pending').length;
      const totalAmount = response.data.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      setStats({
        totalPayments: response.data.total,
        verifiedPayments: verified,
        pendingPayments: pending,
        totalAmount
      });
    } catch (error) {
      showSnackbar('Gagal memuat data pembayaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, rowsPerPage, search, statusFilter]);

  const handleCreate = () => {
    setEditingPayment(null);
    setFormOpen(true);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/payments/${paymentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Pembayaran berhasil dihapus', 'success');
      fetchPayments();
      setDeleteConfirmOpen(false);
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Gagal menghapus pembayaran', 'error');
    }
  };

  const handleVerifyPayment = async (paymentId, status) => {
    try {
      await axios.patch(`/api/payments/${paymentId}/verify`, 
        { verification_status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar(`Pembayaran berhasil ${status === 'verified' ? 'diverifikasi' : 'ditolak'}`, 'success');
      fetchPayments();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Gagal memperbarui status', 'error');
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingPayment(null);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    fetchPayments();
    showSnackbar(editingPayment ? 'Pembayaran berhasil diperbarui' : 'Pembayaran berhasil dicatat', 'success');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified':
        return 'Terverifikasi';
      case 'pending':
        return 'Menunggu';
      case 'rejected':
        return 'Ditolak';
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Manajemen Pembayaran
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Catat Pembayaran
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Total Pembayaran
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalPayments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Terverifikasi
                </Typography>
              </Box>
              <Typography variant="h4">{stats.verifiedPayments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Menunggu
                </Typography>
              </Box>
              <Typography variant="h4">{stats.pendingPayments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MoneyIcon color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Total Nilai
                </Typography>
              </Box>
              <Typography variant="h6">{formatCurrency(stats.totalAmount)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Cari nama jamaah, nomor referensi..."
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
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status Verifikasi</InputLabel>
              <Select
                value={statusFilter}
                label="Status Verifikasi"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="pending">Menunggu Verifikasi</MenuItem>
                <MenuItem value="verified">Terverifikasi</MenuItem>
                <MenuItem value="rejected">Ditolak</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchPayments}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Payments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Jamaah</TableCell>
              <TableCell>Paket</TableCell>
              <TableCell align="right">Jumlah</TableCell>
              <TableCell>Tanggal Bayar</TableCell>
              <TableCell>Metode Bayar</TableCell>
              <TableCell>No. Referensi</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <Typography variant="subtitle2">{payment.jamaah_name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    NIK: {payment.jamaah_nik}
                  </Typography>
                </TableCell>
                <TableCell>{payment.package_name}</TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2">
                    {formatCurrency(payment.amount)}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell>
                  <Chip
                    icon={<BankIcon />}
                    label={payment.payment_method}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{payment.reference_number}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={getStatusLabel(payment.verification_status)}
                    color={getStatusColor(payment.verification_status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {payment.verification_status === 'pending' && (
                    <>
                      <Tooltip title="Verifikasi">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleVerifyPayment(payment.id, 'verified')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Tolak">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleVerifyPayment(payment.id, 'rejected')}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(payment)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hapus">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setPaymentToDelete(payment);
                        setDeleteConfirmOpen(true);
                      }}
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
          count={totalPayments}
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

      {/* Payment Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={handleFormClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPayment ? 'Edit Pembayaran' : 'Catat Pembayaran Baru'}
        </DialogTitle>
        <DialogContent>
          <PaymentForm
            payment={editingPayment}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Anda yakin ingin menghapus data pembayaran &quot;{paymentToDelete?.reference_number}&quot;?
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

export default PaymentsPage;
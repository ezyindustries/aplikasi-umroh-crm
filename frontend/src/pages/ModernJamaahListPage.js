import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fab,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Avatar,
  Badge,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import {
  Add,
  Upload,
  Download,
  Edit,
  Delete,
  Visibility,
  PersonAdd,
  FileUpload,
  GetApp,
  Assignment,
  Payment,
  Flight,
  Phone,
  Email,
  Cake,
  Badge as BadgeIcon,
  LocationOn,
  Group,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import { useAuth } from '../hooks/useAuth';
import { jamaahAPI, packagesAPI } from '../services/api';
import ModernDataTable from '../components/common/ModernDataTable';
import ExcelImportDialog from '../components/excel/ExcelImportDialog';
import ExcelExportDialog from '../components/excel/ExcelExportDialog';
import { glassEffect, gradientText } from '../theme/modernTheme';

const MotionFab = motion(Fab);

const ModernJamaahListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, jamaah: null });
  const [importDialog, setImportDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  // Fetch jamaah data
  const { data, isLoading, error, refetch } = useQuery(
    ['jamaah', { page, limit }],
    () => jamaahAPI.getAll({ page, limit }),
    {
      keepPreviousData: true,
      select: response => response.data,
      refetchInterval: 30000 // Auto refresh every 30 seconds
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(jamaahAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('jamaah');
      toast.success('Data jamaah berhasil dihapus');
      setDeleteDialog({ open: false, jamaah: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Gagal menghapus data');
    }
  });

  // Table columns configuration
  const columns = [
    {
      field: 'avatar',
      headerName: '',
      minWidth: 60,
      sortable: false,
      filterable: false,
      render: (value, row) => (
        <Avatar
          sx={{
            width: 40,
            height: 40,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            fontWeight: 600,
            fontSize: '1rem'
          }}
        >
          {row.full_name?.charAt(0)?.toUpperCase() || 'J'}
        </Avatar>
      )
    },
    {
      field: 'full_name',
      headerName: 'Nama Lengkap',
      minWidth: 220,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {value}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<BadgeIcon sx={{ fontSize: 14 }} />}
              label={row.nik}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem', height: 20 }}
            />
            <Chip
              label={row.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
              size="small"
              color={row.gender === 'M' ? 'primary' : 'secondary'}
              sx={{ fontSize: '0.75rem', height: 20, fontWeight: 600 }}
            />
          </Stack>
        </Box>
      )
    },
    {
      field: 'birth_info',
      headerName: 'Lahir',
      minWidth: 180,
      render: (value, row) => (
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
            <Cake sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">
              {row.birth_date ? new Date(row.birth_date).toLocaleDateString('id-ID') : '-'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.birth_place || '-'}
            </Typography>
          </Stack>
        </Box>
      )
    },
    {
      field: 'contact',
      headerName: 'Kontak',
      minWidth: 180,
      render: (value, row) => (
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
            <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">
              {row.phone || '-'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.email || '-'}
            </Typography>
          </Stack>
        </Box>
      )
    },
    {
      field: 'package_name',
      headerName: 'Paket',
      minWidth: 160,
      render: (value, row) => value ? (
        <Chip
          icon={<Group sx={{ fontSize: 14 }} />}
          label={value}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Belum ditentukan
        </Typography>
      )
    },
    {
      field: 'passport_number',
      headerName: 'Paspor',
      minWidth: 140,
      render: (value, row) => value ? (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Exp: {row.passport_expiry ? new Date(row.passport_expiry).toLocaleDateString('id-ID') : '-'}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Belum ada
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 120,
      type: 'status'
    },
    {
      field: 'registration_date',
      headerName: 'Terdaftar',
      minWidth: 120,
      type: 'date'
    }
  ];

  // Table actions
  const actions = [
    {
      label: 'Lihat Detail',
      icon: <Visibility />,
      onClick: (row) => navigate(`/jamaah/${row.id}`),
      color: theme.palette.info.main
    },
    {
      label: 'Edit Data',
      icon: <Edit />,
      onClick: (row) => navigate(`/jamaah/${row.id}/edit`),
      color: theme.palette.primary.main,
      disabled: (row) => !hasRole(['Admin', 'Marketing'])
    },
    {
      label: 'Kelola Pembayaran',
      icon: <Payment />,
      onClick: (row) => navigate(`/payments?jamaah=${row.id}`),
      color: theme.palette.success.main,
      disabled: (row) => !hasRole(['Admin', 'Keuangan'])
    },
    {
      label: 'Hapus',
      icon: <Delete />,
      onClick: (row) => setDeleteDialog({ open: true, jamaah: row }),
      color: theme.palette.error.main,
      disabled: (row) => !hasRole(['Admin']) || row.status === 'departed'
    }
  ];

  // Header actions
  const headerActions = [
    {
      label: 'Import Excel',
      icon: <FileUpload />,
      onClick: () => setImportDialog(true),
      variant: 'outlined',
      color: 'primary'
    },
    {
      label: 'Export Data',
      icon: <Download />,
      onClick: () => setExportDialog(true),
      variant: 'outlined',
      color: 'primary'
    },
    {
      label: 'Refresh',
      icon: <Refresh />,
      onClick: () => refetch(),
      variant: 'outlined'
    },
    {
      label: 'Tambah Jamaah',
      icon: <PersonAdd />,
      onClick: () => navigate('/jamaah/new'),
      variant: 'contained',
      color: 'primary'
    }
  ];

  const handleDelete = async () => {
    if (deleteDialog.jamaah) {
      await deleteMutation.mutateAsync(deleteDialog.jamaah.id);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length > 0 && hasRole(['Admin'])) {
      try {
        await Promise.all(selectedRows.map(id => jamaahAPI.delete(id)));
        queryClient.invalidateQueries('jamaah');
        toast.success(`${selectedRows.length} data jamaah berhasil dihapus`);
        setSelectedRows([]);
      } catch (error) {
        toast.error('Gagal menghapus beberapa data');
      }
    }
  };

  const getStatistics = () => {
    if (!data?.data) return { total: 0, registered: 0, confirmed: 0, departed: 0 };
    
    const jamaahData = data.data;
    return {
      total: jamaahData.length,
      registered: jamaahData.filter(j => j.status === 'registered').length,
      confirmed: jamaahData.filter(j => j.status === 'confirmed').length,
      departed: jamaahData.filter(j => j.status === 'departed').length
    };
  };

  const stats = getStatistics();

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Gagal memuat data jamaah: {error.message}
        </Alert>
        <Button variant="contained" onClick={() => refetch()}>
          Coba Lagi
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          fontWeight={800}
          sx={{ ...gradientText, mb: 1 }}
        >
          Data Jamaah
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Kelola data jamaah umroh dengan mudah dan efisien
        </Typography>

        {/* Statistics Cards */}
        <Stack direction="row" spacing={2} mb={3}>
          <Box
            sx={{
              ...glassEffect,
              p: 2,
              borderRadius: 2,
              minWidth: 120,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Jamaah
            </Typography>
          </Box>
          <Box
            sx={{
              ...glassEffect,
              p: 2,
              borderRadius: 2,
              minWidth: 120,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" fontWeight={700} color="info.main">
              {stats.registered}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Terdaftar
            </Typography>
          </Box>
          <Box
            sx={{
              ...glassEffect,
              p: 2,
              borderRadius: 2,
              minWidth: 120,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" fontWeight={700} color="warning.main">
              {stats.confirmed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Konfirmasi
            </Typography>
          </Box>
          <Box
            sx={{
              ...glassEffect,
              p: 2,
              borderRadius: 2,
              minWidth: 120,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" fontWeight={700} color="success.main">
              {stats.departed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Berangkat
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <Box
          sx={{
            ...glassEffect,
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" fontWeight={600}>
              {selectedRows.length} item dipilih
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleBulkDelete}
              disabled={!hasRole(['Admin'])}
            >
              Hapus Terpilih
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedRows([])}
            >
              Batal Pilih
            </Button>
          </Stack>
        </Box>
      )}

      {/* Data Table */}
      <ModernDataTable
        title="Daftar Jamaah"
        subtitle={`Menampilkan ${data?.data?.length || 0} dari ${data?.pagination?.total || 0} jamaah`}
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
        onRowClick={(row) => navigate(`/jamaah/${row.id}`)}
        actions={actions}
        headerActions={headerActions}
        selectable={hasRole(['Admin'])}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        searchable={true}
        filterable={true}
        sortable={true}
        emptyMessage="Belum ada data jamaah"
        editableFields={hasRole(['Admin', 'Marketing']) ? ['phone', 'email'] : []}
        onInlineEdit={(rowId, field, value) => {
          // Handle inline editing
          jamaahAPI.update(rowId, { [field]: value })
            .then(() => {
              queryClient.invalidateQueries('jamaah');
              toast.success('Data berhasil diperbarui');
            })
            .catch(() => {
              toast.error('Gagal memperbarui data');
            });
        }}
      />

      {/* Floating Action Button */}
      <MotionFab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          '&:hover': {
            transform: 'scale(1.1)',
          }
        }}
        onClick={() => navigate('/jamaah/new')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Add />
      </MotionFab>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, jamaah: null })}
        PaperProps={{
          sx: { ...glassEffect }
        }}
      >
        <DialogTitle>
          Konfirmasi Hapus
        </DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus data jamaah{' '}
            <strong>{deleteDialog.jamaah?.full_name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, jamaah: null })}>
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

      {/* Import Dialog */}
      <ExcelImportDialog
        open={importDialog}
        onClose={() => setImportDialog(false)}
        endpoint="/api/excel/import/jamaah"
        title="Import Data Jamaah"
        templateUrl="/api/excel/template/jamaah"
      />

      {/* Export Dialog */}
      <ExcelExportDialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        endpoint="/api/excel/export/jamaah"
        filename="data-jamaah"
        title="Export Data Jamaah"
      />
    </Box>
  );
};

export default ModernJamaahListPage;
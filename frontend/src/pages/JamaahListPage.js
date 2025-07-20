import React, { useState, useCallback } from 'react';
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
  Alert
} from '@mui/material';
import {
  Add,
  Upload,
  Download,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  FileUpload,
  GetApp,
  Assignment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth';
import { jamaahAPI } from '../services/api';
import DataTable from '../components/common/DataTable';
import SearchFilter from '../components/common/SearchFilter';
import FileUpload from '../components/common/FileUpload';
import ExcelImportDialog from '../components/excel/ExcelImportDialog';
import ExcelExportDialog from '../components/excel/ExcelExportDialog';

const JamaahListPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, jamaah: null });
  const [importDialog, setImportDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [excelImportDialog, setExcelImportDialog] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);

  // Fetch jamaah data
  const { data, isLoading, error } = useQuery(
    ['jamaah', { page, limit, search, ...filters }],
    () => jamaahAPI.getAll({ page, limit, search, ...filters }),
    {
      keepPreviousData: true,
      select: response => response.data
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

  // Import mutation
  const importMutation = useMutation(
    (formData) => fetch('/api/excel/import/jamaah', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    }).then(res => res.json()),
    {
      onSuccess: (data) => {
        if (data.success) {
          queryClient.invalidateQueries('jamaah');
          toast.success(data.message);
          setImportDialog(false);
          setUploadFiles([]);
        } else {
          toast.error(data.error);
        }
      },
      onError: () => {
        toast.error('Gagal mengimpor data');
      }
    }
  );

  const columns = [
    {
      field: 'full_name',
      headerName: 'Nama Lengkap',
      minWidth: 200,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.nik}
          </Typography>
        </Box>
      )
    },
    {
      field: 'gender',
      headerName: 'L/P',
      minWidth: 80,
      render: (value) => value === 'M' ? 'L' : 'P'
    },
    {
      field: 'birth_date',
      headerName: 'Tgl Lahir',
      type: 'date',
      minWidth: 120
    },
    {
      field: 'phone',
      headerName: 'Telepon',
      minWidth: 140
    },
    {
      field: 'passport_number',
      headerName: 'Paspor',
      minWidth: 120,
      render: (value) => value || '-'
    },
    {
      field: 'package_name',
      headerName: 'Paket',
      minWidth: 150,
      render: (value) => value || '-'
    },
    {
      field: 'jamaah_status',
      headerName: 'Status Jamaah',
      type: 'status',
      minWidth: 120
    },
    {
      field: 'visa_status',
      headerName: 'Status Visa',
      type: 'status',
      minWidth: 120
    },
    {
      field: 'payment_status',
      headerName: 'Pembayaran',
      type: 'status',
      minWidth: 120
    },
    {
      field: 'registration_date',
      headerName: 'Tgl Daftar',
      type: 'date',
      minWidth: 120
    }
  ];

  const searchFilters = [
    {
      field: 'jamaah_status',
      label: 'Status Jamaah',
      type: 'select',
      options: [
        { value: 'registered', label: 'Terdaftar' },
        { value: 'confirmed', label: 'Konfirmasi' },
        { value: 'departed', label: 'Berangkat' },
        { value: 'cancelled', label: 'Batal' }
      ]
    },
    {
      field: 'visa_status',
      label: 'Status Visa',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Disetujui' },
        { value: 'rejected', label: 'Ditolak' }
      ]
    },
    {
      field: 'payment_status',
      label: 'Status Pembayaran',
      type: 'select',
      options: [
        { value: 'unpaid', label: 'Belum Bayar' },
        { value: 'partial', label: 'Sebagian' },
        { value: 'paid', label: 'Lunas' }
      ]
    },
    {
      field: 'gender',
      label: 'Jenis Kelamin',
      type: 'select',
      options: [
        { value: 'M', label: 'Laki-laki' },
        { value: 'F', label: 'Perempuan' }
      ]
    }
  ];

  const actions = [
    {
      label: 'Lihat Detail',
      icon: <Visibility />,
      onClick: (row) => navigate(`/jamaah/${row.id}`),
    },
    {
      label: 'Edit',
      icon: <Edit />,
      onClick: (row) => navigate(`/jamaah/${row.id}/edit`),
      disabled: (row) => !hasRole(['Admin', 'Marketing', 'Tim Visa'])
    },
    {
      label: 'Hapus',
      icon: <Delete />,
      onClick: (row) => setDeleteDialog({ open: true, jamaah: row }),
      disabled: (row) => !hasRole(['Admin'])
    }
  ];

  const handleSearch = useCallback((searchValue) => {
    setSearch(searchValue);
    setPage(1);
  }, []);

  const handleFilter = useCallback((filterValues) => {
    setFilters(filterValues);
    setPage(1);
  }, []);

  const handleRowClick = (row) => {
    navigate(`/jamaah/${row.id}`);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleDelete = () => {
    if (deleteDialog.jamaah) {
      deleteMutation.mutate(deleteDialog.jamaah.id);
    }
  };

  const handleImport = () => {
    if (uploadFiles.length === 0) {
      toast.error('Pilih file Excel untuk diimpor');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFiles[0]);
    importMutation.mutate(formData);
  };

  const handleExport = () => {
    const params = new URLSearchParams({ ...filters, search });
    window.open(`/api/excel/export/jamaah?${params.toString()}`, '_blank');
    setExportMenuAnchor(null);
  };

  const handleDownloadTemplate = () => {
    window.open('/api/excel/template/jamaah', '_blank');
    setExportMenuAnchor(null);
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      toast.error('Pilih data yang akan dihapus');
      return;
    }
    
    // TODO: Implement bulk delete
    toast.info('Fitur bulk delete akan segera tersedia');
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Data Jamaah
        </Typography>
        <Alert severity="error">
          Gagal memuat data jamaah. Silakan refresh halaman.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Data Jamaah
        </Typography>
        
        <Box display="flex" gap={1}>
          {hasRole(['Admin', 'Marketing']) && (
            <>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              >
                Export
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setExcelImportDialog(true)}
              >
                Import Excel
              </Button>
            </>
          )}
          
          {hasRole(['Admin', 'Marketing']) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/jamaah/new')}
            >
              Tambah Jamaah
            </Button>
          )}
        </Box>
      </Box>

      {/* Search and Filters */}
      <SearchFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        filters={searchFilters}
        searchPlaceholder="Cari nama, NIK, atau nomor paspor..."
      />

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <Box mb={2}>
          <Alert
            severity="info"
            action={
              hasRole(['Admin']) && (
                <Button color="inherit" size="small" onClick={handleBulkDelete}>
                  Hapus ({selectedRows.length})
                </Button>
              )
            }
          >
            {selectedRows.length} data dipilih
          </Alert>
        </Box>
      )}

      {/* Data Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowClick={handleRowClick}
        actions={actions}
        selectable={hasRole(['Admin'])}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        emptyMessage="Tidak ada data jamaah"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, jamaah: null })}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
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
      <Dialog
        open={importDialog}
        onClose={() => setImportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Data Jamaah</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload file Excel dengan format yang sesuai. Download template terlebih dahulu jika belum ada.
          </Typography>
          
          <FileUpload
            onFileSelect={setUploadFiles}
            onFileRemove={(index) => {
              const newFiles = [...uploadFiles];
              newFiles.splice(index, 1);
              setUploadFiles(newFiles);
            }}
            accept=".xlsx,.xls,.csv"
            multiple={false}
            files={uploadFiles}
            loading={importMutation.isLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>
            Batal
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={uploadFiles.length === 0 || importMutation.isLoading}
          >
            {importMutation.isLoading ? 'Mengimpor...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setExportDialog(true); setExportMenuAnchor(null); }}>
          <ListItemIcon>
            <GetApp />
          </ListItemIcon>
          <ListItemText>Export Data Jamaah</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadTemplate}>
          <ListItemIcon>
            <Assignment />
          </ListItemIcon>
          <ListItemText>Download Template</ListItemText>
        </MenuItem>
      </Menu>

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={excelImportDialog}
        onClose={() => setExcelImportDialog(false)}
        onSuccess={(result) => {
          queryClient.invalidateQueries('jamaah');
          toast.success(`Berhasil mengimport ${result.success_count} data jamaah`);
        }}
      />

      {/* Excel Export Dialog */}
      <ExcelExportDialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        dataType="jamaah"
      />

      {/* Floating Action Button for Mobile */}
      {hasRole(['Admin', 'Marketing']) && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={() => navigate('/jamaah/new')}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default JamaahListPage;
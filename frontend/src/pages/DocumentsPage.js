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
  Tooltip,
  Avatar
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import DocumentUpload from '../components/documents/DocumentUpload';

const DocumentsPage = () => {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    verifiedDocuments: 0,
    pendingDocuments: 0,
    rejectedDocuments: 0
  });

  // Dialog states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          type: typeFilter,
          verification_status: statusFilter,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setDocuments(response.data.documents);
      setTotalDocuments(response.data.total);
      
      // Calculate stats
      const verified = response.data.documents.filter(d => d.verification_status === 'verified').length;
      const pending = response.data.documents.filter(d => d.verification_status === 'pending').length;
      const rejected = response.data.documents.filter(d => d.verification_status === 'rejected').length;
      
      setStats({
        totalDocuments: response.data.total,
        verifiedDocuments: verified,
        pendingDocuments: pending,
        rejectedDocuments: rejected
      });
    } catch (error) {
      showSnackbar('Gagal memuat data dokumen', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, rowsPerPage, search, typeFilter, statusFilter]);

  const handleUpload = () => {
    setUploadOpen(true);
  };

  const handleView = (document) => {
    setSelectedDocument(document);
    setViewOpen(true);
  };

  const handleDownload = (document) => {
    window.open(document.file_url, '_blank');
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/documents/${documentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Dokumen berhasil dihapus', 'success');
      fetchDocuments();
      setDeleteConfirmOpen(false);
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Gagal menghapus dokumen', 'error');
    }
  };

  const handleVerifyDocument = async (documentId, status, notes = '') => {
    try {
      await axios.patch(`/api/documents/${documentId}/verify`, 
        { verification_status: status, verification_notes: notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar(`Dokumen berhasil ${status === 'verified' ? 'diverifikasi' : 'ditolak'}`, 'success');
      fetchDocuments();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Gagal memperbarui status', 'error');
    }
  };

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    fetchDocuments();
    showSnackbar('Dokumen berhasil diupload', 'success');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
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

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'KTP':
      case 'Paspor':
      case 'KK':
        return <ImageIcon />;
      case 'Visa':
      case 'Sertifikat':
        return <PdfIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const documentTypes = [
    'KTP',
    'Paspor',
    'KK',
    'Visa',
    'Sertifikat Vaksin',
    'Surat Mahram',
    'Foto',
    'Lainnya'
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Manajemen Dokumen
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleUpload}
        >
          Upload Dokumen
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FolderIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Total Dokumen
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalDocuments}</Typography>
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
              <Typography variant="h4">{stats.verifiedDocuments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DocumentIcon color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Menunggu
                </Typography>
              </Box>
              <Typography variant="h4">{stats.pendingDocuments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CancelIcon color="error" sx={{ mr: 1 }} />
                <Typography color="textSecondary" gutterBottom>
                  Ditolak
                </Typography>
              </Box>
              <Typography variant="h4">{stats.rejectedDocuments}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Cari nama jamaah, jenis dokumen..."
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Jenis Dokumen</InputLabel>
              <Select
                value={typeFilter}
                label="Jenis Dokumen"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Semua Jenis</MenuItem>
                {documentTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
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
              onClick={fetchDocuments}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Documents Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Jamaah</TableCell>
              <TableCell>Jenis Dokumen</TableCell>
              <TableCell>Nama File</TableCell>
              <TableCell>Tanggal Upload</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {document.jamaah_name?.charAt(0) || 'J'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{document.jamaah_name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        NIK: {document.jamaah_nik}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getDocumentIcon(document.document_type)}
                    <Typography sx={{ ml: 1 }}>{document.document_type}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{document.file_name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(document.uploaded_at)}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={getStatusLabel(document.verification_status)}
                    color={getStatusColor(document.verification_status)}
                    size="small"
                  />
                  {document.verification_notes && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      {document.verification_notes}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Lihat">
                    <IconButton size="small" onClick={() => handleView(document)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton size="small" onClick={() => handleDownload(document)}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  {document.verification_status === 'pending' && (
                    <>
                      <Tooltip title="Verifikasi">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleVerifyDocument(document.id, 'verified')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Tolak">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleVerifyDocument(document.id, 'rejected', 'Dokumen tidak sesuai')}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Hapus">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setDocumentToDelete(document);
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
          count={totalDocuments}
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

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Dokumen</DialogTitle>
        <DialogContent>
          <DocumentUpload
            onSuccess={handleUploadSuccess}
            onCancel={() => setUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Preview Dokumen</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ textAlign: 'center', pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedDocument.document_type} - {selectedDocument.jamaah_name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedDocument.file_name}
              </Typography>
              {selectedDocument.file_url && (
                selectedDocument.file_url.toLowerCase().includes('.pdf') ? (
                  <iframe
                    src={selectedDocument.file_url}
                    width="100%"
                    height="600px"
                    title="Document Preview"
                  />
                ) : (
                  <img
                    src={selectedDocument.file_url}
                    alt="Document"
                    style={{ maxWidth: '100%', maxHeight: '600px' }}
                  />
                )
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Tutup</Button>
          {selectedDocument && (
            <Button 
              onClick={() => handleDownload(selectedDocument)}
              variant="contained"
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Anda yakin ingin menghapus dokumen &quot;{documentToDelete?.file_name}&quot;?
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

export default DocumentsPage;
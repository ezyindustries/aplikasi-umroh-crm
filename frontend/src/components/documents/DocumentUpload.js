import React, { useState, useEffect } from 'react';
import {
  Box,
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
  TextField,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const DocumentUpload = ({ onSuccess, onCancel }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jamaahOptions, setJamaahOptions] = useState([]);
  const [loadingJamaah, setLoadingJamaah] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    jamaah_id: '',
    document_type: '',
    files: []
  });

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        setError('Beberapa file ditolak. Pastikan file berukuran maksimal 10MB dan berformat yang didukung.');
        return;
      }
      setFormData({ ...formData, files: [...formData.files, ...acceptedFiles] });
      setError('');
    }
  });

  const handleJamaahChange = (event, value) => {
    setFormData({ ...formData, jamaah_id: value ? value.id : '' });
  };

  const handleDocumentTypeChange = (event) => {
    setFormData({ ...formData, document_type: event.target.value });
  };

  const removeFile = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
  };

  const uploadFile = async (file, jamaahId, documentType) => {
    const formDataToUpload = new FormData();
    formDataToUpload.append('file', file);
    formDataToUpload.append('jamaah_id', jamaahId);
    formDataToUpload.append('document_type', documentType);

    try {
      const response = await axios.post('/api/documents/upload', formDataToUpload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      });

      setUploadedFiles(prev => [...prev, { 
        file: file.name, 
        status: 'success', 
        id: response.data.id 
      }]);
      
      return response.data;
    } catch (error) {
      setUploadedFiles(prev => [...prev, { 
        file: file.name, 
        status: 'error', 
        error: error.response?.data?.message || 'Upload gagal' 
      }]);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.jamaah_id) {
      setError('Pilih jamaah terlebih dahulu');
      return;
    }
    
    if (!formData.document_type) {
      setError('Pilih jenis dokumen terlebih dahulu');
      return;
    }
    
    if (formData.files.length === 0) {
      setError('Pilih file yang akan diupload');
      return;
    }

    setLoading(true);
    setUploadedFiles([]);
    setUploadProgress({});

    try {
      const uploadPromises = formData.files.map(file =>
        uploadFile(file, formData.jamaah_id, formData.document_type)
      );

      await Promise.allSettled(uploadPromises);
      
      // Check if all uploads were successful
      const hasErrors = uploadedFiles.some(file => file.status === 'error');
      
      if (!hasErrors) {
        onSuccess();
      } else {
        setError('Beberapa file gagal diupload. Periksa daftar file di bawah.');
      }
      
    } catch (error) {
      setError('Terjadi kesalahan saat mengupload file');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
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

        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Jenis Dokumen</InputLabel>
            <Select
              value={formData.document_type}
              label="Jenis Dokumen"
              onChange={handleDocumentTypeChange}
            >
              {documentTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Lepaskan file di sini' : 'Drag & drop file atau klik untuk memilih'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Mendukung: JPG, PNG, PDF, DOC, DOCX (Maks. 10MB per file)
            </Typography>
          </Paper>
        </Grid>

        {formData.files.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              File yang Dipilih:
            </Typography>
            <List>
              {formData.files.map((file, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <DocumentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => removeFile(index)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Grid>
        )}

        {loading && Object.keys(uploadProgress).length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Progress Upload:
            </Typography>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <Box key={fileName} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {fileName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            ))}
          </Grid>
        )}

        {uploadedFiles.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Status Upload:
            </Typography>
            <List>
              {uploadedFiles.map((file, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {file.status === 'success' ? (
                      <CheckIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.file}
                    secondary={file.status === 'error' ? file.error : 'Upload berhasil'}
                  />
                  <Chip
                    label={file.status === 'success' ? 'Berhasil' : 'Gagal'}
                    color={file.status === 'success' ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || formData.files.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {loading ? 'Mengupload...' : 'Upload Dokumen'}
        </Button>
      </Box>
    </Box>
  );
};

export default DocumentUpload;
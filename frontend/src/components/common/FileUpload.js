import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Chip
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Delete,
  Description,
  Image,
  PictureAsPdf,
  InsertDriveFile
} from '@mui/icons-material';

const FileUpload = ({
  onFileSelect,
  onFileRemove,
  accept = "*/*",
  multiple = false,
  maxSize = 10485760, // 10MB
  maxFiles = 5,
  files = [],
  loading = false,
  error = null,
  disabled = false,
  showPreview = true,
  dragAndDrop = true
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Validate file count
    if (!multiple && fileArray.length > 1) {
      return;
    }
    
    if (files.length + fileArray.length > maxFiles) {
      alert(`Maksimal ${maxFiles} file`);
      return;
    }

    // Validate each file
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: File terlalu besar (max ${formatFileSize(maxSize)})`);
        return;
      }
      
      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleInputChange = (e) => {
    const selectedFiles = e.target.files;
    handleFileSelect(selectedFiles);
    e.target.value = ''; // Reset input
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    const type = file.type || '';
    
    if (type.startsWith('image/')) {
      return <Image color="primary" />;
    } else if (type === 'application/pdf') {
      return <PictureAsPdf color="error" />;
    } else if (type.includes('document') || type.includes('text')) {
      return <Description color="info" />;
    } else {
      return <InsertDriveFile color="action" />;
    }
  };

  const getFileTypeChip = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const typeColors = {
      'pdf': 'error',
      'doc': 'primary',
      'docx': 'primary',
      'jpg': 'success',
      'jpeg': 'success',
      'png': 'success',
      'gif': 'success'
    };
    
    return (
      <Chip 
        size="small" 
        label={extension?.toUpperCase() || 'FILE'} 
        color={typeColors[extension] || 'default'}
      />
    );
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Upload Area */}
      <Paper
        sx={{
          p: 3,
          border: dragOver ? 2 : 1,
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderStyle: 'dashed',
          backgroundColor: dragOver ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
        onDragOver={dragAndDrop ? handleDragOver : undefined}
        onDragLeave={dragAndDrop ? handleDragLeave : undefined}
        onDrop={dragAndDrop ? handleDrop : undefined}
        onClick={!disabled ? handleButtonClick : undefined}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
        >
          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            {dragAndDrop ? 'Drag & Drop files atau klik untuk upload' : 'Klik untuk upload file'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {accept !== "*/*" && `Format: ${accept} • `}
            Maksimal {formatFileSize(maxSize)} per file
            {multiple && ` • Maksimal ${maxFiles} file`}
          </Typography>

          <Button
            variant="contained"
            startIcon={<AttachFile />}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick();
            }}
          >
            Pilih File
          </Button>
        </Box>
      </Paper>

      {/* Loading Progress */}
      {loading && (
        <Box mt={2}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
            Uploading...
          </Typography>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* File List */}
      {showPreview && files.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            File yang dipilih ({files.length})
          </Typography>
          
          <List dense>
            {files.map((file, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {getFileIcon(file)}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" noWrap>
                        {file.name}
                      </Typography>
                      {getFileTypeChip(file)}
                    </Box>
                  }
                  secondary={`${formatFileSize(file.size)} • ${file.type || 'Unknown type'}`}
                />
                
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(index);
                    }}
                    disabled={disabled}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
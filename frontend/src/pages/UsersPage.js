import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';

const UsersPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Manajemen User
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            Manajemen User Akan Segera Hadir
          </Typography>
          <Typography>
            Halaman ini akan memiliki fitur:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Daftar semua user</li>
            <li>Tambah user baru</li>
            <li>Edit role dan status user</li>
            <li>Reset password</li>
            <li>Log aktivitas user</li>
          </Box>
        </Alert>
      </Paper>
    </Box>
  );
};

export default UsersPage;
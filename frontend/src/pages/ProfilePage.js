import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';

const ProfilePage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            Halaman Profile Akan Segera Hadir
          </Typography>
          <Typography>
            Halaman ini akan memiliki fitur:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Edit informasi profile</li>
            <li>Ubah password</li>
            <li>Riwayat aktivitas</li>
            <li>Preferensi aplikasi</li>
          </Box>
        </Alert>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
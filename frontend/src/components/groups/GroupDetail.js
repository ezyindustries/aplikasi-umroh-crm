import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Person,
  Phone,
  LocationOn,
  AccessTime,
  DirectionsBus,
  Hotel,
  Print,
  Download,
  Edit,
  Delete
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';

import { groupAPI } from '../../services/api';

const GroupDetail = ({ groupId, onEdit, onClose }) => {
  const [manifestOpen, setManifestOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Fetch group details
  const { data: group, isLoading } = useQuery(
    ['group', groupId],
    () => groupAPI.getById(groupId),
    {
      enabled: !!groupId,
      select: data => data.data
    }
  );

  // Fetch manifest
  const { data: manifest } = useQuery(
    ['group-manifest', groupId],
    () => groupAPI.generateManifest(groupId),
    {
      enabled: !!groupId && manifestOpen,
      select: data => data.data
    }
  );

  // Remove member mutation
  const removeMemberMutation = useMutation(
    ({ jamaahId }) => groupAPI.removeMember(groupId, jamaahId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['group', groupId]);
        queryClient.invalidateQueries('groups');
        enqueueSnackbar('Anggota berhasil dihapus', { variant: 'success' });
      },
      onError: (error) => {
        enqueueSnackbar(error.response?.data?.error || 'Gagal menghapus anggota', { variant: 'error' });
      }
    }
  );

  const handleRemoveMember = (jamaahId, jamaahName) => {
    if (window.confirm(`Yakin ingin menghapus ${jamaahName} dari grup?`)) {
      removeMemberMutation.mutate({ jamaahId });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered': return 'info';
      case 'confirmed': return 'success';
      case 'departed': return 'secondary';
      default: return 'default';
    }
  };

  const getVisaStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'unpaid': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!group) {
    return (
      <Box p={4}>
        <Alert severity="error">Grup tidak ditemukan</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Group Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="start" mb={2}>
            <Box flex={1}>
              <Typography variant="h5" gutterBottom>
                {group.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {group.package_name}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person color="action" />
                    <Typography variant="body2">
                      {group.members?.length || 0} Anggota
                    </Typography>
                  </Box>
                </Grid>
                
                {group.departure_date && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTime color="action" />
                      <Typography variant="body2">
                        {new Date(group.departure_date).toLocaleDateString('id-ID')}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {group.bus_number && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DirectionsBus color="action" />
                      <Typography variant="body2">
                        Bus {group.bus_number}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {group.gathering_point && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn color="action" />
                      <Typography variant="body2">
                        {group.gathering_point}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => setManifestOpen(true)}
              >
                Manifest
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => onEdit(group)}
              >
                Edit
              </Button>
            </Box>
          </Box>

          {/* Additional Info */}
          {(group.gathering_time || group.hotel_info || group.notes) && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                {group.gathering_time && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Waktu Kumpul
                    </Typography>
                    <Typography variant="body2">
                      {group.gathering_time}
                    </Typography>
                  </Grid>
                )}
                
                {group.hotel_info && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Info Hotel
                    </Typography>
                    <Typography variant="body2">
                      {group.hotel_info}
                    </Typography>
                  </Grid>
                )}
                
                {group.notes && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Catatan
                    </Typography>
                    <Typography variant="body2">
                      {group.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Group Leader */}
      {group.leader_name && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ketua Grup
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {group.leader_name}
                </Typography>
                {group.leader_phone && (
                  <Typography variant="body2" color="text.secondary">
                    <Phone sx={{ fontSize: 16, mr: 0.5 }} />
                    {group.leader_phone}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Daftar Anggota ({group.members?.length || 0})
          </Typography>
          
          {group.members && group.members.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nama</TableCell>
                    <TableCell>NIK</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Telepon</TableCell>
                    <TableCell>Status Jamaah</TableCell>
                    <TableCell>Status Visa</TableCell>
                    <TableCell>Status Bayar</TableCell>
                    <TableCell>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {member.full_name}
                        </Typography>
                        {member.room_number && (
                          <Typography variant="caption" color="text.secondary">
                            Kamar: {member.room_number}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{member.nik}</TableCell>
                      <TableCell>
                        <Chip 
                          label={member.gender === 'M' ? 'L' : 'P'} 
                          size="small"
                          color={member.gender === 'M' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>{member.phone || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={member.jamaah_status}
                          size="small"
                          color={getStatusColor(member.jamaah_status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.visa_status}
                          size="small"
                          color={getVisaStatusColor(member.visa_status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.payment_status}
                          size="small"
                          color={getPaymentStatusColor(member.payment_status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Hapus dari grup">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMember(member.id, member.full_name)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              Grup belum memiliki anggota
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manifest Dialog */}
      <Dialog 
        open={manifestOpen} 
        onClose={() => setManifestOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manifest Grup: {group.name}
        </DialogTitle>
        <DialogContent>
          {manifest && (
            <Box>
              {/* Group Info */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Package
                    </Typography>
                    <Typography>{manifest.package_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tanggal Keberangkatan
                    </Typography>
                    <Typography>
                      {manifest.departure_date 
                        ? new Date(manifest.departure_date).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Bus
                    </Typography>
                    <Typography>{manifest.bus_number || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Titik Kumpul
                    </Typography>
                    <Typography>{manifest.gathering_point || '-'}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Statistics */}
              {manifest.statistics && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Statistik
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="h4" color="primary">
                        {manifest.statistics.total_members}
                      </Typography>
                      <Typography variant="caption">Total</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="h4" color="info.main">
                        {manifest.statistics.male_count}L / {manifest.statistics.female_count}P
                      </Typography>
                      <Typography variant="caption">Gender</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="h4" color="success.main">
                        {manifest.statistics.visa_approved}
                      </Typography>
                      <Typography variant="caption">Visa OK</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="h4" color="warning.main">
                        {manifest.statistics.fully_paid}
                      </Typography>
                      <Typography variant="caption">Lunas</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Member List for Print */}
              <Typography variant="h6" gutterBottom>
                Daftar Jamaah
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>Nama Lengkap</TableCell>
                      <TableCell>NIK</TableCell>
                      <TableCell>L/P</TableCell>
                      <TableCell>Telepon</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manifest.members?.map((member, index) => (
                      <TableRow key={member.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{member.full_name}</TableCell>
                        <TableCell>{member.nik}</TableCell>
                        <TableCell>{member.gender === 'M' ? 'L' : 'P'}</TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Chip 
                              label="J" 
                              size="small" 
                              color={getStatusColor(member.jamaah_status)}
                              title={`Jamaah: ${member.jamaah_status}`}
                            />
                            <Chip 
                              label="V" 
                              size="small" 
                              color={getVisaStatusColor(member.visa_status)}
                              title={`Visa: ${member.visa_status}`}
                            />
                            <Chip 
                              label="$" 
                              size="small" 
                              color={getPaymentStatusColor(member.payment_status)}
                              title={`Payment: ${member.payment_status}`}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManifestOpen(false)}>
            Tutup
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupDetail;
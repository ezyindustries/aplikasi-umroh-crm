import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Fab,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group,
  People,
  Flight,
  Assignment,
  PersonAdd,
  PersonRemove,
  GroupAdd,
  Print,
  AutoFixHigh
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';

import { groupAPI, packagesAPI, jamaahAPI } from '../services/api';
import DataTable from '../components/common/DataTable';

const GroupsPage = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create'); // create, edit, members, manifest
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    package_id: '',
    leader_jamaah_id: '',
    departure_date: '',
    bus_number: '',
    gathering_point: '',
    gathering_time: '',
    hotel_info: '',
    notes: ''
  });
  const [selectedJamaah, setSelectedJamaah] = useState([]);

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Fetch groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery(
    ['groups', selectedPackage],
    () => groupAPI.getAll(selectedPackage ? { package_id: selectedPackage } : {}),
    {
      select: data => data.data
    }
  );

  // Fetch packages
  const { data: packagesData } = useQuery('packages', () => packagesAPI.getAll(), {
    select: data => data.data.packages
  });

  // Fetch available jamaah
  const { data: availableJamaah } = useQuery(
    ['available-jamaah', selectedPackage],
    () => selectedPackage ? groupAPI.getAvailableJamaah(selectedPackage) : null,
    {
      enabled: !!selectedPackage,
      select: data => data?.data || []
    }
  );

  // Fetch group statistics
  const { data: groupStats } = useQuery('group-statistics', groupAPI.getStatistics, {
    select: data => data.data
  });

  // Create group mutation
  const createGroupMutation = useMutation(groupAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('groups');
      queryClient.invalidateQueries('group-statistics');
      queryClient.invalidateQueries('available-jamaah');
      setOpenDialog(false);
      resetForm();
      enqueueSnackbar('Grup berhasil dibuat', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.error || 'Gagal membuat grup', { variant: 'error' });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation(
    ({ id, data }) => groupAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('groups');
        setOpenDialog(false);
        resetForm();
        enqueueSnackbar('Grup berhasil diupdate', { variant: 'success' });
      },
      onError: (error) => {
        enqueueSnackbar(error.response?.data?.error || 'Gagal mengupdate grup', { variant: 'error' });
      }
    }
  );

  // Delete group mutation
  const deleteGroupMutation = useMutation(groupAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('groups');
      queryClient.invalidateQueries('group-statistics');
      enqueueSnackbar('Grup berhasil dihapus', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.error || 'Gagal menghapus grup', { variant: 'error' });
    }
  });

  // Auto assign mutation
  const autoAssignMutation = useMutation(groupAPI.autoAssign, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('groups');
      queryClient.invalidateQueries('available-jamaah');
      enqueueSnackbar(data.data.message, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.error || 'Gagal auto assign', { variant: 'error' });
    }
  });

  // Bulk add members mutation
  const bulkAddMembersMutation = useMutation(
    ({ groupId, jamaahIds }) => groupAPI.bulkAddMembers(groupId, jamaahIds),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('groups');
        queryClient.invalidateQueries('available-jamaah');
        setOpenDialog(false);
        setSelectedJamaah([]);
        enqueueSnackbar(data.data.message, { variant: 'success' });
      },
      onError: (error) => {
        enqueueSnackbar(error.response?.data?.error || 'Gagal menambah anggota', { variant: 'error' });
      }
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      package_id: '',
      leader_jamaah_id: '',
      departure_date: '',
      bus_number: '',
      gathering_point: '',
      gathering_time: '',
      hotel_info: '',
      notes: ''
    });
    setSelectedGroup(null);
    setSelectedJamaah([]);
  };

  const handleOpenDialog = (type, group = null) => {
    setDialogType(type);
    setSelectedGroup(group);
    
    if (group && type === 'edit') {
      setFormData({
        name: group.name || '',
        package_id: group.package_id || '',
        leader_jamaah_id: group.leader_jamaah_id || '',
        departure_date: group.departure_date ? group.departure_date.split('T')[0] : '',
        bus_number: group.bus_number || '',
        gathering_point: group.gathering_point || '',
        gathering_time: group.gathering_time || '',
        hotel_info: group.hotel_info || '',
        notes: group.notes || ''
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.package_id) {
      enqueueSnackbar('Nama grup dan package wajib diisi', { variant: 'error' });
      return;
    }

    const submitData = { ...formData };
    if (submitData.departure_date === '') delete submitData.departure_date;
    if (submitData.leader_jamaah_id === '') delete submitData.leader_jamaah_id;

    if (dialogType === 'create') {
      createGroupMutation.mutate(submitData);
    } else if (dialogType === 'edit') {
      updateGroupMutation.mutate({ id: selectedGroup.id, data: submitData });
    }
  };

  const handleAutoAssign = () => {
    if (!selectedPackage) {
      enqueueSnackbar('Pilih package terlebih dahulu', { variant: 'error' });
      return;
    }

    autoAssignMutation.mutate({
      package_id: selectedPackage,
      max_members_per_group: 45
    });
  };

  const handleBulkAddMembers = () => {
    if (!selectedGroup || selectedJamaah.length === 0) {
      enqueueSnackbar('Pilih grup dan jamaah yang akan ditambahkan', { variant: 'error' });
      return;
    }

    bulkAddMembersMutation.mutate({
      groupId: selectedGroup.id,
      jamaahIds: selectedJamaah.map(j => j.id)
    });
  };

  const groupColumns = [
    {
      field: 'name',
      headerName: 'Nama Grup',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="subtitle2">{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.package_name}
          </Typography>
        </Box>
      )
    },
    {
      field: 'member_count',
      headerName: 'Anggota',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={`${params.row.member_count || 0}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      field: 'departure_date',
      headerName: 'Tanggal Berangkat',
      width: 150,
      renderCell: (params) => 
        params.row.departure_date 
          ? new Date(params.row.departure_date).toLocaleDateString('id-ID')
          : '-'
    },
    {
      field: 'bus_number',
      headerName: 'Bus',
      width: 100,
      renderCell: (params) => params.row.bus_number || '-'
    },
    {
      field: 'leader_name',
      headerName: 'Ketua',
      width: 150,
      renderCell: (params) => params.row.leader_name || '-'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const visaApproved = params.row.visa_approved_members || 0;
        const paidMembers = params.row.paid_members || 0;
        const total = params.row.member_count || 0;
        
        if (total === 0) return <Chip label="Kosong" size="small" />;
        if (visaApproved === total && paidMembers === total) {
          return <Chip label="Siap" color="success" size="small" />;
        }
        if (visaApproved > 0 || paidMembers > 0) {
          return <Chip label="Proses" color="warning" size="small" />;
        }
        return <Chip label="Baru" color="default" size="small" />;
      }
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 200,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleOpenDialog('edit', params.row)}
            title="Edit"
          >
            <Edit />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenDialog('members', params.row)}
            title="Kelola Anggota"
          >
            <People />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenDialog('manifest', params.row)}
            title="Manifest"
          >
            <Print />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => deleteGroupMutation.mutate(params.row.id)}
            color="error"
            title="Hapus"
          >
            <Delete />
          </IconButton>
        </Box>
      )
    }
  ];

  const renderGroupForm = () => (
    <Box component="form">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nama Grup"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Package"
            value={formData.package_id}
            onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
            required
          >
            {packagesData?.map((pkg) => (
              <MenuItem key={pkg.id} value={pkg.id}>
                {pkg.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tanggal Keberangkatan"
            type="date"
            value={formData.departure_date}
            onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nomor Bus"
            value={formData.bus_number}
            onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Titik Kumpul"
            value={formData.gathering_point}
            onChange={(e) => setFormData({ ...formData, gathering_point: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Waktu Kumpul"
            type="time"
            value={formData.gathering_time}
            onChange={(e) => setFormData({ ...formData, gathering_time: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Info Hotel"
            value={formData.hotel_info}
            onChange={(e) => setFormData({ ...formData, hotel_info: e.target.value })}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Catatan"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderMembersDialog = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Kelola Anggota: {selectedGroup?.name}
      </Typography>
      
      {availableJamaah && availableJamaah.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Tambah Anggota
          </Typography>
          <Autocomplete
            multiple
            options={availableJamaah}
            getOptionLabel={(option) => `${option.full_name} (${option.nik})`}
            value={selectedJamaah}
            onChange={(event, newValue) => setSelectedJamaah(newValue)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Pilih jamaah..." />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option.id || index}
                  variant="outlined"
                  label={option.full_name}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
          />
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleBulkAddMembers}
            disabled={selectedJamaah.length === 0 || bulkAddMembersMutation.isLoading}
            sx={{ mt: 2 }}
          >
            Tambah {selectedJamaah.length} Anggota
          </Button>
        </Box>
      )}

      {selectedGroup?.members && selectedGroup.members.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Anggota Saat Ini ({selectedGroup.members.length})
          </Typography>
          <List dense>
            {selectedGroup.members.map((member) => (
              <ListItem key={member.id}>
                <ListItemText
                  primary={member.full_name}
                  secondary={`${member.nik} • ${member.gender === 'M' ? 'L' : 'P'} • ${member.jamaah_status}`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={() => {
                      // Remove member logic here
                    }}
                  >
                    <PersonRemove />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" gutterBottom>
              {value || 0}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Statistics Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Grup"
          value={groupStats?.total_groups}
          icon={<Group />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Dengan Keberangkatan"
          value={groupStats?.groups_with_departure}
          icon={<Flight />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Dengan Ketua"
          value={groupStats?.groups_with_leader}
          icon={<People />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Rata-rata Anggota"
          value={Math.round(groupStats?.avg_members_per_group || 0)}
          icon={<Assignment />}
          color="warning"
        />
      </Grid>

      {/* Package Filter */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <TextField
                select
                label="Filter Package"
                value={selectedPackage || ''}
                onChange={(e) => setSelectedPackage(e.target.value || null)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Semua Package</MenuItem>
                {packagesData?.map((pkg) => (
                  <MenuItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </MenuItem>
                ))}
              </TextField>
              
              <Button
                variant="outlined"
                startIcon={<AutoFixHigh />}
                onClick={handleAutoAssign}
                disabled={!selectedPackage || autoAssignMutation.isLoading}
              >
                Auto Assign
              </Button>
            </Box>

            {selectedPackage && availableJamaah && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Ada {availableJamaah.length} jamaah yang belum di-assign ke grup untuk package ini
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Groups Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Daftar Grup
            </Typography>
            <DataTable
              rows={groupsData?.groups || []}
              columns={groupColumns}
              loading={groupsLoading}
              pagination={{
                page: groupsData?.pagination?.page || 1,
                pageSize: groupsData?.pagination?.limit || 20,
                total: groupsData?.pagination?.total || 0
              }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Manajemen Grup
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab icon={<Group />} label="Overview" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && <OverviewTab />}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog('create')}
      >
        <Add />
      </Fab>

      {/* Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth={dialogType === 'members' ? 'md' : 'sm'}
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'create' && 'Buat Grup Baru'}
          {dialogType === 'edit' && 'Edit Grup'}
          {dialogType === 'members' && 'Kelola Anggota'}
          {dialogType === 'manifest' && 'Manifest Grup'}
        </DialogTitle>
        <DialogContent>
          {(dialogType === 'create' || dialogType === 'edit') && renderGroupForm()}
          {dialogType === 'members' && renderMembersDialog()}
          {dialogType === 'manifest' && (
            <Typography>Manifest feature will be implemented here</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          {(dialogType === 'create' || dialogType === 'edit') && (
            <Button 
              onClick={handleSubmit}
              variant="contained"
              disabled={createGroupMutation.isLoading || updateGroupMutation.isLoading}
            >
              {dialogType === 'create' ? 'Buat' : 'Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupsPage;
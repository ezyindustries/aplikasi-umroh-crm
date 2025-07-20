import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Skeleton,
  Avatar,
  AvatarGroup,
  useTheme,
  alpha
} from '@mui/material';
import {
  People,
  PersonAdd,
  CheckCircle,
  FlightTakeoff,
  Payment,
  Verified,
  TrendingUp,
  TrendingDown,
  MoreVert,
  Refresh,
  Download,
  CalendarToday,
  AccountBalance,
  Assessment,
  ArrowUpward,
  ArrowDownward,
  Schedule,
  Groups,
  Mosque
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

import { reportsAPI, jamaahAPI } from '../services/api';
import ActivityFeed from '../components/activity/ActivityFeed';
import { glassEffect, gradientText, modernShadow } from '../theme/modernTheme';

const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];

const MotionCard = motion(Card);

const ModernStatCard = ({ title, value, icon, gradient, trend, loading = false, delay = 0 }) => {
  const theme = useTheme();
  
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      sx={{
        ...glassEffect,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: modernShadow.xl,
        },
        transition: 'all 0.3s ease',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: gradient,
          borderRadius: '50%',
          opacity: 0.1,
        }}
      />
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" fontWeight={800} sx={{ mb: 1 }}>
              {loading ? <Skeleton width={120} height={40} /> : value}
            </Typography>
            {trend !== undefined && (
              <Box display="flex" alignItems="center" gap={0.5}>
                {trend > 0 ? (
                  <ArrowUpward sx={{ fontSize: 16, color: theme.palette.success.main }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 16, color: theme.palette.error.main }} />
                )}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: trend > 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600 
                  }}
                >
                  {Math.abs(trend)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  dari bulan lalu
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              background: gradient,
              width: 56,
              height: 56,
              boxShadow: modernShadow.medium,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </MotionCard>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          ...glassEffect,
          p: 2,
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const ModernDashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const { data: dashboardData, isLoading: dashboardLoading, refetch } = useQuery(
    'dashboard-data',
    reportsAPI.getDashboard,
    {
      select: data => data.data,
      refetchInterval: 300000
    }
  );

  // const { data: jamaahStats, isLoading: jamaahLoading } = useQuery(
  //   'jamaah-statistics',
  //   jamaahAPI.getStatistics,
  //   {
  //     select: data => data.data
  //   }
  // );

  const statCards = [
    {
      title: 'Total Jamaah',
      value: dashboardData?.jamaah_stats?.total_jamaah || 0,
      icon: <People />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      trend: 12
    },
    {
      title: 'Terdaftar Baru',
      value: dashboardData?.jamaah_stats?.registered || 0,
      icon: <PersonAdd />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      trend: 8
    },
    {
      title: 'Konfirmasi',
      value: dashboardData?.jamaah_stats?.confirmed || 0,
      icon: <CheckCircle />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      trend: 15
    },
    {
      title: 'Berangkat',
      value: dashboardData?.jamaah_stats?.departed || 0,
      icon: <FlightTakeoff />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      trend: -3
    }
  ];

  const handleRefresh = () => {
    refetch();
    setMenuAnchor(null);
  };

  const formatTrendData = (data) => {
    return data?.map(item => ({
      month: new Date(item.month).toLocaleDateString('id-ID', { month: 'short' }),
      jamaah: item.jamaah_count
    })) || [];
  };

  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Welcome Section */}
      <Grid item xs={12}>
        <MotionCard
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
            }}
          />
          <CardContent sx={{ position: 'relative', zIndex: 1, py: 4 }}>
            <Grid container alignItems="center" spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  Assalamu&apos;alaikum! 👋
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Selamat datang di Dashboard Manajemen Umroh
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => navigate('/jamaah/new')}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                      }
                    }}
                  >
                    Tambah Jamaah
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </MotionCard>
      </Grid>

      {/* Statistics Cards */}
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index}>
          <ModernStatCard {...card} loading={dashboardLoading} delay={index * 0.1} />
        </Grid>
      ))}

      {/* Charts Section */}
      <Grid item xs={12} lg={8}>
        <MotionCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          sx={{ ...glassEffect }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={600}>
                Tren Pendaftaran Jamaah
              </Typography>
              <Chip 
                label="12 Bulan Terakhir" 
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={formatTrendData(dashboardData?.monthly_trends)}>
                <defs>
                  <linearGradient id="colorJamaah" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="jamaah" 
                  stroke="#6366F1" 
                  fillOpacity={1} 
                  fill="url(#colorJamaah)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </MotionCard>
      </Grid>

      {/* Side Panel */}
      <Grid item xs={12} lg={4}>
        <Grid container spacing={3}>
          {/* Payment Overview */}
          <Grid item xs={12}>
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              sx={{ 
                ...glassEffect,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Total Pembayaran
                </Typography>
                <Typography variant="h4" fontWeight={800}>
                  {dashboardData?.payment_stats?.total_amount ? 
                    new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(dashboardData.payment_stats.total_amount) : 'Rp 0'}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={2}>
                  <TrendingUp />
                  <Typography variant="body2">
                    +25% dari bulan lalu
                  </Typography>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Package Capacity */}
          <Grid item xs={12}>
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              sx={{ ...glassEffect }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Kapasitas Paket
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Terisi
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {dashboardData?.package_stats?.total_occupied || 0} / {dashboardData?.package_stats?.total_capacity || 0}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={
                      dashboardData?.package_stats?.total_capacity > 0 
                        ? (dashboardData.package_stats.total_occupied / dashboardData.package_stats.total_capacity) * 100 
                        : 0
                    }
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      </Grid>

      {/* Activity Feed */}
      <Grid item xs={12}>
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          sx={{ ...glassEffect }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Aktivitas Terkini
            </Typography>
            <ActivityFeed maxItems={5} />
          </CardContent>
        </MotionCard>
      </Grid>
    </Grid>
  );

  const AnalyticsTab = () => (
    <Grid container spacing={3}>
      {/* Gender Distribution */}
      <Grid item xs={12} md={6}>
        <MotionCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          sx={{ ...glassEffect }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Distribusi Gender
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Laki-laki', value: dashboardData?.jamaah_stats?.male_count || 0 },
                    { name: 'Perempuan', value: dashboardData?.jamaah_stats?.female_count || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Laki-laki', value: dashboardData?.jamaah_stats?.male_count || 0 },
                    { name: 'Perempuan', value: dashboardData?.jamaah_stats?.female_count || 0 }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span style={{ fontWeight: 600 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </MotionCard>
      </Grid>

      {/* Status Distribution */}
      <Grid item xs={12} md={6}>
        <MotionCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          sx={{ ...glassEffect }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Status Jamaah
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="10%" 
                outerRadius="90%" 
                data={[
                  { name: 'Terdaftar', value: dashboardData?.jamaah_stats?.registered || 0, fill: COLORS[0] },
                  { name: 'Konfirmasi', value: dashboardData?.jamaah_stats?.confirmed || 0, fill: COLORS[1] },
                  { name: 'Berangkat', value: dashboardData?.jamaah_stats?.departed || 0, fill: COLORS[2] }
                ]}
              >
                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span style={{ fontWeight: 600 }}>{value}</span>}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </MotionCard>
      </Grid>

      {/* Quick Stats */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <MotionCard
              whileHover={{ scale: 1.05 }}
              sx={{ 
                ...glassEffect,
                textAlign: 'center',
                py: 3
              }}
            >
              <Groups sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                {dashboardData?.group_stats?.total_groups || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Grup
              </Typography>
            </MotionCard>
          </Grid>
          <Grid item xs={6} md={3}>
            <MotionCard
              whileHover={{ scale: 1.05 }}
              sx={{ 
                ...glassEffect,
                textAlign: 'center',
                py: 3
              }}
            >
              <Verified sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                {dashboardData?.jamaah_stats?.visa_approved || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visa Approved
              </Typography>
            </MotionCard>
          </Grid>
          <Grid item xs={6} md={3}>
            <MotionCard
              whileHover={{ scale: 1.05 }}
              sx={{ 
                ...glassEffect,
                textAlign: 'center',
                py: 3
              }}
            >
              <Schedule sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                {dashboardData?.package_stats?.upcoming_departures || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Keberangkatan Mendatang
              </Typography>
            </MotionCard>
          </Grid>
          <Grid item xs={6} md={3}>
            <MotionCard
              whileHover={{ scale: 1.05 }}
              sx={{ 
                ...glassEffect,
                textAlign: 'center',
                py: 3
              }}
            >
              <Mosque sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                {dashboardData?.package_stats?.active_packages || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paket Aktif
              </Typography>
            </MotionCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  if (dashboardLoading && !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.background.default,
    }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography 
            variant="h3" 
            fontWeight={800}
            sx={{ ...gradientText }}
          >
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor performa dan statistik jamaah umroh
          </Typography>
        </Box>
        <Box>
          <IconButton 
            onClick={handleRefresh}
            sx={{ 
              mr: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <Refresh />
          </IconButton>
          <IconButton 
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            PaperProps={{
              sx: { ...glassEffect }
            }}
          >
            <MenuItem onClick={handleRefresh}>
              <Refresh sx={{ mr: 1 }} />
              Refresh Data
            </MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)}>
              <Download sx={{ mr: 1 }} />
              Export Report
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }
          }}
        >
          <Tab icon={<Assessment />} label="Overview" iconPosition="start" />
          <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && <OverviewTab />}
      {currentTab === 1 && <AnalyticsTab />}
    </Box>
  );
};

export default ModernDashboardPage;
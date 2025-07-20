import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Tabs,
  Tab,
  LinearProgress
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
  Assessment
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import ActivityFeed from '../components/activity/ActivityFeed';
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
  ResponsiveContainer
} from 'recharts';

import { reportsAPI, jamaahAPI } from '../services/api';
import ActivityFeed from '../components/activity/ActivityFeed';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const StatCard = ({ title, value, icon, color = 'primary', trend, loading = false }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" component="div" gutterBottom>
            {loading ? <LinearProgress /> : (value || 0)}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {title}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              {trend > 0 ? (
                <TrendingUp color="success" sx={{ mr: 0.5 }} />
              ) : (
                <TrendingDown color="error" sx={{ mr: 0.5 }} />
              )}
              <Typography 
                variant="caption" 
                color={trend > 0 ? 'success.main' : 'error.main'}
              >
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
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

const DashboardPage = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch } = useQuery(
    'dashboard-data',
    reportsAPI.getDashboard,
    {
      select: data => data.data,
      refetchInterval: 300000 // Refresh every 5 minutes
    }
  );

  // Fetch jamaah statistics
  const { data: jamaahStats, isLoading: jamaahLoading } = useQuery(
    'jamaah-statistics',
    jamaahAPI.getStatistics,
    {
      select: data => data.data
    }
  );

  const statCards = [
    {
      title: 'Total Jamaah',
      value: dashboardData?.jamaah_stats?.total_jamaah,
      icon: <People />,
      color: 'primary',
      trend: 12
    },
    {
      title: 'Terdaftar',
      value: dashboardData?.jamaah_stats?.registered,
      icon: <PersonAdd />,
      color: 'info',
      trend: 8
    },
    {
      title: 'Konfirmasi',
      value: dashboardData?.jamaah_stats?.confirmed,
      icon: <CheckCircle />,
      color: 'success',
      trend: 15
    },
    {
      title: 'Berangkat',
      value: dashboardData?.jamaah_stats?.departed,
      icon: <FlightTakeoff />,
      color: 'warning',
      trend: -3
    },
    {
      title: 'Total Pembayaran',
      value: dashboardData?.payment_stats?.total_amount ? 
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(dashboardData.payment_stats.total_amount) : 'Rp 0',
      icon: <Payment />,
      color: 'success',
      trend: 25
    },
    {
      title: 'Visa Approved',
      value: dashboardData?.jamaah_stats?.visa_approved,
      icon: <Verified />,
      color: 'success',
      trend: 18
    }
  ];

  const handleRefresh = () => {
    refetch();
    setMenuAnchor(null);
  };

  const formatTrendData = (data) => {
    return data?.map(item => ({
      month: new Date(item.month).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      jamaah_count: item.jamaah_count
    })) || [];
  };

  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Statistics Cards */}
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <StatCard {...card} loading={dashboardLoading} />
        </Grid>
      ))}

      {/* Monthly Trends Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tren Pendaftaran Jamaah (12 Bulan Terakhir)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={formatTrendData(dashboardData?.monthly_trends)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="jamaah_count" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Activity Feed */}
      <Grid item xs={12} md={4}>
        <ActivityFeed maxItems={5} />
      </Grid>

      {/* Package Occupancy */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kapasitas Paket
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Kapasitas: {dashboardData?.package_stats?.total_capacity || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Terisi: {dashboardData?.package_stats?.total_occupied || 0}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={
                  dashboardData?.package_stats?.total_capacity > 0 
                    ? (dashboardData.package_stats.total_occupied / dashboardData.package_stats.total_capacity) * 100 
                    : 0
                }
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment Status Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Status Pembayaran
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip 
                label={`Lunas: ${dashboardData?.jamaah_stats?.fully_paid || 0}`}
                color="success"
                variant="outlined"
              />
              <Chip 
                label={`Sebagian: ${(dashboardData?.jamaah_stats?.total_jamaah || 0) - (dashboardData?.jamaah_stats?.fully_paid || 0)}`}
                color="warning"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const AnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Analitik lengkap akan tersedia di update berikutnya
        </Typography>
      </Grid>
      
      {/* Gender Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribusi Gender
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Laki-laki', value: dashboardData?.jamaah_stats?.male_count || 0 },
                    { name: 'Perempuan', value: dashboardData?.jamaah_stats?.female_count || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {[
                    { name: 'Laki-laki', value: dashboardData?.jamaah_stats?.male_count || 0 },
                    { name: 'Perempuan', value: dashboardData?.jamaah_stats?.female_count || 0 }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Status Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Status Jamaah
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { name: 'Terdaftar', value: dashboardData?.jamaah_stats?.registered || 0 },
                  { name: 'Konfirmasi', value: dashboardData?.jamaah_stats?.confirmed || 0 },
                  { name: 'Berangkat', value: dashboardData?.jamaah_stats?.departed || 0 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (dashboardLoading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Box>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
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
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab icon={<Assessment />} label="Overview" />
          <Tab icon={<TrendingUp />} label="Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && <OverviewTab />}
      {currentTab === 1 && <AnalyticsTab />}
    </Box>
  );
};

export default DashboardPage;
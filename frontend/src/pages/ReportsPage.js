import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ReportsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [reports, setReports] = useState({
    overview: {},
    jamaah: {},
    payments: {},
    packages: {},
    documents: {}
  });

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    
    try {
      const endpoints = [
        '/api/reports/overview',
        `/api/reports/jamaah?period=${dateRange}`,
        `/api/reports/payments?period=${dateRange}`,
        `/api/reports/packages?period=${dateRange}`,
        `/api/reports/documents?period=${dateRange}`
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint =>
          axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      setReports({
        overview: responses[0].data,
        jamaah: responses[1].data,
        payments: responses[2].data,
        packages: responses[3].data,
        documents: responses[4].data
      });
    } catch (error) {
      setError('Gagal memuat data laporan');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`/api/reports/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { period: dateRange },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderOverviewCards = () => {
    const { overview } = reports;
    
    const cards = [
      {
        title: 'Total Jamaah',
        value: overview.total_jamaah || 0,
        icon: <TrendingUpIcon />,
        color: 'primary'
      },
      {
        title: 'Jamaah Aktif',
        value: overview.active_jamaah || 0,
        icon: <TrendingUpIcon />,
        color: 'success'
      },
      {
        title: 'Total Pembayaran',
        value: formatCurrency(overview.total_payments || 0),
        icon: <BarChartIcon />,
        color: 'info'
      },
      {
        title: 'Dokumen Pending',
        value: overview.pending_documents || 0,
        icon: <PieChartIcon />,
        color: 'warning'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: `${card.color}.main`, mr: 1 }}>
                    {card.icon}
                  </Box>
                  <Typography color="textSecondary" variant="h6">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderJamaahCharts = () => {
    const { jamaah } = reports;
    
    return (
      <Grid container spacing={3}>
        {/* Gender Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribusi Jenis Kelamin
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={jamaah.gender_distribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(jamaah.gender_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Age Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribusi Usia
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jamaah.age_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age_group" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Registration Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tren Pendaftaran
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={jamaah.registration_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderPaymentCharts = () => {
    const { payments } = reports;
    
    return (
      <Grid container spacing={3}>
        {/* Payment Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Pembayaran
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={payments.payment_status || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {(payments.payment_status || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Methods */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Metode Pembayaran
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={payments.payment_methods || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total_amount" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tren Pembayaran
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={payments.payment_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="daily_amount"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative_amount"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderPackageTable = () => {
    const { packages } = reports;
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Laporan Paket Umroh
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama Paket</TableCell>
                  <TableCell>Tanggal Berangkat</TableCell>
                  <TableCell align="right">Kuota</TableCell>
                  <TableCell align="right">Terisi</TableCell>
                  <TableCell align="right">Sisa</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(packages.package_summary || []).map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>{pkg.name}</TableCell>
                    <TableCell>
                      {new Date(pkg.departure_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell align="right">{pkg.seat_count}</TableCell>
                    <TableCell align="right">{pkg.jamaah_count}</TableCell>
                    <TableCell align="right">{pkg.seat_count - pkg.jamaah_count}</TableCell>
                    <TableCell align="right">{formatCurrency(pkg.total_revenue)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={pkg.jamaah_count >= pkg.seat_count ? 'Penuh' : 'Tersedia'}
                        color={pkg.jamaah_count >= pkg.seat_count ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    switch (reportType) {
      case 'jamaah':
        return renderJamaahCharts();
      case 'payments':
        return renderPaymentCharts();
      case 'packages':
        return renderPackageTable();
      default:
        return (
          <Box>
            {renderOverviewCards()}
            {renderJamaahCharts()}
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Laporan & Analitik
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Periode</InputLabel>
            <Select
              value={dateRange}
              label="Periode"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="week">7 Hari</MenuItem>
              <MenuItem value="month">30 Hari</MenuItem>
              <MenuItem value="quarter">3 Bulan</MenuItem>
              <MenuItem value="year">1 Tahun</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Jenis Laporan</InputLabel>
            <Select
              value={reportType}
              label="Jenis Laporan"
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="overview">Ringkasan</MenuItem>
              <MenuItem value="jamaah">Data Jamaah</MenuItem>
              <MenuItem value="payments">Pembayaran</MenuItem>
              <MenuItem value="packages">Paket Umroh</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchReports}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={() => handleExport(reportType)}
          >
            Export
          </Button>
        </Box>
      </Box>

      {renderContent()}
    </Container>
  );
};

export default ReportsPage;
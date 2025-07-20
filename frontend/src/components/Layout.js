import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Person,
  AccountCircle,
  Logout,
  Upload,
  Download,
  Group,
  Backup,
  AirplaneTicket,
  Payment,
  Description,
  Assessment
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import NotificationCenter from './notifications/NotificationCenter';

const drawerWidth = 240;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Visa', 'Tim Ticketing', 'Tim Hotel']
    },
    {
      text: 'Data Jamaah',
      icon: <People />,
      path: '/jamaah',
      roles: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Visa', 'Tim Ticketing', 'Tim Hotel']
    },
    {
      text: 'Paket Umroh',
      icon: <AirplaneTicket />,
      path: '/packages',
      roles: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Ticketing', 'Tim Hotel']
    },
    {
      text: 'Pembayaran',
      icon: <Payment />,
      path: '/payments',
      roles: ['Admin', 'Keuangan', 'Marketing']
    },
    {
      text: 'Dokumen',
      icon: <Description />,
      path: '/documents',
      roles: ['Admin', 'Marketing', 'Tim Visa', 'Operator Keberangkatan']
    },
    {
      text: 'Laporan',
      icon: <Assessment />,
      path: '/reports',
      roles: ['Admin', 'Marketing', 'Keuangan']
    },
    {
      text: 'Manajemen Grup',
      icon: <Group />,
      path: '/groups',
      roles: ['Admin', 'Marketing', 'Operator Keberangkatan', 'Tim Ticketing', 'Tim Hotel']
    },
    {
      text: 'Backup System',
      icon: <Backup />,
      path: '/backup',
      roles: ['Admin']
    },
    {
      text: 'Manajemen User',
      icon: <Person />,
      path: '/users',
      roles: ['Admin']
    }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Umroh Management
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems
          .filter(item => hasRole(item.roles))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname.startsWith(item.path)}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Aplikasi Manajemen Umroh
          </Typography>
          <NotificationCenter />
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.full_name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleLogout(); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
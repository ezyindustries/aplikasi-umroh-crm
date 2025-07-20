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
  Divider,
  Breadcrumbs,
  Link,
  Chip,
  useTheme,
  alpha,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Person,
  AccountCircle,
  Logout,
  Group,
  Backup,
  AirplaneTicket,
  Payment,
  Description,
  Assessment,
  Settings,
  Search,
  ExpandLess,
  ExpandMore,
  PersonAdd,
  ListAlt,
  Home
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import NotificationCenter from './notifications/NotificationCenter';
import { glassEffect, gradientText } from '../theme/modernTheme';

const drawerWidth = 280;

const MotionListItem = motion(ListItem);
const MotionBox = motion(Box);

const ModernLayout = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({});
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

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Visa', 'Tim Ticketing', 'Tim Hotel'],
      color: '#6366F1',
      badge: null
    },
    {
      text: 'Data Jamaah',
      icon: <People />,
      path: '/jamaah',
      roles: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Visa', 'Tim Ticketing', 'Tim Hotel'],
      color: '#EC4899',
      badge: 'New',
      submenu: [
        { text: 'Daftar Jamaah', icon: <ListAlt />, path: '/jamaah' },
        { text: 'Tambah Jamaah', icon: <PersonAdd />, path: '/jamaah/new' }
      ]
    },
    {
      text: 'Paket Umroh',
      icon: <AirplaneTicket />,
      path: '/packages',
      roles: ['Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Ticketing', 'Tim Hotel'],
      color: '#10B981'
    },
    {
      text: 'Pembayaran',
      icon: <Payment />,
      path: '/payments',
      roles: ['Admin', 'Keuangan', 'Marketing'],
      color: '#F59E0B',
      badge: '5'
    },
    {
      text: 'Dokumen',
      icon: <Description />,
      path: '/documents',
      roles: ['Admin', 'Marketing', 'Tim Visa', 'Operator Keberangkatan'],
      color: '#3B82F6'
    },
    {
      text: 'Laporan',
      icon: <Assessment />,
      path: '/reports',
      roles: ['Admin', 'Marketing', 'Keuangan'],
      color: '#8B5CF6'
    },
    {
      text: 'Manajemen Grup',
      icon: <Group />,
      path: '/groups',
      roles: ['Admin', 'Marketing', 'Operator Keberangkatan', 'Tim Ticketing', 'Tim Hotel'],
      color: '#EF4444'
    },
    {
      text: 'Backup System',
      icon: <Backup />,
      path: '/backup',
      roles: ['Admin'],
      color: '#6B7280'
    },
    {
      text: 'Manajemen User',
      icon: <Person />,
      path: '/users',
      roles: ['Admin'],
      color: '#F97316'
    }
  ];

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs = [
      { label: 'Home', path: '/dashboard', icon: <Home sx={{ fontSize: 16 }} /> }
    ];

    pathnames.forEach((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const menuItem = menuItems.find(item => item.path === path);
      
      if (menuItem) {
        breadcrumbs.push({
          label: menuItem.text,
          path: path,
          icon: React.cloneElement(menuItem.icon, { sx: { fontSize: 16 } })
        });
      } else {
        // Handle dynamic routes like /jamaah/123
        const basePath = `/${pathnames[0]}`;
        const baseMenuItem = menuItems.find(item => item.path === basePath);
        if (baseMenuItem && index === 1) {
          breadcrumbs.push({
            label: value === 'new' ? 'Tambah Baru' : `Detail ${value}`,
            path: path
          });
        }
      }
    });

    return breadcrumbs;
  };

  const SidebarMenuItem = ({ item, index }) => {
    const isActive = location.pathname.startsWith(item.path);
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.text];

    return (
      <>
        <MotionListItem
          key={item.text}
          disablePadding
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          sx={{ mb: 0.5 }}
        >
          <Tooltip title={item.text} placement="right" arrow>
            <ListItemButton
              selected={isActive}
              onClick={() => {
                if (hasSubmenu) {
                  toggleSubmenu(item.text);
                } else {
                  navigate(item.path);
                  setMobileOpen(false);
                }
              }}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                minHeight: 48,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: alpha(item.color, 0.1),
                  '&::before': {
                    transform: 'scaleX(1)',
                  }
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(item.color, 0.15),
                  color: item.color,
                  '&::before': {
                    transform: 'scaleX(1)',
                    backgroundColor: item.color,
                  },
                  '& .MuiListItemIcon-root': {
                    color: item.color,
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: item.color,
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.3s ease',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive ? item.color : 'text.secondary',
                  transition: 'color 0.3s ease',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem'
                }}
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: item.color,
                    color: 'white',
                    mr: hasSubmenu ? 0 : 1
                  }}
                />
              )}
              {hasSubmenu && (
                <IconButton
                  size="small"
                  sx={{ p: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubmenu(item.text);
                  }}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </ListItemButton>
          </Tooltip>
        </MotionListItem>

        {hasSubmenu && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List sx={{ pl: 2 }}>
              {item.submenu.map((subItem, subIndex) => (
                <MotionListItem
                  key={subItem.text}
                  disablePadding
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: subIndex * 0.05 }}
                >
                  <ListItemButton
                    selected={location.pathname === subItem.path}
                    onClick={() => {
                      navigate(subItem.path);
                      setMobileOpen(false);
                    }}
                    sx={{
                      borderRadius: 1.5,
                      mx: 1,
                      minHeight: 40,
                      '&:hover': {
                        backgroundColor: alpha(item.color, 0.08),
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(item.color, 0.12),
                        color: item.color,
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
                      {subItem.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={subItem.text}
                      primaryTypographyProps={{
                        fontSize: '0.85rem'
                      }}
                    />
                  </ListItemButton>
                </MotionListItem>
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  const drawer = (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Logo Section */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          fontWeight={800}
          sx={{ 
            ...gradientText,
            mb: 0.5 
          }}
        >
          Umroh
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Management System
        </Typography>
      </Box>

      <Divider sx={{ mx: 2, mb: 2 }} />

      {/* User Info */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box
          sx={{
            ...glassEffect,
            p: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600
            }}
          >
            {user?.full_name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {user?.full_name || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role || 'Role'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
        <List>
          {menuItems
            .filter(item => hasRole(item.roles))
            .map((item, index) => (
              <SidebarMenuItem key={item.text} item={item} index={index} />
            ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            v1.0.0 - Modern UI
          </Typography>
        </Box>
      </Box>
    </MotionBox>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          ...glassEffect,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Breadcrumbs */}
          <Box sx={{ flex: 1 }}>
            <Breadcrumbs
              separator="›"
              sx={{
                '& .MuiBreadcrumbs-separator': {
                  color: theme.palette.text.secondary,
                  mx: 1
                }
              }}
            >
              {getBreadcrumbs().map((breadcrumb, index) => (
                <Link
                  key={breadcrumb.path}
                  color={index === getBreadcrumbs().length - 1 ? 'text.primary' : 'text.secondary'}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (index < getBreadcrumbs().length - 1) {
                      navigate(breadcrumb.path);
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    textDecoration: 'none',
                    fontWeight: index === getBreadcrumbs().length - 1 ? 600 : 400,
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    }
                  }}
                >
                  {breadcrumb.icon}
                  {breadcrumb.label}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Right side controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <Search />
            </IconButton>

            <NotificationCenter />

            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0,
                ml: 1,
                '&:hover': {
                  '& .MuiAvatar-root': {
                    transform: 'scale(1.1)',
                  }
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transition: 'transform 0.2s ease',
                  fontWeight: 600
                }}
              >
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            ...glassEffect,
            mt: 1,
            minWidth: 200,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.full_name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        
        <MenuItem 
          onClick={() => { 
            navigate('/profile'); 
            handleProfileMenuClose(); 
          }}
          sx={{ gap: 2 }}
        >
          <AccountCircle fontSize="small" />
          Profile Saya
        </MenuItem>
        
        <MenuItem sx={{ gap: 2 }}>
          <Settings fontSize="small" />
          Pengaturan
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => { 
            handleLogout(); 
            handleProfileMenuClose(); 
          }}
          sx={{ gap: 2, color: 'error.main' }}
        >
          <Logout fontSize="small" />
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Toolbar />
        <AnimatePresence mode="wait">
          <MotionBox
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </MotionBox>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default ModernLayout;
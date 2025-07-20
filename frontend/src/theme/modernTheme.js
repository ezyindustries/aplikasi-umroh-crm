import { createTheme } from '@mui/material/styles';

// Modern color palette with gradients
const colors = {
  primary: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  secondary: {
    main: '#EC4899',
    light: '#F472B6',
    dark: '#DB2777',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
  },
  warning: {
    main: '#F59E0B',
    light: '#FCD34D',
    dark: '#D97706',
  },
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
  background: {
    default: '#F9FAFB',
    paper: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
  },
  divider: '#E5E7EB',
  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.2)',
  },
};

const modernTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
    },
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: colors.text,
    divider: colors.divider,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 6px rgba(0, 0, 0, 0.05)',
    '0px 6px 8px rgba(0, 0, 0, 0.05)',
    '0px 8px 10px rgba(0, 0, 0, 0.05)',
    '0px 10px 12px rgba(0, 0, 0, 0.05)',
    '0px 12px 16px rgba(0, 0, 0, 0.06)',
    '0px 16px 20px rgba(0, 0, 0, 0.06)',
    '0px 20px 24px rgba(0, 0, 0, 0.06)',
    '0px 24px 32px rgba(0, 0, 0, 0.07)',
    '0px 32px 40px rgba(0, 0, 0, 0.07)',
    '0px 40px 48px rgba(0, 0, 0, 0.08)',
    '0px 48px 56px rgba(0, 0, 0, 0.08)',
    '0px 56px 64px rgba(0, 0, 0, 0.09)',
    '0px 64px 72px rgba(0, 0, 0, 0.09)',
    '0px 72px 80px rgba(0, 0, 0, 0.1)',
    '0px 80px 88px rgba(0, 0, 0, 0.1)',
    '0px 88px 96px rgba(0, 0, 0, 0.11)',
    '0px 96px 104px rgba(0, 0, 0, 0.11)',
    '0px 104px 112px rgba(0, 0, 0, 0.12)',
    '0px 112px 120px rgba(0, 0, 0, 0.12)',
    '0px 120px 128px rgba(0, 0, 0, 0.13)',
    '0px 128px 136px rgba(0, 0, 0, 0.13)',
    '0px 136px 144px rgba(0, 0, 0, 0.14)',
    '0px 144px 152px rgba(0, 0, 0, 0.14)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          background: colors.primary.gradient,
          '&:hover': {
            background: colors.primary.gradient,
            opacity: 0.9,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.3s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary.main,
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderBottom: `1px solid ${colors.divider}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${colors.divider}`,
          backgroundColor: colors.background.paper,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '4px 8px',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: colors.primary.light + '20',
          },
          '&.Mui-selected': {
            backgroundColor: colors.primary.main,
            color: '#fff',
            '&:hover': {
              backgroundColor: colors.primary.dark,
            },
            '& .MuiListItemIcon-root': {
              color: '#fff',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 12,
          '& .MuiDataGrid-cell': {
            borderColor: colors.divider,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: colors.background.default,
            borderBottom: `2px solid ${colors.divider}`,
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: colors.primary.light + '10',
            },
          },
        },
      },
    },
  },
});

// Custom style utilities
export const glassEffect = {
  background: colors.glass.background,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${colors.glass.border}`,
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
};

export const gradientText = {
  background: colors.primary.gradient,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export const modernShadow = {
  small: '0 2px 8px rgba(0, 0, 0, 0.04)',
  medium: '0 4px 16px rgba(0, 0, 0, 0.06)',
  large: '0 8px 32px rgba(0, 0, 0, 0.08)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.1)',
};

export default modernTheme;
import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Box,
  Typography,
  Skeleton,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
  Avatar,
  useTheme,
  alpha,
  Collapse,
  Stack
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Cancel,
  Warning,
  Search,
  FilterList,
  ArrowUpward,
  ArrowDownward,
  Clear,
  PersonAdd,
  Payment,
  Flight
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { glassEffect, modernShadow } from '../../theme/modernTheme';

const MotionTableRow = motion(TableRow);
const MotionPaper = motion(Paper);

const ModernDataTable = ({
  data = [],
  columns = [],
  loading = false,
  pagination = {},
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  actions = [],
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  emptyMessage = "Tidak ada data",
  stickyHeader = true,
  searchable = true,
  filterable = true,
  sortable = true,
  title,
  subtitle,
  headerActions = [],
  onInlineEdit,
  editableFields = []
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowForMenu, setSelectedRowForMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleMenuOpen = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRowForMenu(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowForMenu(null);
  };

  const handleActionClick = (action, row) => {
    handleMenuClose();
    if (action.onClick) {
      action.onClick(row);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = filteredAndSortedData.map(row => row.id);
      onSelectionChange && onSelectionChange(newSelected);
    } else {
      onSelectionChange && onSelectionChange([]);
    }
  };

  const handleSelectRow = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selectedRows.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedRows.slice(1));
    } else if (selectedIndex === selectedRows.length - 1) {
      newSelected = newSelected.concat(selectedRows.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedRows.slice(0, selectedIndex),
        selectedRows.slice(selectedIndex + 1)
      );
    }
    onSelectionChange && onSelectionChange(newSelected);
  };

  const handleSort = (field) => {
    if (!sortable) return;
    
    const direction = sortConfig.key === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: field, direction });
  };

  const handleCellEdit = (rowId, field, value) => {
    setEditingCell({ rowId, field });
    setEditValue(value);
  };

  const handleSaveEdit = () => {
    if (onInlineEdit && editingCell) {
      onInlineEdit(editingCell.rowId, editingCell.field, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(row =>
        columns.some(column =>
          String(row[column.field] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue) {
        result = result.filter(row =>
          String(row[field] || '').toLowerCase().includes(String(filterValue).toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, columns]);

  const isSelected = (id) => selectedRows.indexOf(id) !== -1;


  const renderCellContent = (column, row) => {
    const value = row[column.field];
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === column.field;
    const isEditable = editableFields.includes(column.field);

    if (isEditing) {
      return (
        <TextField
          size="small"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') handleCancelEdit();
          }}
          autoFocus
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem',
              height: 32
            }
          }}
        />
      );
    }

    if (column.render) {
      return column.render(value, row);
    }

    const cellContent = (() => {
      switch (column.type) {
        case 'status':
          return renderStatusChip(value);
        case 'boolean':
          return value ? (
            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 20 }} />
          ) : (
            <Cancel sx={{ color: theme.palette.error.main, fontSize: 20 }} />
          );
        case 'currency':
          return (
            <Typography variant="body2" fontWeight={600} color="success.main">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(value || 0)}
            </Typography>
          );
        case 'date':
          return (
            <Typography variant="body2" color="text.secondary">
              {value ? new Date(value).toLocaleDateString('id-ID') : '-'}
            </Typography>
          );
        case 'avatar':
          return (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.875rem',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }}
            >
              {String(value || '').charAt(0).toUpperCase()}
            </Avatar>
          );
        default:
          return (
            <Typography variant="body2" noWrap>
              {value || '-'}
            </Typography>
          );
      }
    })();

    return (
      <Box
        onClick={isEditable ? () => handleCellEdit(row.id, column.field, value) : undefined}
        sx={{
          cursor: isEditable ? 'pointer' : 'default',
          '&:hover': isEditable ? {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 1,
            padding: '2px 4px',
            margin: '-2px -4px'
          } : {}
        }}
      >
        {cellContent}
      </Box>
    );
  };

  const renderStatusChip = (status) => {
    const statusConfig = {
      'registered': { color: 'default', label: 'Terdaftar', icon: <PersonAdd sx={{ fontSize: 14 }} /> },
      'confirmed': { color: 'primary', label: 'Konfirmasi', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
      'departed': { color: 'success', label: 'Berangkat', icon: <Flight sx={{ fontSize: 14 }} /> },
      'cancelled': { color: 'error', label: 'Batal', icon: <Cancel sx={{ fontSize: 14 }} /> },
      'pending': { color: 'warning', label: 'Pending', icon: <Warning sx={{ fontSize: 14 }} /> },
      'approved': { color: 'success', label: 'Disetujui', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
      'rejected': { color: 'error', label: 'Ditolak', icon: <Cancel sx={{ fontSize: 14 }} /> },
      'paid': { color: 'success', label: 'Lunas', icon: <Payment sx={{ fontSize: 14 }} /> },
      'partial': { color: 'warning', label: 'Sebagian', icon: <Payment sx={{ fontSize: 14 }} /> },
      'unpaid': { color: 'error', label: 'Belum Bayar', icon: <Payment sx={{ fontSize: 14 }} /> }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return (
      <Chip
        size="small"
        color={config.color}
        label={config.label}
        icon={config.icon}
        sx={{
          fontWeight: 600,
          borderRadius: 2,
          '& .MuiChip-icon': {
            fontSize: 14
          }
        }}
      />
    );
  };

  const LoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <MotionTableRow
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {selectable && (
            <TableCell>
              <Skeleton variant="rectangular" width={20} height={20} />
            </TableCell>
          )}
          {columns.map((column, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton variant="text" height={24} />
            </TableCell>
          ))}
          {actions.length > 0 && (
            <TableCell>
              <Skeleton variant="circular" width={24} height={24} />
            </TableCell>
          )}
        </MotionTableRow>
      ))}
    </>
  );

  if (loading) {
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ ...glassEffect, overflow: 'hidden' }}
      >
        <TableContainer>
          <Table stickyHeader={stickyHeader}>
            <TableHead>
              <TableRow>
                {selectable && <TableCell padding="checkbox" />}
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                ))}
                {actions.length > 0 && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              <LoadingSkeleton />
            </TableBody>
          </Table>
        </TableContainer>
      </MotionPaper>
    );
  }

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        ...glassEffect,
        overflow: 'hidden',
        '&:hover': {
          boxShadow: modernShadow.xl,
        },
        transition: 'box-shadow 0.3s ease'
      }}
    >
      {/* Header */}
      {(title || searchable || headerActions.length > 0) && (
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              {title && (
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              {headerActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outlined"}
                  color={action.color || "primary"}
                  startIcon={action.icon}
                  onClick={action.onClick}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Search and Filters */}
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            {searchable && (
              <TextField
                size="small"
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        sx={{ p: 0.5 }}
                      >
                        <Clear sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                  }
                }}
              />
            )}

            {filterable && (
              <Button
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "contained" : "outlined"}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Filter
              </Button>
            )}

            {selectedRows.length > 0 && (
              <Chip
                label={`${selectedRows.length} dipilih`}
                onDelete={() => onSelectionChange && onSelectionChange([])}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>

          {/* Filter Controls */}
          <Collapse in={showFilters}>
            <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Filter Data
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {columns.filter(col => col.filterable !== false).map((column) => (
                  <TextField
                    key={column.field}
                    size="small"
                    label={column.headerName}
                    value={filters[column.field] || ''}
                    onChange={(e) => setFilters({ ...filters, [column.field]: e.target.value })}
                    sx={{ minWidth: 200 }}
                  />
                ))}
                <Button
                  variant="outlined"
                  onClick={() => setFilters({})}
                  startIcon={<Clear />}
                  size="small"
                >
                  Reset
                </Button>
              </Stack>
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Table */}
      <TableContainer>
        <Table stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < filteredAndSortedData.length}
                    checked={filteredAndSortedData.length > 0 && selectedRows.length === filteredAndSortedData.length}
                    onChange={handleSelectAll}
                    sx={{
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                      }
                    }}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.background.default, 0.8),
                    backdropFilter: 'blur(10px)',
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    cursor: sortable && column.sortable !== false ? 'pointer' : 'default',
                    '&:hover': sortable && column.sortable !== false ? {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    } : {}
                  }}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.field)}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    {column.headerName}
                    {sortable && column.sortable !== false && (
                      <Box display="flex" flexDirection="column">
                        <ArrowUpward
                          sx={{
                            fontSize: 12,
                            color: sortConfig.key === column.field && sortConfig.direction === 'asc'
                              ? theme.palette.primary.main
                              : theme.palette.action.disabled,
                            mb: -0.5
                          }}
                        />
                        <ArrowDownward
                          sx={{
                            fontSize: 12,
                            color: sortConfig.key === column.field && sortConfig.direction === 'desc'
                              ? theme.palette.primary.main
                              : theme.palette.action.disabled
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell 
                  align="center"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.background.default, 0.8),
                    backdropFilter: 'blur(10px)',
                    borderBottom: `2px solid ${theme.palette.divider}`
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  align="center"
                >
                  <Box py={6}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {emptyMessage}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Belum ada data untuk ditampilkan'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filteredAndSortedData.map((row, index) => {
                  const isItemSelected = isSelected(row.id);
                  return (
                    <MotionTableRow
                      key={row.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      hover
                      selected={isItemSelected}
                      onClick={() => onRowClick && onRowClick(row)}
                      sx={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        }
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            onChange={(event) => handleSelectRow(event, row.id)}
                            sx={{
                              '&.Mui-checked': {
                                color: theme.palette.primary.main,
                              }
                            }}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={column.field}
                          align={column.align || 'left'}
                          sx={{ py: 1.5 }}
                        >
                          {renderCellContent(column, row)}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Tooltip title="Actions">
                            <IconButton
                              size="small"
                              onClick={(event) => handleMenuOpen(event, row)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                }
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </MotionTableRow>
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.per_page}
          page={pagination.current_page - 1}
          onPageChange={(event, newPage) => onPageChange && onPageChange(newPage + 1)}
          onRowsPerPageChange={(event) => onRowsPerPageChange && onRowsPerPageChange(parseInt(event.target.value, 10))}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}–${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
          }
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            '& .MuiTablePagination-toolbar': {
              paddingX: 3,
            }
          }}
        />
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            ...glassEffect,
            minWidth: 200,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleActionClick(action, selectedRowForMenu)}
            disabled={action.disabled && action.disabled(selectedRowForMenu)}
            sx={{
              gap: 2,
              py: 1.5,
              '&:hover': {
                backgroundColor: alpha(action.color || theme.palette.primary.main, 0.1),
                color: action.color || theme.palette.primary.main,
              }
            }}
          >
            {action.icon}
            <Typography variant="body2" fontWeight={500}>
              {action.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </MotionPaper>
  );
};

export default ModernDataTable;
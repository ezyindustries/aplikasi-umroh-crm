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
  Skeleton
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';

const DataTable = ({
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
  stickyHeader = true
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowForMenu, setSelectedRowForMenu] = useState(null);

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
      const newSelected = data.map(row => row.id);
      onSelectionChange(newSelected);
    } else {
      onSelectionChange([]);
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
    onSelectionChange(newSelected);
  };

  const isSelected = (id) => selectedRows.indexOf(id) !== -1;

  const renderCellContent = (column, row) => {
    const value = row[column.field];

    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case 'status':
        return renderStatusChip(value);
      case 'boolean':
        return value ? <CheckCircle color="success" /> : <Cancel color="error" />;
      case 'currency':
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR'
        }).format(value || 0);
      case 'date':
        return value ? new Date(value).toLocaleDateString('id-ID') : '-';
      default:
        return value || '-';
    }
  };

  const renderStatusChip = (status) => {
    const statusConfig = {
      'registered': { color: 'default', label: 'Terdaftar' },
      'confirmed': { color: 'primary', label: 'Konfirmasi' },
      'departed': { color: 'success', label: 'Berangkat' },
      'cancelled': { color: 'error', label: 'Batal' },
      'pending': { color: 'warning', label: 'Pending' },
      'approved': { color: 'success', label: 'Disetujui' },
      'rejected': { color: 'error', label: 'Ditolak' },
      'paid': { color: 'success', label: 'Lunas' },
      'partial': { color: 'warning', label: 'Sebagian' },
      'unpaid': { color: 'error', label: 'Belum Bayar' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  const LoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          {selectable && (
            <TableCell>
              <Skeleton variant="rectangular" width={20} height={20} />
            </TableCell>
          )}
          {columns.map((column, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton variant="text" />
            </TableCell>
          ))}
          {actions.length > 0 && (
            <TableCell>
              <Skeleton variant="circular" width={24} height={24} />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {selectable && <TableCell padding="checkbox" />}
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.headerName}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="center">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            <LoadingSkeleton />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
                    checked={data.length > 0 && selectedRows.length === data.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.headerName}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="center">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  align="center"
                >
                  <Box py={4}>
                    <Typography variant="body1" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const isItemSelected = isSelected(row.id);
                return (
                  <TableRow
                    hover
                    key={row.id}
                    selected={isItemSelected}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={(event) => handleSelectRow(event, row.id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.field}
                        align={column.align || 'left'}
                      >
                        {renderCellContent(column, row)}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuOpen(event, row)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && pagination.total > 0 && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.per_page}
          page={pagination.current_page - 1}
          onPageChange={(event, newPage) => onPageChange(newPage + 1)}
          onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}–${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
          }
        />
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleActionClick(action, selectedRowForMenu)}
            disabled={action.disabled && action.disabled(selectedRowForMenu)}
          >
            {action.icon && <Box mr={1}>{action.icon}</Box>}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default DataTable;
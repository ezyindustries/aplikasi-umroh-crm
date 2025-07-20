import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Grid,
  Paper,
  Collapse,
  IconButton,
  Typography
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

const SearchFilter = ({
  onSearch,
  onFilter,
  filters = [],
  searchPlaceholder = "Cari...",
  showAdvancedFilters = true
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const initialFilters = {};
    filters.forEach(filter => {
      initialFilters[filter.field] = filter.defaultValue || '';
    });
    setFilterValues(initialFilters);
  }, [filters]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    
    // Debounce search
    const delayTimer = setTimeout(() => {
      onSearch(value);
    }, 500);

    return () => clearTimeout(delayTimer);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...filterValues,
      [field]: value
    };
    setFilterValues(newFilters);
    onFilter(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    filters.forEach(filter => {
      clearedFilters[filter.field] = '';
    });
    setFilterValues(clearedFilters);
    setSearchValue('');
    onSearch('');
    onFilter(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filterValues).filter(value => value !== '').length;
  };

  const renderFilter = (filter) => {
    const value = filterValues[filter.field] || '';

    switch (filter.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small" key={filter.field}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={value}
              label={filter.label}
              onChange={(e) => handleFilterChange(filter.field, e.target.value)}
            >
              <MenuItem value="">
                <em>Semua</em>
              </MenuItem>
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <TextField
            key={filter.field}
            fullWidth
            size="small"
            type="date"
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.field, e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );

      default:
        return (
          <TextField
            key={filter.field}
            fullWidth
            size="small"
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.field, e.target.value)}
          />
        );
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box>
        {/* Search Bar */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          
          {showAdvancedFilters && (
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                <Button
                  variant={showFilters ? "contained" : "outlined"}
                  startIcon={<FilterList />}
                  endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                >
                  Filter
                  {getActiveFiltersCount() > 0 && (
                    <Chip
                      size="small"
                      label={getActiveFiltersCount()}
                      color="primary"
                      sx={{ ml: 1, height: 20 }}
                    />
                  )}
                </Button>
                
                {getActiveFiltersCount() > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={handleClearFilters}
                    size="small"
                    color="error"
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Collapse in={showFilters}>
            <Box mt={2} pt={2} borderTop={1} borderColor="divider">
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Filter Lanjutan
              </Typography>
              <Grid container spacing={2}>
                {filters.map((filter, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    {renderFilter(filter)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        )}
      </Box>
    </Paper>
  );
};

export default SearchFilter;
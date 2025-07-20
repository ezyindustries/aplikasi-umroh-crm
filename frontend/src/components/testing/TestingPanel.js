import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Grid,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore,
  PlayArrow,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  BugReport,
  Speed,
  Security,
  Visibility
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { generateTestReport } from '../../utils/testHelpers';
import { glassEffect } from '../../theme/modernTheme';

const MotionPaper = motion(Paper);

const TestingPanel = ({ onClose }) => {
  const theme = useTheme();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [progress, setProgress] = useState(0);

  const runTests = async () => {
    setTesting(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const results = await generateTestReport();
      
      clearInterval(progressInterval);
      setProgress(100);
      setTestResults(results);
    } catch (error) {
      console.error('Testing failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'success' || status === true) return theme.palette.success.main;
    if (status === 'error' || status === false) return theme.palette.error.main;
    if (status === 'warning') return theme.palette.warning.main;
    return theme.palette.info.main;
  };

  const getStatusIcon = (status) => {
    if (status === 'success' || status === true) return <CheckCircle />;
    if (status === 'error' || status === false) return <Error />;
    if (status === 'warning') return <Warning />;
    return <Info />;
  };

  const renderButtonTests = () => {
    if (!testResults?.buttons) return null;

    const workingButtons = testResults.buttons.filter(b => !b.isDisabled);
    const disabledButtons = testResults.buttons.filter(b => b.isDisabled);

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <BugReport color="primary" />
            <Typography variant="h6">Button Testing</Typography>
            <Chip 
              label={`${workingButtons.length}/${testResults.buttons.length} Working`} 
              color={workingButtons.length === testResults.buttons.length ? 'success' : 'warning'}
              size="small"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="success.main">
                ✅ Working Buttons ({workingButtons.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {workingButtons.map((button, index) => (
                  <Chip
                    key={index}
                    label={button.text}
                    size="small"
                    variant="outlined"
                    color="success"
                    sx={{ m: 0.5 }}
                    onClick={() => button.element.scrollIntoView({ behavior: 'smooth' })}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="warning.main">
                ⚠️ Disabled Buttons ({disabledButtons.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {disabledButtons.map((button, index) => (
                  <Chip
                    key={index}
                    label={button.text}
                    size="small"
                    variant="outlined"
                    color="warning"
                    sx={{ m: 0.5 }}
                    onClick={() => button.element.scrollIntoView({ behavior: 'smooth' })}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderAPITests = () => {
    if (!testResults?.apis) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Security color="primary" />
            <Typography variant="h6">API Connection Tests</Typography>
            <Chip 
              label={`${testResults.summary.apiSuccess}/${testResults.summary.apiTotal} Connected`} 
              color={testResults.summary.apiSuccess === testResults.summary.apiTotal ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Response</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testResults.apis.map((api, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {api.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {api.url}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(api.ok)}
                        label={api.status || 'Error'}
                        color={api.ok ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {api.statusText || api.error || 'Unknown'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderFormTests = () => {
    if (!testResults?.forms) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Visibility color="primary" />
            <Typography variant="h6">Form Validation Tests</Typography>
            <Chip 
              label={`${testResults.summary.validForms} Forms Found`} 
              color="info"
              size="small"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {testResults.forms.length === 0 ? (
            <Alert severity="info">No forms found on current page</Alert>
          ) : (
            testResults.forms.map((form, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Form {index + 1} ({form.length} fields)
                </Typography>
                <Grid container spacing={1}>
                  {form.map((field, fieldIndex) => (
                    <Grid item key={fieldIndex}>
                      <Chip
                        label={field.name || field.type}
                        size="small"
                        color={field.isRequired ? 'primary' : 'default'}
                        variant={field.hasValidation ? 'filled' : 'outlined'}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderResponsiveTests = () => {
    if (!testResults?.responsive) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Speed color="primary" />
            <Typography variant="h6">Responsive Design Tests</Typography>
            <Chip label="Breakpoint Analysis" color="info" size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {testResults.responsive.map((test, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {test.breakpoint}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {test.width}px
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      label="Responsive"
                      color={test.mainContentResponsive ? 'success' : 'warning'}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <MotionPaper
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      sx={{
        position: 'fixed',
        top: 100,
        right: 20,
        width: 600,
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 9999,
        ...glassEffect,
        p: 3
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          🧪 UI Testing Panel
        </Typography>
        <Box>
          <Tooltip title="Refresh Tests">
            <IconButton onClick={runTests} disabled={testing}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button onClick={onClose} variant="outlined" size="small">
            Close
          </Button>
        </Box>
      </Box>

      {/* Run Tests Button */}
      {!testResults && (
        <Box textAlign="center" mb={3}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={runTests}
            disabled={testing}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 3,
              px: 4,
              py: 1.5
            }}
          >
            {testing ? 'Running Tests...' : 'Start Testing'}
          </Button>
        </Box>
      )}

      {/* Progress Bar */}
      {testing && (
        <Box mb={3}>
          <Typography variant="body2" gutterBottom>
            Testing in progress... {progress}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }
            }} 
          />
        </Box>
      )}

      {/* Test Results */}
      {testResults && (
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {testResults.summary.workingButtons}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Working Buttons
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                <Typography variant="h4" color="info.main" fontWeight={700}>
                  {testResults.summary.apiSuccess}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  API Connections
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Test Categories */}
          <Box>
            {renderButtonTests()}
            {renderAPITests()}
            {renderFormTests()}
            {renderResponsiveTests()}
          </Box>

          {/* Test Again Button */}
          <Box textAlign="center" mt={3}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={runTests}
              disabled={testing}
            >
              Run Tests Again
            </Button>
          </Box>
        </Box>
      )}
    </MotionPaper>
  );
};

export default TestingPanel;
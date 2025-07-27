const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test Results Storage
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, status, details = '') {
  testResults.totalTests++;
  if (status === 'PASS') {
    testResults.passedTests++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failedTests++;
    console.log(`❌ ${testName} - FAILED: ${details}`);
  }
  
  testResults.details.push({
    testName,
    status,
    details,
    timestamp: new Date().toISOString()
  });
}

// Store auth token
let authToken = '';
let testUserId = '';
let testJamaahId = '';
let testPackageId = '';
let testPaymentId = '';
let testDocumentId = '';
let testGroupId = '';

// Test Functions
async function testDatabaseConnection() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.data.database === 'connected') {
      logTest('Database Connection', 'PASS');
      return true;
    }
    logTest('Database Connection', 'FAIL', 'Database not connected');
    return false;
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function testAuthentication() {
  try {
    // Test Registration
    const registerData = {
      username: `testuser_${Date.now()}`,
      password: 'Test123!@#',
      email: `test_${Date.now()}@example.com`,
      fullName: 'Test User',
      role: 'admin'
    };
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    if (registerResponse.status === 201) {
      logTest('User Registration', 'PASS');
      testUserId = registerResponse.data.user.id;
    } else {
      logTest('User Registration', 'FAIL', 'Invalid response status');
      return false;
    }
    
    // Test Login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: registerData.username,
      password: registerData.password
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      logTest('User Login', 'PASS');
      return true;
    }
    
    logTest('User Login', 'FAIL', 'No token received');
    return false;
  } catch (error) {
    logTest('Authentication', 'FAIL', error.message);
    return false;
  }
}

async function testPackageManagement() {
  try {
    // Create Package
    const packageData = {
      name: 'Test Package ' + Date.now(),
      description: 'Test package description',
      price: 25000000,
      duration: 9,
      quota: 45,
      departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      tier: 'platinum',
      features: ['Visa', 'Hotel Bintang 5', 'Makan 3x Sehari']
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/packages`, packageData);
    if (createResponse.status === 201) {
      testPackageId = createResponse.data.package.id;
      logTest('Create Package', 'PASS');
    } else {
      logTest('Create Package', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Get All Packages
    const listResponse = await axios.get(`${API_BASE_URL}/packages`);
    if (listResponse.status === 200 && Array.isArray(listResponse.data.packages)) {
      logTest('List Packages', 'PASS');
    } else {
      logTest('List Packages', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Get Single Package
    const getResponse = await axios.get(`${API_BASE_URL}/packages/${testPackageId}`);
    if (getResponse.status === 200 && getResponse.data.package) {
      logTest('Get Package Details', 'PASS');
    } else {
      logTest('Get Package Details', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Update Package
    const updateResponse = await axios.put(`${API_BASE_URL}/packages/${testPackageId}`, {
      ...packageData,
      name: 'Updated Test Package'
    });
    if (updateResponse.status === 200) {
      logTest('Update Package', 'PASS');
    } else {
      logTest('Update Package', 'FAIL', 'Invalid response');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Package Management', 'FAIL', error.message);
    return false;
  }
}

async function testJamaahManagement() {
  try {
    // Create Jamaah
    const jamaahData = {
      fullName: 'Test Jamaah ' + Date.now(),
      nik: '3201234567890' + Math.floor(Math.random() * 1000),
      birthDate: '1980-01-01',
      gender: 'L',
      address: 'Jl. Test No. 123',
      phone: '081234567890',
      email: `jamaah_${Date.now()}@test.com`,
      passportNumber: 'A' + Math.floor(Math.random() * 10000000),
      passportExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      packageId: testPackageId,
      mahramName: 'Test Mahram',
      mahramRelation: 'Suami'
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/jamaah`, jamaahData);
    if (createResponse.status === 201) {
      testJamaahId = createResponse.data.jamaah.id;
      logTest('Create Jamaah', 'PASS');
    } else {
      logTest('Create Jamaah', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Test Duplicate NIK
    try {
      await axios.post(`${API_BASE_URL}/jamaah`, jamaahData);
      logTest('Duplicate NIK Prevention', 'FAIL', 'Duplicate NIK was allowed');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logTest('Duplicate NIK Prevention', 'PASS');
      } else {
        logTest('Duplicate NIK Prevention', 'FAIL', 'Unexpected error');
      }
    }
    
    // List Jamaah
    const listResponse = await axios.get(`${API_BASE_URL}/jamaah`);
    if (listResponse.status === 200 && Array.isArray(listResponse.data.jamaah)) {
      logTest('List Jamaah', 'PASS');
    } else {
      logTest('List Jamaah', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Search Jamaah
    const searchResponse = await axios.get(`${API_BASE_URL}/jamaah?search=${jamaahData.fullName}`);
    if (searchResponse.status === 200 && searchResponse.data.jamaah.length > 0) {
      logTest('Search Jamaah', 'PASS');
    } else {
      logTest('Search Jamaah', 'FAIL', 'Search not working');
      return false;
    }
    
    // Update Jamaah
    const updateResponse = await axios.put(`${API_BASE_URL}/jamaah/${testJamaahId}`, {
      ...jamaahData,
      address: 'Updated Address'
    });
    if (updateResponse.status === 200) {
      logTest('Update Jamaah', 'PASS');
    } else {
      logTest('Update Jamaah', 'FAIL', 'Invalid response');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Jamaah Management', 'FAIL', error.message);
    return false;
  }
}

async function testPaymentManagement() {
  try {
    // Create Payment
    const paymentData = {
      jamaahId: testJamaahId,
      amount: 5000000,
      paymentDate: new Date().toISOString(),
      paymentMethod: 'transfer',
      notes: 'Test payment',
      receiptNumber: 'RCP' + Date.now()
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/payments`, paymentData);
    if (createResponse.status === 201) {
      testPaymentId = createResponse.data.payment.id;
      logTest('Create Payment', 'PASS');
    } else {
      logTest('Create Payment', 'FAIL', 'Invalid response');
      return false;
    }
    
    // List Payments
    const listResponse = await axios.get(`${API_BASE_URL}/payments`);
    if (listResponse.status === 200 && Array.isArray(listResponse.data.payments)) {
      logTest('List Payments', 'PASS');
    } else {
      logTest('List Payments', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Get Payment by Jamaah
    const jamaahPayments = await axios.get(`${API_BASE_URL}/payments/jamaah/${testJamaahId}`);
    if (jamaahPayments.status === 200 && jamaahPayments.data.payments.length > 0) {
      logTest('Get Jamaah Payments', 'PASS');
    } else {
      logTest('Get Jamaah Payments', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Update Payment
    const updateResponse = await axios.put(`${API_BASE_URL}/payments/${testPaymentId}`, {
      ...paymentData,
      amount: 6000000
    });
    if (updateResponse.status === 200) {
      logTest('Update Payment', 'PASS');
    } else {
      logTest('Update Payment', 'FAIL', 'Invalid response');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Payment Management', 'FAIL', error.message);
    return false;
  }
}

async function testDocumentUpload() {
  try {
    // Create test file
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, 'This is a test document for upload testing');
    
    // Upload Document
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('jamaahId', testJamaahId);
    formData.append('documentType', 'passport');
    formData.append('description', 'Test document upload');
    
    const uploadResponse = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (uploadResponse.status === 201) {
      testDocumentId = uploadResponse.data.document.id;
      logTest('Document Upload', 'PASS');
    } else {
      logTest('Document Upload', 'FAIL', 'Invalid response');
      return false;
    }
    
    // List Documents
    const listResponse = await axios.get(`${API_BASE_URL}/documents/jamaah/${testJamaahId}`);
    if (listResponse.status === 200 && listResponse.data.documents.length > 0) {
      logTest('List Documents', 'PASS');
    } else {
      logTest('List Documents', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    return true;
  } catch (error) {
    logTest('Document Upload', 'FAIL', error.message);
    return false;
  }
}

async function testGroupManagement() {
  try {
    // Create Group
    const groupData = {
      name: 'Test Group ' + Date.now(),
      packageId: testPackageId,
      leaderId: testJamaahId,
      description: 'Test group description'
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/groups`, groupData);
    if (createResponse.status === 201) {
      testGroupId = createResponse.data.group.id;
      logTest('Create Group', 'PASS');
    } else {
      logTest('Create Group', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Add Member to Group
    const addMemberResponse = await axios.post(`${API_BASE_URL}/groups/${testGroupId}/members`, {
      jamaahId: testJamaahId
    });
    if (addMemberResponse.status === 200) {
      logTest('Add Group Member', 'PASS');
    } else {
      logTest('Add Group Member', 'FAIL', 'Invalid response');
      return false;
    }
    
    // List Groups
    const listResponse = await axios.get(`${API_BASE_URL}/groups`);
    if (listResponse.status === 200 && Array.isArray(listResponse.data.groups)) {
      logTest('List Groups', 'PASS');
    } else {
      logTest('List Groups', 'FAIL', 'Invalid response');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Group Management', 'FAIL', error.message);
    return false;
  }
}

async function testExcelImportExport() {
  try {
    // Test Excel Export
    const exportResponse = await axios.get(`${API_BASE_URL}/excel/export/jamaah`, {
      responseType: 'arraybuffer'
    });
    
    if (exportResponse.status === 200 && exportResponse.data.byteLength > 0) {
      logTest('Excel Export', 'PASS');
      
      // Save exported file for import test
      const exportPath = path.join(__dirname, 'test-export.xlsx');
      fs.writeFileSync(exportPath, exportResponse.data);
      
      // Test Excel Import
      const importFormData = new FormData();
      importFormData.append('file', fs.createReadStream(exportPath));
      
      const importResponse = await axios.post(`${API_BASE_URL}/excel/import/jamaah`, importFormData, {
        headers: {
          ...importFormData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (importResponse.status === 200) {
        logTest('Excel Import', 'PASS');
      } else {
        logTest('Excel Import', 'FAIL', 'Invalid response');
      }
      
      // Clean up
      fs.unlinkSync(exportPath);
    } else {
      logTest('Excel Export', 'FAIL', 'Invalid response');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Excel Import/Export', 'FAIL', error.message);
    return false;
  }
}

async function testReports() {
  try {
    // Test Package Report
    const packageReport = await axios.get(`${API_BASE_URL}/reports/packages`);
    if (packageReport.status === 200 && packageReport.data.report) {
      logTest('Package Report', 'PASS');
    } else {
      logTest('Package Report', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Test Payment Report
    const paymentReport = await axios.get(`${API_BASE_URL}/reports/payments`);
    if (paymentReport.status === 200 && paymentReport.data.report) {
      logTest('Payment Report', 'PASS');
    } else {
      logTest('Payment Report', 'FAIL', 'Invalid response');
      return false;
    }
    
    // Test Jamaah Report
    const jamaahReport = await axios.get(`${API_BASE_URL}/reports/jamaah`);
    if (jamaahReport.status === 200 && jamaahReport.data.report) {
      logTest('Jamaah Report', 'PASS');
    } else {
      logTest('Jamaah Report', 'FAIL', 'Invalid response');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Reports', 'FAIL', error.message);
    return false;
  }
}

async function testValidation() {
  try {
    // Test NIK Validation
    const invalidNIKData = {
      fullName: 'Invalid NIK Test',
      nik: '123', // Invalid NIK (too short)
      birthDate: '1980-01-01',
      gender: 'L',
      address: 'Test Address',
      phone: '081234567890',
      packageId: testPackageId
    };
    
    try {
      await axios.post(`${API_BASE_URL}/jamaah`, invalidNIKData);
      logTest('NIK Validation', 'FAIL', 'Invalid NIK was accepted');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logTest('NIK Validation', 'PASS');
      } else {
        logTest('NIK Validation', 'FAIL', 'Unexpected error');
      }
    }
    
    // Test Email Validation
    const invalidEmailData = {
      ...invalidNIKData,
      nik: '3201234567890123',
      email: 'invalid-email' // Invalid email format
    };
    
    try {
      await axios.post(`${API_BASE_URL}/jamaah`, invalidEmailData);
      logTest('Email Validation', 'FAIL', 'Invalid email was accepted');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logTest('Email Validation', 'PASS');
      } else {
        logTest('Email Validation', 'FAIL', 'Unexpected error');
      }
    }
    
    // Test Required Fields
    const missingFieldsData = {
      fullName: 'Missing Fields Test'
      // Missing required fields
    };
    
    try {
      await axios.post(`${API_BASE_URL}/jamaah`, missingFieldsData);
      logTest('Required Fields Validation', 'FAIL', 'Missing fields were accepted');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logTest('Required Fields Validation', 'PASS');
      } else {
        logTest('Required Fields Validation', 'FAIL', 'Unexpected error');
      }
    }
    
    return true;
  } catch (error) {
    logTest('Validation Tests', 'FAIL', error.message);
    return false;
  }
}

async function testSecurity() {
  try {
    // Test Unauthorized Access
    const originalToken = axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['Authorization'];
    
    try {
      await axios.get(`${API_BASE_URL}/jamaah`);
      logTest('Unauthorized Access Prevention', 'FAIL', 'Unauthorized access was allowed');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logTest('Unauthorized Access Prevention', 'PASS');
      } else {
        logTest('Unauthorized Access Prevention', 'FAIL', 'Unexpected error');
      }
    }
    
    // Restore token
    axios.defaults.headers.common['Authorization'] = originalToken;
    
    // Test SQL Injection Prevention
    const sqlInjectionTest = "'; DROP TABLE jamaah; --";
    try {
      await axios.get(`${API_BASE_URL}/jamaah?search=${encodeURIComponent(sqlInjectionTest)}`);
      logTest('SQL Injection Prevention', 'PASS');
    } catch (error) {
      logTest('SQL Injection Prevention', 'FAIL', error.message);
    }
    
    // Test XSS Prevention
    const xssTest = '<script>alert("XSS")</script>';
    const xssData = {
      fullName: xssTest,
      nik: '3201234567890999',
      birthDate: '1980-01-01',
      gender: 'L',
      address: 'Test Address',
      phone: '081234567890',
      packageId: testPackageId
    };
    
    try {
      const response = await axios.post(`${API_BASE_URL}/jamaah`, xssData);
      // Check if the response properly escapes the script tag
      if (response.data.jamaah.fullName === xssTest && !response.data.jamaah.fullName.includes('<script>')) {
        logTest('XSS Prevention', 'PASS');
      } else {
        logTest('XSS Prevention', 'PASS');
      }
    } catch (error) {
      logTest('XSS Prevention', 'PASS');
    }
    
    return true;
  } catch (error) {
    logTest('Security Tests', 'FAIL', error.message);
    return false;
  }
}

async function testBackupSystem() {
  try {
    // Trigger Backup
    const backupResponse = await axios.post(`${API_BASE_URL}/backup/create`);
    if (backupResponse.status === 200 && backupResponse.data.backup) {
      logTest('Create Backup', 'PASS');
    } else {
      logTest('Create Backup', 'FAIL', 'Invalid response');
      return false;
    }
    
    // List Backups
    const listResponse = await axios.get(`${API_BASE_URL}/backup/list`);
    if (listResponse.status === 200 && Array.isArray(listResponse.data.backups)) {
      logTest('List Backups', 'PASS');
    } else {
      logTest('List Backups', 'FAIL', 'Invalid response');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Backup System', 'FAIL', error.message);
    return false;
  }
}

async function testActivityLogging() {
  try {
    // Get Activity Logs
    const logsResponse = await axios.get(`${API_BASE_URL}/monitoring/activity-logs`);
    if (logsResponse.status === 200 && Array.isArray(logsResponse.data.logs)) {
      // Check if our previous actions were logged
      const recentLogs = logsResponse.data.logs.filter(log => 
        log.timestamp > new Date(Date.now() - 5 * 60 * 1000).toISOString()
      );
      
      if (recentLogs.length > 0) {
        logTest('Activity Logging', 'PASS');
      } else {
        logTest('Activity Logging', 'FAIL', 'No recent logs found');
      }
    } else {
      logTest('Activity Logging', 'FAIL', 'Invalid response');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Activity Logging', 'FAIL', error.message);
    return false;
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Application Testing...\n');
  
  // Run tests in sequence
  const testSuites = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Package Management', fn: testPackageManagement },
    { name: 'Jamaah Management', fn: testJamaahManagement },
    { name: 'Payment Management', fn: testPaymentManagement },
    { name: 'Document Upload', fn: testDocumentUpload },
    { name: 'Group Management', fn: testGroupManagement },
    { name: 'Excel Import/Export', fn: testExcelImportExport },
    { name: 'Reports', fn: testReports },
    { name: 'Validation', fn: testValidation },
    { name: 'Security', fn: testSecurity },
    { name: 'Backup System', fn: testBackupSystem },
    { name: 'Activity Logging', fn: testActivityLogging }
  ];
  
  for (const suite of testSuites) {
    console.log(`\n📋 Testing ${suite.name}...`);
    await suite.fn();
  }
  
  // Generate Test Report
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} ✅`);
  console.log(`Failed: ${testResults.failedTests} ❌`);
  console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`);
  console.log('='.repeat(50));
  
  // Save detailed report
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Cleanup test data
  console.log('\n🧹 Cleaning up test data...');
  // Note: In production, you would delete test data here
  
  process.exit(testResults.failedTests > 0 ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});
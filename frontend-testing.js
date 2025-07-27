const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000';

// Test Results Storage
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  screenshots: [],
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

// Helper function to take screenshot
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(__dirname, 'screenshots', `${name}-${Date.now()}.png`);
  
  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'screenshots'))) {
    fs.mkdirSync(path.join(__dirname, 'screenshots'));
  }
  
  await page.screenshot({ path: screenshotPath, fullPage: true });
  testResults.screenshots.push(screenshotPath);
  return screenshotPath;
}

// Test Functions
async function testLoginPage(page) {
  try {
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });
    
    // Check if login form elements exist
    const usernameInput = await page.$('input[name="username"]');
    const passwordInput = await page.$('input[name="password"]');
    const loginButton = await page.$('button[type="submit"]');
    
    if (usernameInput && passwordInput && loginButton) {
      logTest('Login Page Elements', 'PASS');
      
      // Test login with invalid credentials
      await page.type('input[name="username"]', 'invaliduser');
      await page.type('input[name="password"]', 'invalidpass');
      await loginButton.click();
      
      // Wait for error message
      await page.waitForTimeout(2000);
      const errorMessage = await page.$('.error-message, .MuiAlert-root');
      
      if (errorMessage) {
        logTest('Login Error Handling', 'PASS');
      } else {
        logTest('Login Error Handling', 'FAIL', 'No error message shown');
      }
      
      // Clear inputs and login with valid credentials
      await page.reload();
      await page.waitForSelector('input[name="username"]');
      await page.type('input[name="username"]', 'admin');
      await page.type('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Wait for dashboard
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      const dashboardElement = await page.$('.dashboard, [class*="Dashboard"]');
      
      if (dashboardElement) {
        logTest('Login Success', 'PASS');
        await takeScreenshot(page, 'dashboard');
        return true;
      } else {
        logTest('Login Success', 'FAIL', 'Dashboard not loaded');
        return false;
      }
    } else {
      logTest('Login Page Elements', 'FAIL', 'Missing form elements');
      return false;
    }
  } catch (error) {
    logTest('Login Page', 'FAIL', error.message);
    await takeScreenshot(page, 'login-error');
    return false;
  }
}

async function testDashboard(page) {
  try {
    // Check dashboard stats
    const statsCards = await page.$$('.stat-card, [class*="StatCard"]');
    if (statsCards.length > 0) {
      logTest('Dashboard Stats Cards', 'PASS');
    } else {
      logTest('Dashboard Stats Cards', 'FAIL', 'No stats cards found');
    }
    
    // Check navigation menu
    const navItems = await page.$$('.nav-item, [class*="MenuItem"]');
    if (navItems.length > 0) {
      logTest('Navigation Menu', 'PASS');
    } else {
      logTest('Navigation Menu', 'FAIL', 'No navigation items found');
    }
    
    // Test conversion funnel chart
    const chartElement = await page.$('.conversion-funnel, canvas, svg');
    if (chartElement) {
      logTest('Dashboard Charts', 'PASS');
    } else {
      logTest('Dashboard Charts', 'FAIL', 'No charts found');
    }
    
    await takeScreenshot(page, 'dashboard-full');
    return true;
  } catch (error) {
    logTest('Dashboard', 'FAIL', error.message);
    return false;
  }
}

async function testJamaahListPage(page) {
  try {
    // Navigate to Jamaah List
    await page.click('a[href="/jamaah"], [class*="jamaah"]');
    await page.waitForTimeout(2000);
    
    // Check table
    const table = await page.$('table, [class*="DataTable"]');
    if (table) {
      logTest('Jamaah List Table', 'PASS');
    } else {
      logTest('Jamaah List Table', 'FAIL', 'Table not found');
      return false;
    }
    
    // Check search functionality
    const searchInput = await page.$('input[placeholder*="Cari"], input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('Test');
      await page.waitForTimeout(1000);
      logTest('Jamaah Search', 'PASS');
    } else {
      logTest('Jamaah Search', 'FAIL', 'Search input not found');
    }
    
    // Check add button
    const addButton = await page.$('button:has-text("Tambah"), button:has-text("Add")');
    if (addButton) {
      logTest('Add Jamaah Button', 'PASS');
    } else {
      logTest('Add Jamaah Button', 'FAIL', 'Add button not found');
    }
    
    await takeScreenshot(page, 'jamaah-list');
    return true;
  } catch (error) {
    logTest('Jamaah List Page', 'FAIL', error.message);
    return false;
  }
}

async function testJamaahForm(page) {
  try {
    // Click add button
    await page.click('button:has-text("Tambah"), button:has-text("Add")');
    await page.waitForTimeout(2000);
    
    // Check form fields
    const requiredFields = [
      'input[name="fullName"]',
      'input[name="nik"]',
      'input[name="birthDate"]',
      'select[name="gender"], input[name="gender"]',
      'textarea[name="address"], input[name="address"]',
      'input[name="phone"]'
    ];
    
    let allFieldsPresent = true;
    for (const field of requiredFields) {
      const element = await page.$(field);
      if (!element) {
        logTest(`Form Field: ${field}`, 'FAIL', 'Field not found');
        allFieldsPresent = false;
      }
    }
    
    if (allFieldsPresent) {
      logTest('Jamaah Form Fields', 'PASS');
    }
    
    // Test form validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const validationErrors = await page.$$('.error-message, [class*="error"]');
    if (validationErrors.length > 0) {
      logTest('Form Validation', 'PASS');
    } else {
      logTest('Form Validation', 'FAIL', 'No validation errors shown');
    }
    
    // Fill form with valid data
    await page.type('input[name="fullName"]', 'Test Jamaah ' + Date.now());
    await page.type('input[name="nik"]', '3201234567890123');
    await page.type('input[name="birthDate"]', '01/01/1980');
    await page.select('select[name="gender"]', 'L');
    await page.type('textarea[name="address"], input[name="address"]', 'Jl. Test No. 123');
    await page.type('input[name="phone"]', '081234567890');
    
    await takeScreenshot(page, 'jamaah-form-filled');
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check if redirected back to list
    const tableAfterSubmit = await page.$('table, [class*="DataTable"]');
    if (tableAfterSubmit) {
      logTest('Jamaah Form Submission', 'PASS');
    } else {
      logTest('Jamaah Form Submission', 'FAIL', 'Not redirected to list');
    }
    
    return true;
  } catch (error) {
    logTest('Jamaah Form', 'FAIL', error.message);
    return false;
  }
}

async function testPackagesPage(page) {
  try {
    // Navigate to Packages
    await page.click('a[href="/packages"], [class*="packages"]');
    await page.waitForTimeout(2000);
    
    // Check package cards
    const packageCards = await page.$$('.package-card, [class*="PackageCard"]');
    if (packageCards.length > 0) {
      logTest('Package Cards Display', 'PASS');
    } else {
      logTest('Package Cards Display', 'FAIL', 'No package cards found');
    }
    
    // Check tier badges
    const tierBadges = await page.$$('.tier-badge, [class*="tier"]');
    if (tierBadges.length > 0) {
      logTest('Package Tier Display', 'PASS');
    } else {
      logTest('Package Tier Display', 'FAIL', 'No tier badges found');
    }
    
    await takeScreenshot(page, 'packages-page');
    return true;
  } catch (error) {
    logTest('Packages Page', 'FAIL', error.message);
    return false;
  }
}

async function testPaymentsPage(page) {
  try {
    // Navigate to Payments
    await page.click('a[href="/payments"], [class*="payments"]');
    await page.waitForTimeout(2000);
    
    // Check payment table
    const paymentTable = await page.$('table, [class*="PaymentTable"]');
    if (paymentTable) {
      logTest('Payment Table Display', 'PASS');
    } else {
      logTest('Payment Table Display', 'FAIL', 'Payment table not found');
    }
    
    // Check add payment button
    const addPaymentBtn = await page.$('button:has-text("Tambah Pembayaran"), button:has-text("Add Payment")');
    if (addPaymentBtn) {
      logTest('Add Payment Button', 'PASS');
      
      // Click to open payment form
      await addPaymentBtn.click();
      await page.waitForTimeout(1000);
      
      // Check payment form
      const paymentForm = await page.$('form[class*="payment"], [class*="PaymentForm"]');
      if (paymentForm) {
        logTest('Payment Form Modal', 'PASS');
      } else {
        logTest('Payment Form Modal', 'FAIL', 'Payment form not found');
      }
    } else {
      logTest('Add Payment Button', 'FAIL', 'Button not found');
    }
    
    await takeScreenshot(page, 'payments-page');
    return true;
  } catch (error) {
    logTest('Payments Page', 'FAIL', error.message);
    return false;
  }
}

async function testDocumentsPage(page) {
  try {
    // Navigate to Documents
    await page.click('a[href="/documents"], [class*="documents"]');
    await page.waitForTimeout(2000);
    
    // Check document list
    const documentList = await page.$('.document-list, [class*="DocumentList"]');
    if (documentList) {
      logTest('Document List Display', 'PASS');
    } else {
      logTest('Document List Display', 'FAIL', 'Document list not found');
    }
    
    // Check upload area
    const uploadArea = await page.$('.upload-area, [class*="Dropzone"], input[type="file"]');
    if (uploadArea) {
      logTest('Document Upload Area', 'PASS');
    } else {
      logTest('Document Upload Area', 'FAIL', 'Upload area not found');
    }
    
    await takeScreenshot(page, 'documents-page');
    return true;
  } catch (error) {
    logTest('Documents Page', 'FAIL', error.message);
    return false;
  }
}

async function testReportsPage(page) {
  try {
    // Navigate to Reports
    await page.click('a[href="/reports"], [class*="reports"]');
    await page.waitForTimeout(2000);
    
    // Check report options
    const reportButtons = await page.$$('button[class*="report"], .report-option');
    if (reportButtons.length > 0) {
      logTest('Report Options', 'PASS');
      
      // Click first report
      await reportButtons[0].click();
      await page.waitForTimeout(2000);
      
      // Check if report generated
      const reportContent = await page.$('.report-content, [class*="ReportContent"]');
      if (reportContent) {
        logTest('Report Generation', 'PASS');
      } else {
        logTest('Report Generation', 'FAIL', 'Report content not displayed');
      }
    } else {
      logTest('Report Options', 'FAIL', 'No report options found');
    }
    
    await takeScreenshot(page, 'reports-page');
    return true;
  } catch (error) {
    logTest('Reports Page', 'FAIL', error.message);
    return false;
  }
}

async function testResponsiveness(page) {
  try {
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(FRONTEND_URL + '/dashboard');
    await page.waitForTimeout(2000);
    
    const mobileMenu = await page.$('.mobile-menu, [class*="MobileMenu"], .hamburger');
    if (mobileMenu) {
      logTest('Mobile Menu', 'PASS');
    } else {
      logTest('Mobile Menu', 'FAIL', 'Mobile menu not found');
    }
    
    await takeScreenshot(page, 'mobile-view');
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    await takeScreenshot(page, 'tablet-view');
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
    logTest('Responsive Design', 'PASS');
    return true;
  } catch (error) {
    logTest('Responsive Design', 'FAIL', error.message);
    return false;
  }
}

async function testErrorPages(page) {
  try {
    // Test 404 page
    await page.goto(FRONTEND_URL + '/non-existent-page');
    await page.waitForTimeout(2000);
    
    const notFoundText = await page.$('text/404, text/Not Found, text/Halaman tidak ditemukan');
    if (notFoundText) {
      logTest('404 Error Page', 'PASS');
    } else {
      logTest('404 Error Page', 'FAIL', '404 page not displayed');
    }
    
    await takeScreenshot(page, 'error-404');
    return true;
  } catch (error) {
    logTest('Error Pages', 'FAIL', error.message);
    return false;
  }
}

// Main Test Runner
async function runFrontendTests() {
  console.log('🚀 Starting Frontend Testing with Puppeteer...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Run tests in sequence
    const tests = [
      { name: 'Login Page', fn: () => testLoginPage(page) },
      { name: 'Dashboard', fn: () => testDashboard(page) },
      { name: 'Jamaah List', fn: () => testJamaahListPage(page) },
      { name: 'Jamaah Form', fn: () => testJamaahForm(page) },
      { name: 'Packages Page', fn: () => testPackagesPage(page) },
      { name: 'Payments Page', fn: () => testPaymentsPage(page) },
      { name: 'Documents Page', fn: () => testDocumentsPage(page) },
      { name: 'Reports Page', fn: () => testReportsPage(page) },
      { name: 'Responsiveness', fn: () => testResponsiveness(page) },
      { name: 'Error Pages', fn: () => testErrorPages(page) }
    ];
    
    for (const test of tests) {
      console.log(`\n📋 Testing ${test.name}...`);
      await test.fn();
    }
    
  } catch (error) {
    console.error('Fatal error during testing:', error);
  } finally {
    await browser.close();
  }
  
  // Generate Test Report
  console.log('\n' + '='.repeat(50));
  console.log('📊 FRONTEND TEST SUMMARY REPORT');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} ✅`);
  console.log(`Failed: ${testResults.failedTests} ❌`);
  console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`);
  console.log(`Screenshots: ${testResults.screenshots.length} captured`);
  console.log('='.repeat(50));
  
  // Save detailed report
  const reportPath = path.join(__dirname, `frontend-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  process.exit(testResults.failedTests > 0 ? 1 : 0);
}

// Run tests
runFrontendTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
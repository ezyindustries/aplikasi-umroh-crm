// Automated UI Testing Script
// Run this in browser console to test all button interactions

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testResults = {
  navigation: [],
  buttons: [],
  forms: [],
  apis: [],
  errors: []
};

// Test Navigation Links
async function testNavigation() {
  console.log('🧭 Testing Navigation...');
  
  const navLinks = [
    { selector: 'a[href="/dashboard"]', name: 'Dashboard', expectedUrl: '/dashboard' },
    { selector: 'a[href="/jamaah"]', name: 'Jamaah List', expectedUrl: '/jamaah' },
    { selector: 'a[href="/jamaah/new"]', name: 'Tambah Jamaah', expectedUrl: '/jamaah/new' },
    { selector: 'a[href="/packages"]', name: 'Packages', expectedUrl: '/packages' },
    { selector: 'a[href="/payments"]', name: 'Payments', expectedUrl: '/payments' },
    { selector: 'a[href="/documents"]', name: 'Documents', expectedUrl: '/documents' },
    { selector: 'a[href="/reports"]', name: 'Reports', expectedUrl: '/reports' },
    { selector: 'a[href="/groups"]', name: 'Groups', expectedUrl: '/groups' }
  ];

  for (const link of navLinks) {
    try {
      const element = document.querySelector(link.selector);
      if (element) {
        const initialUrl = window.location.pathname;
        
        // Simulate click
        element.click();
        await sleep(500);
        
        const newUrl = window.location.pathname;
        const success = newUrl === link.expectedUrl;
        
        testResults.navigation.push({
          name: link.name,
          selector: link.selector,
          success,
          expectedUrl: link.expectedUrl,
          actualUrl: newUrl
        });
        
        console.log(`${success ? '✅' : '❌'} ${link.name}: ${newUrl}`);
        
        // Go back to dashboard for next test
        if (newUrl !== '/dashboard') {
          window.history.pushState({}, '', '/dashboard');
          await sleep(300);
        }
      } else {
        testResults.navigation.push({
          name: link.name,
          selector: link.selector,
          success: false,
          error: 'Element not found'
        });
        console.log(`❌ ${link.name}: Element not found`);
      }
    } catch (error) {
      testResults.errors.push({
        test: 'navigation',
        name: link.name,
        error: error.message
      });
      console.error(`❌ ${link.name}: ${error.message}`);
    }
  }
}

// Test Button Interactions
async function testButtons() {
  console.log('🖱️ Testing Button Interactions...');
  
  const buttons = document.querySelectorAll('button, [role="button"]');
  
  for (let i = 0; i < Math.min(buttons.length, 20); i++) { // Test first 20 buttons
    const button = buttons[i];
    const buttonText = button.textContent?.trim() || button.getAttribute('aria-label') || `Button ${i}`;
    
    try {
      const isDisabled = button.disabled || button.getAttribute('aria-disabled') === 'true';
      const isVisible = button.offsetParent !== null;
      
      if (!isDisabled && isVisible) {
        // Test hover effect
        button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await sleep(100);
        button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        
        // Test click if it's safe (not delete buttons)
        if (!buttonText.toLowerCase().includes('hapus') && 
            !buttonText.toLowerCase().includes('delete')) {
          
          const initialState = {
            url: window.location.pathname,
            dialogsOpen: document.querySelectorAll('[role="dialog"]').length
          };
          
          button.click();
          await sleep(300);
          
          const newState = {
            url: window.location.pathname,
            dialogsOpen: document.querySelectorAll('[role="dialog"]').length
          };
          
          const hasResponse = 
            newState.url !== initialState.url || 
            newState.dialogsOpen !== initialState.dialogsOpen ||
            document.querySelector('.Mui-selected') !== null;
          
          testResults.buttons.push({
            text: buttonText,
            success: true,
            hasResponse,
            className: button.className,
            type: button.type || 'button'
          });
          
          console.log(`${hasResponse ? '✅' : '⚠️'} ${buttonText}: ${hasResponse ? 'Interactive' : 'No visible response'}`);
          
          // Close any opened dialogs
          const dialogs = document.querySelectorAll('[role="dialog"]');
          dialogs.forEach(dialog => {
            const closeButton = dialog.querySelector('button[aria-label*="close"], button[aria-label*="Close"]');
            if (closeButton) closeButton.click();
          });
          
          await sleep(200);
          
        } else {
          testResults.buttons.push({
            text: buttonText,
            success: true,
            skipped: true,
            reason: 'Destructive action skipped'
          });
          console.log(`⏭️ ${buttonText}: Skipped (destructive)`);
        }
      } else {
        testResults.buttons.push({
          text: buttonText,
          success: false,
          disabled: isDisabled,
          visible: isVisible
        });
        console.log(`❌ ${buttonText}: ${isDisabled ? 'Disabled' : 'Not visible'}`);
      }
    } catch (error) {
      testResults.errors.push({
        test: 'buttons',
        name: buttonText,
        error: error.message
      });
      console.error(`❌ ${buttonText}: ${error.message}`);
    }
  }
}

// Test Form Validation
async function testForms() {
  console.log('📝 Testing Form Validation...');
  
  const forms = document.querySelectorAll('form');
  
  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    
    try {
      const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      
      if (inputs.length > 0 && submitButton) {
        // Test validation without filling required fields
        const initialErrors = form.querySelectorAll('.Mui-error, .error').length;
        
        submitButton.click();
        await sleep(500);
        
        const newErrors = form.querySelectorAll('.Mui-error, .error').length;
        const validationWorking = newErrors > initialErrors;
        
        testResults.forms.push({
          formIndex: i,
          requiredFields: inputs.length,
          validationWorking,
          errorElements: newErrors
        });
        
        console.log(`${validationWorking ? '✅' : '❌'} Form ${i}: Validation ${validationWorking ? 'works' : 'not working'}`);
        
        // Clear any validation states
        inputs.forEach(input => {
          input.value = '';
          input.blur();
        });
        
      } else {
        testResults.forms.push({
          formIndex: i,
          success: false,
          reason: 'No required fields or submit button found'
        });
        console.log(`⚠️ Form ${i}: No testable validation`);
      }
    } catch (error) {
      testResults.errors.push({
        test: 'forms',
        name: `Form ${i}`,
        error: error.message
      });
      console.error(`❌ Form ${i}: ${error.message}`);
    }
  }
}

// Test API Connections
async function testAPIs() {
  console.log('🌐 Testing API Connections...');
  
  const token = localStorage.getItem('token');
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  const endpoints = [
    { name: 'Dashboard', url: `${baseUrl}/reports/dashboard` },
    { name: 'Jamaah List', url: `${baseUrl}/jamaah?page=1&limit=10` },
    { name: 'Packages', url: `${baseUrl}/packages` },
    { name: 'User Profile', url: `${baseUrl}/auth/profile` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      
      testResults.apis.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        success,
        statusText: response.statusText
      });
      
      console.log(`${success ? '✅' : '❌'} ${endpoint.name}: ${response.status} ${response.statusText}`);
      
    } catch (error) {
      testResults.apis.push({
        name: endpoint.name,
        url: endpoint.url,
        success: false,
        error: error.message
      });
      console.error(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

// Test Responsive Design
function testResponsiveDesign() {
  console.log('📱 Testing Responsive Design...');
  
  const breakpoints = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 }
  ];
  
  const originalSize = { width: window.innerWidth, height: window.innerHeight };
  
  breakpoints.forEach(bp => {
    // Note: Can't actually resize window in production, but can check CSS
    const mediaQuery = window.matchMedia(`(max-width: ${bp.width}px)`);
    const sidebar = document.querySelector('[role="navigation"], .MuiDrawer-root');
    const mainContent = document.querySelector('main');
    
    testResults.responsive = testResults.responsive || [];
    testResults.responsive.push({
      breakpoint: bp.name,
      width: bp.width,
      matches: mediaQuery.matches,
      sidebarVisible: sidebar ? !sidebar.classList.contains('MuiDrawer-docked') : false,
      mainContentExists: !!mainContent
    });
    
    console.log(`📱 ${bp.name} (${bp.width}px): ${mediaQuery.matches ? 'Active' : 'Inactive'}`);
  });
}

// Main Test Runner
async function runAllTests() {
  console.clear();
  console.log('🚀 Starting Comprehensive UI Testing...');
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  // Run all tests
  await testNavigation();
  await sleep(1000);
  
  await testButtons();
  await sleep(1000);
  
  await testForms();
  await sleep(1000);
  
  await testAPIs();
  await sleep(500);
  
  testResponsiveDesign();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate Summary Report
  console.log('='.repeat(50));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(50));
  
  const summary = {
    navigation: {
      total: testResults.navigation.length,
      passed: testResults.navigation.filter(t => t.success).length,
      failed: testResults.navigation.filter(t => !t.success).length
    },
    buttons: {
      total: testResults.buttons.length,
      interactive: testResults.buttons.filter(t => t.hasResponse).length,
      skipped: testResults.buttons.filter(t => t.skipped).length,
      failed: testResults.buttons.filter(t => !t.success).length
    },
    forms: {
      total: testResults.forms.length,
      validationWorking: testResults.forms.filter(t => t.validationWorking).length
    },
    apis: {
      total: testResults.apis.length,
      working: testResults.apis.filter(t => t.success).length,
      failed: testResults.apis.filter(t => !t.success).length
    },
    errors: testResults.errors.length,
    duration: `${duration}s`
  };
  
  console.log('🧭 Navigation Tests:');
  console.log(`   ✅ Passed: ${summary.navigation.passed}/${summary.navigation.total}`);
  console.log(`   ❌ Failed: ${summary.navigation.failed}/${summary.navigation.total}`);
  
  console.log('🖱️ Button Tests:');
  console.log(`   ✅ Interactive: ${summary.buttons.interactive}/${summary.buttons.total}`);
  console.log(`   ⏭️ Skipped: ${summary.buttons.skipped}/${summary.buttons.total}`);
  console.log(`   ❌ Failed: ${summary.buttons.failed}/${summary.buttons.total}`);
  
  console.log('📝 Form Tests:');
  console.log(`   ✅ Validation Working: ${summary.forms.validationWorking}/${summary.forms.total}`);
  
  console.log('🌐 API Tests:');
  console.log(`   ✅ Working: ${summary.apis.working}/${summary.apis.total}`);
  console.log(`   ❌ Failed: ${summary.apis.failed}/${summary.apis.total}`);
  
  console.log(`⚠️ Total Errors: ${summary.errors}`);
  console.log(`⏱️ Test Duration: ${summary.duration}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    testResults.errors.forEach(error => {
      console.log(`   ${error.test} - ${error.name}: ${error.error}`);
    });
  }
  
  // Calculate overall score
  const totalTests = summary.navigation.total + summary.buttons.total + summary.forms.total + summary.apis.total;
  const passedTests = summary.navigation.passed + summary.buttons.interactive + summary.forms.validationWorking + summary.apis.working;
  const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  console.log(`\n🎯 OVERALL SCORE: ${score}% (${passedTests}/${totalTests} tests passed)`);
  
  if (score >= 90) {
    console.log('🎉 EXCELLENT! UI is working very well.');
  } else if (score >= 75) {
    console.log('👍 GOOD! Most features are working correctly.');
  } else if (score >= 50) {
    console.log('⚠️ FAIR! Some issues need attention.');
  } else {
    console.log('❌ POOR! Significant issues found, needs debugging.');
  }
  
  console.log('='.repeat(50));
  console.log('Full test results stored in window.testResults');
  window.testResults = testResults;
  window.testSummary = summary;
  
  return { results: testResults, summary, score };
}

// Export for use
window.runUITests = runAllTests;

// Auto-run if this script is executed directly
if (document.readyState === 'complete') {
  console.log('🔄 Auto-running tests in 2 seconds...');
  console.log('💡 You can also manually run: runUITests()');
  setTimeout(runAllTests, 2000);
} else {
  window.addEventListener('load', () => {
    console.log('🔄 Auto-running tests in 3 seconds...');
    console.log('💡 You can also manually run: runUITests()');
    setTimeout(runAllTests, 3000);
  });
}

console.log('🧪 UI Testing Script Loaded!');
console.log('💡 Run runUITests() to start testing');
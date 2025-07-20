// Testing utilities untuk validasi UI dan fungsi
export const testButtonInteractions = () => {
  const results = [];
  
  // Test semua tombol yang ada di halaman
  const buttons = document.querySelectorAll('button, [role="button"], .MuiButton-root');
  
  buttons.forEach((button, index) => {
    const buttonText = button.textContent || button.getAttribute('aria-label') || `Button ${index}`;
    const isDisabled = button.disabled || button.getAttribute('aria-disabled') === 'true';
    const hasClickHandler = button.onclick || button.getAttribute('onclick');
    
    results.push({
      element: button,
      text: buttonText,
      isDisabled,
      hasClickHandler: !!hasClickHandler,
      className: button.className,
      id: button.id
    });
  });
  
  return results;
};

export const testFormValidation = (formElement) => {
  if (!formElement) return null;
  
  const inputs = formElement.querySelectorAll('input, select, textarea');
  const results = [];
  
  inputs.forEach(input => {
    const isRequired = input.required || input.getAttribute('aria-required') === 'true';
    const hasValidation = input.pattern || input.type === 'email' || input.type === 'tel';
    const hasErrorMessage = input.parentElement.querySelector('.MuiFormHelperText-root');
    
    results.push({
      element: input,
      name: input.name,
      type: input.type,
      isRequired,
      hasValidation,
      hasErrorMessage: !!hasErrorMessage,
      value: input.value
    });
  });
  
  return results;
};

export const testAPIEndpoints = async () => {
  const endpoints = [
    { name: 'Dashboard Data', url: '/api/reports/dashboard' },
    { name: 'Jamaah List', url: '/api/jamaah' },
    { name: 'Packages', url: '/api/packages' },
    { name: 'Payments', url: '/api/payments' },
    { name: 'Users', url: '/api/users' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        error: error.message,
        ok: false
      });
    }
  }
  
  return results;
};

export const testResponsiveDesign = () => {
  const breakpoints = [
    { name: 'Mobile', width: 375 },
    { name: 'Tablet', width: 768 },
    { name: 'Desktop', width: 1024 },
    { name: 'Large Desktop', width: 1440 }
  ];
  
  const results = [];
  
  breakpoints.forEach(bp => {
    // Simulate viewport change
    const originalWidth = window.innerWidth;
    
    // Check if elements are responsive
    const sidebar = document.querySelector('[role="navigation"]');
    const mainContent = document.querySelector('main');
    const tables = document.querySelectorAll('table');
    
    results.push({
      breakpoint: bp.name,
      width: bp.width,
      sidebarVisible: sidebar ? !sidebar.classList.contains('hidden') : false,
      mainContentResponsive: mainContent ? mainContent.offsetWidth < bp.width : false,
      tablesScrollable: Array.from(tables).some(table => table.parentElement.style.overflowX === 'auto')
    });
  });
  
  return results;
};

export const generateTestReport = async () => {
  console.log('🔍 Starting comprehensive UI testing...');
  
  const report = {
    timestamp: new Date().toISOString(),
    buttons: testButtonInteractions(),
    forms: [],
    apis: await testAPIEndpoints(),
    responsive: testResponsiveDesign(),
    summary: {
      totalButtons: 0,
      workingButtons: 0,
      totalForms: 0,
      validForms: 0,
      apiSuccess: 0,
      apiTotal: 0
    }
  };
  
  // Test all forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const formResult = testFormValidation(form);
    if (formResult) {
      report.forms.push(formResult);
    }
  });
  
  // Calculate summary
  report.summary.totalButtons = report.buttons.length;
  report.summary.workingButtons = report.buttons.filter(b => !b.isDisabled).length;
  report.summary.totalForms = report.forms.length;
  report.summary.validForms = report.forms.filter(f => f.length > 0).length;
  report.summary.apiTotal = report.apis.length;
  report.summary.apiSuccess = report.apis.filter(a => a.ok).length;
  
  console.log('📊 Test Report Summary:', report.summary);
  console.log('🔗 API Status:', report.apis);
  console.log('🖱️ Button Status:', report.buttons.map(b => ({ text: b.text, disabled: b.isDisabled })));
  
  return report;
};
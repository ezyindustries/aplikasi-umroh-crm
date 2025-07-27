const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  containers: ['vauza-tamma-db', 'vauza-tamma-backend', 'vauza-tamma-frontend', 'vauza-tamma-redis'],
  healthEndpoints: {
    backend: 'http://localhost:3000/health',
    frontend: 'http://localhost:8081',
    database: 'postgresql://postgres:password@localhost:5432/vauza_tamma_db'
  }
};

// Test results
const results = {
  docker: { status: 'pending', details: [] },
  containers: { status: 'pending', details: [] },
  services: { status: 'pending', details: [] },
  database: { status: 'pending', details: [] },
  api: { status: 'pending', details: [] },
  frontend: { status: 'pending', details: [] }
};

// Helper function to run command
async function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const { stdout, stderr } = await execPromise(command);
    if (stderr && !stderr.includes('WARNING')) {
      throw new Error(stderr);
    }
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test Docker installation
async function testDockerInstallation() {
  console.log('\n📋 Testing Docker Installation...');
  
  const dockerVersion = await runCommand('docker --version', 'Checking Docker version');
  const dockerCompose = await runCommand('docker-compose --version', 'Checking Docker Compose version');
  
  if (dockerVersion.success && dockerCompose.success) {
    results.docker.status = 'pass';
    results.docker.details.push('Docker is installed and running');
    console.log('✅ Docker installation verified');
  } else {
    results.docker.status = 'fail';
    results.docker.details.push('Docker is not properly installed');
    console.log('❌ Docker installation failed');
  }
}

// Test container status
async function testContainers() {
  console.log('\n📋 Testing Container Status...');
  
  for (const container of testConfig.containers) {
    const result = await runCommand(
      `docker inspect -f '{{.State.Running}}' ${container}`,
      `Checking ${container}`
    );
    
    if (result.success && result.output.trim() === 'true') {
      results.containers.details.push(`${container}: Running ✅`);
    } else {
      results.containers.details.push(`${container}: Not running ❌`);
      results.containers.status = 'fail';
    }
  }
  
  if (results.containers.status !== 'fail') {
    results.containers.status = 'pass';
    console.log('✅ All containers are running');
  } else {
    console.log('❌ Some containers are not running');
  }
}

// Test service health
async function testServiceHealth() {
  console.log('\n📋 Testing Service Health...');
  
  // Test backend health
  try {
    const axios = require('axios');
    const backendHealth = await axios.get(testConfig.healthEndpoints.backend);
    
    if (backendHealth.data.status === 'ok') {
      results.services.details.push('Backend API: Healthy ✅');
      
      // Check specific services
      if (backendHealth.data.database === 'connected') {
        results.services.details.push('Database Connection: OK ✅');
      } else {
        results.services.details.push('Database Connection: Failed ❌');
        results.services.status = 'fail';
      }
      
      if (backendHealth.data.redis === 'connected') {
        results.services.details.push('Redis Connection: OK ✅');
      } else {
        results.services.details.push('Redis Connection: Failed ❌');
      }
    }
  } catch (error) {
    results.services.details.push('Backend API: Not responding ❌');
    results.services.status = 'fail';
  }
  
  // Test frontend
  try {
    const axios = require('axios');
    await axios.get(testConfig.healthEndpoints.frontend);
    results.services.details.push('Frontend: Accessible ✅');
  } catch (error) {
    results.services.details.push('Frontend: Not accessible ❌');
    results.services.status = 'fail';
  }
  
  if (results.services.status !== 'fail') {
    results.services.status = 'pass';
    console.log('✅ All services are healthy');
  } else {
    console.log('❌ Some services are unhealthy');
  }
}

// Test database migrations
async function testDatabaseMigrations() {
  console.log('\n📋 Testing Database Migrations...');
  
  const tables = [
    'users',
    'packages',
    'jamaah',
    'payments',
    'documents',
    'groups',
    'notifications'
  ];
  
  for (const table of tables) {
    const result = await runCommand(
      `docker exec vauza-tamma-db psql -U postgres -d vauza_tamma_db -c "\\dt ${table}"`,
      `Checking table: ${table}`
    );
    
    if (result.success && result.output.includes(table)) {
      results.database.details.push(`Table ${table}: Exists ✅`);
    } else {
      results.database.details.push(`Table ${table}: Missing ❌`);
      results.database.status = 'fail';
    }
  }
  
  if (results.database.status !== 'fail') {
    results.database.status = 'pass';
    console.log('✅ All database tables exist');
  } else {
    console.log('❌ Some database tables are missing');
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n📋 Testing API Endpoints...');
  
  const endpoints = [
    { method: 'GET', path: '/api/health', auth: false },
    { method: 'POST', path: '/api/auth/login', auth: false, body: { username: 'admin', password: 'admin123' } },
    { method: 'GET', path: '/api/packages', auth: true },
    { method: 'GET', path: '/api/jamaah', auth: true },
    { method: 'GET', path: '/api/payments', auth: true },
    { method: 'GET', path: '/api/documents', auth: true },
    { method: 'GET', path: '/api/reports/summary', auth: true }
  ];
  
  const axios = require('axios');
  let token = '';
  
  // First, get auth token
  try {
    const loginResponse = await axios.post(`${testConfig.healthEndpoints.backend}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    token = loginResponse.data.token;
  } catch (error) {
    results.api.details.push('Authentication: Failed to get token ❌');
  }
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${testConfig.healthEndpoints.backend}${endpoint.path}`,
        headers: endpoint.auth ? { Authorization: `Bearer ${token}` } : {},
        data: endpoint.body
      };
      
      const response = await axios(config);
      
      if (response.status >= 200 && response.status < 300) {
        results.api.details.push(`${endpoint.method} ${endpoint.path}: OK ✅`);
      } else {
        results.api.details.push(`${endpoint.method} ${endpoint.path}: Failed (${response.status}) ❌`);
        results.api.status = 'fail';
      }
    } catch (error) {
      results.api.details.push(`${endpoint.method} ${endpoint.path}: Error ❌`);
      results.api.status = 'fail';
    }
  }
  
  if (results.api.status !== 'fail') {
    results.api.status = 'pass';
    console.log('✅ All API endpoints are working');
  } else {
    console.log('❌ Some API endpoints failed');
  }
}

// Test frontend pages
async function testFrontendPages() {
  console.log('\n📋 Testing Frontend Pages...');
  
  const pages = [
    '/',
    '/dashboard',
    '/jamaah',
    '/packages',
    '/payments',
    '/documents',
    '/reports'
  ];
  
  const axios = require('axios');
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${testConfig.healthEndpoints.frontend}${page}`, {
        validateStatus: () => true // Accept any status
      });
      
      if (response.status === 200) {
        results.frontend.details.push(`Page ${page}: Accessible ✅`);
      } else if (response.status === 302 || response.status === 301) {
        results.frontend.details.push(`Page ${page}: Redirects (auth required) ✅`);
      } else {
        results.frontend.details.push(`Page ${page}: Error (${response.status}) ❌`);
        results.frontend.status = 'fail';
      }
    } catch (error) {
      results.frontend.details.push(`Page ${page}: Not accessible ❌`);
      results.frontend.status = 'fail';
    }
  }
  
  if (results.frontend.status !== 'fail') {
    results.frontend.status = 'pass';
    console.log('✅ All frontend pages are accessible');
  } else {
    console.log('❌ Some frontend pages failed');
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DOCKER ENVIRONMENT TEST REPORT');
  console.log('='.repeat(60));
  
  let totalPass = 0;
  let totalFail = 0;
  
  for (const [category, result] of Object.entries(results)) {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`Status: ${result.status === 'pass' ? '✅ PASS' : '❌ FAIL'}`);
    
    if (result.details.length > 0) {
      console.log('Details:');
      result.details.forEach(detail => console.log(`  - ${detail}`));
    }
    
    if (result.status === 'pass') totalPass++;
    else totalFail++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${totalPass} passed, ${totalFail} failed`);
  console.log('='.repeat(60));
  
  // Save report to file
  const reportPath = path.join(__dirname, `docker-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Main test runner
async function runDockerTests() {
  console.log('🚀 Starting Docker Environment Testing...\n');
  
  try {
    await testDockerInstallation();
    
    if (results.docker.status === 'pass') {
      // Start containers if not running
      console.log('\n🔄 Ensuring containers are up...');
      await runCommand('docker-compose up -d', 'Starting containers');
      
      // Wait for containers to be ready
      console.log('\n⏳ Waiting for services to initialize...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      
      await testContainers();
      await testServiceHealth();
      await testDatabaseMigrations();
      await testAPIEndpoints();
      await testFrontendPages();
    }
    
    generateReport();
    
  } catch (error) {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  }
}

// Run tests
runDockerTests();
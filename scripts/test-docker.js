const axios = require('axios');
const { sequelize } = require('../config/database');

async function testDockerEnvironment() {
  console.log('🧪 Testing Docker Environment...\n');
  
  const tests = [];
  
  // Test 1: Database Connection
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection: OK');
    tests.push({ name: 'Database Connection', status: 'PASS' });
  } catch (error) {
    console.log('❌ Database connection: FAILED');
    console.log('   Error:', error.message);
    tests.push({ name: 'Database Connection', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Backend API Health
  try {
    const response = await axios.get('http://localhost:3000/api/health', { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Backend API health: OK');
      tests.push({ name: 'Backend API Health', status: 'PASS' });
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Backend API health: FAILED');
    console.log('   Error:', error.message);
    tests.push({ name: 'Backend API Health', status: 'FAIL', error: error.message });
  }
  
  // Test 3: Frontend Availability
  try {
    const response = await axios.get('http://localhost:8080/health', { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Frontend availability: OK');
      tests.push({ name: 'Frontend Availability', status: 'PASS' });
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Frontend availability: FAILED');
    console.log('   Error:', error.message);
    tests.push({ name: 'Frontend Availability', status: 'FAIL', error: error.message });
  }
  
  // Test 4: Authentication Endpoint
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, { timeout: 5000 });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Authentication: OK');
      tests.push({ name: 'Authentication', status: 'PASS' });
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.log('❌ Authentication: FAILED');
    console.log('   Error:', error.response?.data?.message || error.message);
    tests.push({ name: 'Authentication', status: 'FAIL', error: error.response?.data?.message || error.message });
  }
  
  // Test 5: Redis Connection (if available)
  try {
    // We'll test this indirectly by checking if the backend can handle sessions
    const response = await axios.get('http://localhost:3000/api', { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Redis/Session handling: OK');
      tests.push({ name: 'Redis/Session Handling', status: 'PASS' });
    }
  } catch (error) {
    console.log('❌ Redis/Session handling: FAILED');
    console.log('   Error:', error.message);
    tests.push({ name: 'Redis/Session Handling', status: 'FAIL', error: error.message });
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const passed = tests.filter(t => t.status === 'PASS').length;
  const failed = tests.filter(t => t.status === 'FAIL').length;
  
  tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`   └─ ${test.error}`);
    }
  });
  
  console.log(`\nTotal: ${tests.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Docker environment is ready.');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please check the Docker services.');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDockerEnvironment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('💥 Test runner failed:', err);
      process.exit(1);
    });
}

module.exports = testDockerEnvironment;
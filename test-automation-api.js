const axios = require('axios');

const API_BASE = 'http://localhost:3003/api';

async function testAutomationAPI() {
  try {
    console.log('Testing Automation API...\n');
    
    // Test 1: Get all rules
    console.log('1. Getting all automation rules...');
    const rulesResponse = await axios.get(`${API_BASE}/automation/rules`);
    console.log('✓ Success:', rulesResponse.data);
    
    // Test 2: Get pipeline stats
    console.log('\n2. Getting pipeline statistics...');
    const statsResponse = await axios.get(`${API_BASE}/automation/pipeline/stats`);
    console.log('✓ Success:', statsResponse.data);
    
    // Test 3: Create a rule
    console.log('\n3. Creating a new rule...');
    const newRule = {
      ruleName: 'Test Rule',
      description: 'Test automation rule',
      triggerType: 'keyword',
      triggerKeywords: ['test', 'hello'],
      responseMessages: JSON.stringify([
        { type: 'text', content: 'Hello! This is an automated response.' }
      ]),
      isActive: true,
      applyToGroups: false,
      priority: 1
    };
    
    const createResponse = await axios.post(`${API_BASE}/automation/rules`, newRule);
    console.log('✓ Success:', createResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

// Run the test
testAutomationAPI();
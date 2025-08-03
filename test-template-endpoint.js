const axios = require('axios');

async function testEndpoints() {
    const baseURL = 'http://localhost:3000';
    
    console.log('Testing template endpoints...\n');
    
    // Test 1: Get categories
    try {
        console.log('1. Testing GET /api/templates/categories');
        const response = await axios.get(`${baseURL}/api/templates/categories`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
    
    // Test 2: Get templates
    try {
        console.log('\n2. Testing GET /api/templates');
        const response = await axios.get(`${baseURL}/api/templates`);
        console.log('✅ Success:', response.data.data?.length || 0, 'templates found');
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
    
    // Test 3: Test a simple API endpoint
    try {
        console.log('\n3. Testing GET /api/sessions');
        const response = await axios.get(`${baseURL}/api/sessions`);
        console.log('✅ Success: API is working');
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
}

testEndpoints();
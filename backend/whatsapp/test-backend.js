const axios = require('axios');

async function testBackend() {
    console.log('Testing Backend Connection...\n');
    
    const baseURL = 'http://localhost:3001';
    
    // Test endpoints
    const endpoints = [
        { method: 'GET', url: '/api/health', desc: 'Health Check' },
        { method: 'GET', url: '/api/sessions/default/status', desc: 'Session Status' },
        { method: 'GET', url: '/api/contacts', desc: 'Get Contacts' },
        { method: 'GET', url: '/api/conversations', desc: 'Get Conversations' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\nTesting: ${endpoint.desc}`);
            console.log(`${endpoint.method} ${baseURL}${endpoint.url}`);
            
            const response = await axios({
                method: endpoint.method,
                url: `${baseURL}${endpoint.url}`,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Success:', response.status);
            console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200));
            
        } catch (error) {
            console.log('❌ Error:', error.response?.status || error.code);
            console.log('Message:', error.response?.data || error.message);
        }
    }
    
    console.log('\n\nChecking if backend is actually running on port 3001...');
    try {
        const response = await axios.get('http://localhost:3001');
        console.log('✅ Backend is responding');
    } catch (error) {
        if (error.response) {
            console.log('✅ Backend is running (status:', error.response.status, ')');
        } else {
            console.log('❌ Backend is NOT running on port 3001');
            console.log('Error:', error.code);
        }
    }
}

testBackend();
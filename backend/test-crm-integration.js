// CRM Backend Integration Test Script
const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:5000/api';
const WAHA_URL = 'http://localhost:3001';
const WAHA_API_KEY = 'your-secret-api-key';

// Test credentials
const TEST_USER = {
    username: 'admin',
    password: 'admin123'
};

let authToken = null;

// Helper function to make API calls
async function apiCall(method, path, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${API_BASE}${path}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
}

// Test functions
async function testAuth() {
    console.log('\n1. Testing Authentication'.cyan);
    
    const result = await apiCall('POST', '/auth/login', TEST_USER);
    
    if (result.success && result.data.data?.token) {
        authToken = result.data.data.token;
        console.log('✓ Login successful'.green);
        console.log(`  Token: ${authToken.substring(0, 20)}...`);
        return true;
    } else {
        console.log('✗ Login failed'.red);
        console.log(`  Error: ${JSON.stringify(result.error)}`);
        return false;
    }
}

async function testCRMRoutes() {
    console.log('\n2. Testing CRM Routes'.cyan);
    
    const routes = [
        { method: 'GET', path: '/crm/dashboard', name: 'Dashboard' },
        { method: 'GET', path: '/crm/stats', name: 'Stats' },
        { method: 'GET', path: '/crm/conversations', name: 'Conversations' },
        { method: 'GET', path: '/crm/leads', name: 'Leads' },
        { method: 'GET', path: '/crm/bot/config', name: 'Bot Config' },
        { method: 'GET', path: '/crm/labels', name: 'Labels' }
    ];
    
    for (const route of routes) {
        const result = await apiCall(route.method, route.path, null, {
            'Authorization': `Bearer ${authToken}`
        });
        
        if (result.success) {
            console.log(`✓ ${route.name}: ${route.method} ${route.path}`.green);
        } else {
            console.log(`✗ ${route.name}: ${route.method} ${route.path}`.red);
            console.log(`  Status: ${result.status}, Error: ${JSON.stringify(result.error)}`.gray);
        }
    }
}

async function testDatabase() {
    console.log('\n3. Testing Database Models'.cyan);
    
    // Test creating a lead
    const leadData = {
        phone_number: '+628123456789',
        name: 'Test Lead',
        source: 'whatsapp',
        status: 'new'
    };
    
    const result = await apiCall('POST', '/crm/leads', leadData, {
        'Authorization': `Bearer ${authToken}`
    });
    
    if (result.success) {
        console.log('✓ Lead creation successful'.green);
        console.log(`  Lead ID: ${result.data.data?.id}`);
        
        // Clean up - delete the test lead
        if (result.data.data?.id) {
            await apiCall('DELETE', `/crm/leads/${result.data.data.id}`, null, {
                'Authorization': `Bearer ${authToken}`
            });
        }
    } else {
        console.log('✗ Lead creation failed'.red);
        console.log(`  Error: ${JSON.stringify(result.error)}`);
    }
}

async function testWhatsAppConnection() {
    console.log('\n4. Testing WhatsApp Connection'.cyan);
    
    try {
        const response = await axios.get(`${WAHA_URL}/api/sessions/default`, {
            headers: { 'X-Api-Key': WAHA_API_KEY }
        });
        
        if (response.data.status === 'WORKING') {
            console.log('✓ WhatsApp is connected'.green);
        } else {
            console.log(`⚠ WhatsApp status: ${response.data.status}`.yellow);
        }
    } catch (error) {
        console.log('✗ WhatsApp connection check failed'.red);
        console.log(`  Error: ${error.message}`.gray);
    }
}

async function testWebSocket() {
    console.log('\n5. Testing WebSocket Connection'.cyan);
    
    const io = require('socket.io-client');
    const socket = io('http://localhost:5000', {
        auth: { token: authToken }
    });
    
    return new Promise((resolve) => {
        socket.on('connect', () => {
            console.log('✓ WebSocket connected'.green);
            socket.disconnect();
            resolve();
        });
        
        socket.on('connect_error', (error) => {
            console.log('✗ WebSocket connection failed'.red);
            console.log(`  Error: ${error.message}`.gray);
            resolve();
        });
        
        setTimeout(() => {
            socket.disconnect();
            resolve();
        }, 5000);
    });
}

async function testRateLimiting() {
    console.log('\n6. Testing Rate Limiting'.cyan);
    
    // Make multiple requests quickly
    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(apiCall('GET', '/crm/stats', null, {
            'Authorization': `Bearer ${authToken}`
        }));
    }
    
    const results = await Promise.all(promises);
    const rateLimited = results.some(r => r.status === 429);
    
    if (rateLimited) {
        console.log('✓ Rate limiting is working'.green);
    } else {
        console.log('⚠ Rate limiting might not be configured'.yellow);
    }
}

async function testCORS() {
    console.log('\n7. Testing CORS Configuration'.cyan);
    
    try {
        const response = await axios.options(`${API_BASE}/crm/stats`, {
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization'
            }
        });
        
        const corsHeaders = response.headers['access-control-allow-origin'];
        if (corsHeaders) {
            console.log('✓ CORS is properly configured'.green);
            console.log(`  Allowed origin: ${corsHeaders}`.gray);
        } else {
            console.log('✗ CORS headers not found'.red);
        }
    } catch (error) {
        console.log('✗ CORS check failed'.red);
        console.log(`  Error: ${error.message}`.gray);
    }
}

// Main test runner
async function runTests() {
    console.log('=== CRM Backend Integration Test ==='.bold.cyan);
    console.log('Testing backend at:', API_BASE);
    console.log('Testing WAHA at:', WAHA_URL);
    
    // Run authentication first
    const authSuccess = await testAuth();
    if (!authSuccess) {
        console.log('\n❌ Cannot proceed without authentication'.red);
        return;
    }
    
    // Run other tests
    await testCRMRoutes();
    await testDatabase();
    await testWhatsAppConnection();
    await testWebSocket();
    await testRateLimiting();
    await testCORS();
    
    console.log('\n=== Test Complete ==='.bold.cyan);
}

// Run tests
runTests().catch(console.error);
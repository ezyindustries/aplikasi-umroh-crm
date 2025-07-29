const axios = require('axios');
require('dotenv').config();

async function debugSessionStart() {
    console.log('=== DEBUG SESSION START ===\n');
    
    // Check environment
    console.log('Environment Variables:');
    console.log('WAHA_URL:', process.env.WAHA_URL);
    console.log('WAHA_BASE_URL:', process.env.WAHA_BASE_URL);
    console.log('WAHA_API_KEY:', process.env.WAHA_API_KEY);
    console.log('APP_URL:', process.env.APP_URL);
    console.log('\n');
    
    // Test WAHA connection
    console.log('Testing WAHA connection...');
    const wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
    
    try {
        const response = await axios.get(`${wahaUrl}/api/health`);
        console.log('✅ WAHA is running:', response.data);
    } catch (error) {
        console.log('❌ WAHA is NOT running!');
        console.log('Error:', error.message);
        console.log('\nPlease run WAHA with:');
        console.log('docker run -it -p 3000:3000 devlikeapro/waha');
        return;
    }
    
    // Test creating a session
    console.log('\nTesting session creation...');
    try {
        const sessionConfig = {
            name: 'test-session',
            config: {
                webhooks: [{
                    url: `${process.env.APP_URL || 'http://localhost:3002'}/api/webhooks/waha`,
                    events: ['session.status', 'message']
                }]
            }
        };
        
        console.log('Session config:', JSON.stringify(sessionConfig, null, 2));
        
        const response = await axios.post(`${wahaUrl}/api/sessions/`, sessionConfig, {
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': process.env.WAHA_API_KEY || ''
            }
        });
        
        console.log('✅ Session created:', response.data);
    } catch (error) {
        console.log('❌ Failed to create session!');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
        
        if (error.response?.status === 402) {
            console.log('\n⚠️  WAHA requires payment for multiple sessions');
            console.log('You can only use 1 session with free version');
        }
    }
}

debugSessionStart();
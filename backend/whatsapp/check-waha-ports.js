const axios = require('axios');

async function checkWAHA() {
    console.log('=== Checking WAHA on Different Ports ===\n');
    
    const ports = [
        { port: 3000, desc: 'Default WAHA port' },
        { port: 3001, desc: 'Your Docker mapping' }
    ];
    
    for (const {port, desc} of ports) {
        console.log(`\nChecking port ${port} (${desc})...`);
        try {
            const response = await axios.get(`http://localhost:${port}/api/health`, {
                timeout: 3000
            });
            console.log(`✅ WAHA found on port ${port}!`);
            console.log('Response:', response.data);
            
            // Try to get version
            try {
                const versionResponse = await axios.get(`http://localhost:${port}/api/version`);
                console.log('Version:', versionResponse.data);
            } catch (e) {
                // Version endpoint might not exist
            }
            
            // Try to get sessions
            try {
                const sessionsResponse = await axios.get(`http://localhost:${port}/api/sessions/`);
                console.log('Sessions:', sessionsResponse.data);
            } catch (e) {
                console.log('Sessions error:', e.response?.data || e.message);
            }
            
        } catch (error) {
            console.log(`❌ No WAHA on port ${port}`);
            console.log('Error:', error.code || error.message);
        }
    }
    
    console.log('\n\n=== Docker Container Check ===');
    console.log('Run this command to see Docker containers:');
    console.log('docker ps');
    console.log('\nIf you see a container named "waha-umroh", note the PORTS column.');
    console.log('It should show something like: 0.0.0.0:3001->3000/tcp');
}

checkWAHA();
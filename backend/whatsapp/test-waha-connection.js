const axios = require('axios');

async function testWAHA() {
    try {
        // Test WAHA health
        console.log('Testing WAHA connection...\n');
        
        const healthResponse = await axios.get('http://localhost:3000/api/health');
        console.log('✅ WAHA Health Check:', healthResponse.data);
        
        // Get sessions
        const sessionsResponse = await axios.get('http://localhost:3000/api/sessions/');
        console.log('\n📱 Current Sessions:', sessionsResponse.data);
        
        // Get version
        const versionResponse = await axios.get('http://localhost:3000/api/version');
        console.log('\n📋 WAHA Version:', versionResponse.data);
        
        console.log('\n✅ WAHA is running and accessible!');
        
    } catch (error) {
        console.error('❌ Error connecting to WAHA:', error.message);
        console.log('\nMake sure WAHA is running with:');
        console.log('docker run -it -p 3000:3000 devlikeapro/waha');
    }
}

testWAHA();
const axios = require('axios');

async function testBackendStatus() {
    console.log('=== TESTING BACKEND STATUS ===\n');
    
    const tests = [
        { name: 'Backend API', url: 'http://localhost:3001/api/health' },
        { name: 'Sessions', url: 'http://localhost:3001/api/sessions' },
        { name: 'Messages', url: 'http://localhost:3001/api/messages?limit=5' },
        { name: 'WAHA API', url: 'http://localhost:3000/api/sessions/default' }
    ];
    
    for (const test of tests) {
        try {
            const response = await axios.get(test.url, { timeout: 5000 });
            console.log(`✅ ${test.name}: OK (${response.status})`);
            if (test.name === 'Messages' && response.data.data) {
                const mediaMessages = response.data.data.filter(m => m.messageType !== 'text');
                console.log(`   - Total messages: ${response.data.data.length}`);
                console.log(`   - Media messages: ${mediaMessages.length}`);
                mediaMessages.forEach(m => {
                    console.log(`     • ${m.messageType}: ${m.mediaId || 'no media id'}`);
                });
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
        }
    }
    
    // Check MessagePoller status
    console.log('\n=== CHECKING MESSAGE POLLER ===');
    try {
        const queueStatus = await axios.get('http://localhost:3001/api/messages/queue/status');
        console.log('Queue status:', queueStatus.data);
    } catch (error) {
        console.log('Queue status error:', error.message);
    }
}

testBackendStatus();
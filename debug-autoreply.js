// Debug script to check autoreply flow
const http = require('http');

console.log('=== AUTOREPLY DEBUG SCRIPT ===\n');
console.log('This script will:');
console.log('1. Check if keyword "123" matches any rule');
console.log('2. Send a test message via webhook');
console.log('3. Monitor the backend console for processing logs\n');

// Make HTTP request
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve(responseData);
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function test() {
    // Test keyword matching
    console.log('Step 1: Testing keyword "123"...');
    
    const keywordTest = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/automation/test-keyword',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
        keyword: '123',
        phoneNumber: '6281234567890'
    }));
    
    console.log('Result:', keywordTest);
    
    if (!keywordTest.matchingRules || keywordTest.matchingRules.length === 0) {
        console.log('\n❌ No rules match keyword "123"!');
        console.log('Please create a rule with keyword "123" first.');
        return;
    }
    
    console.log('\n✅ Found matching rules!');
    
    // Send webhook
    console.log('\nStep 2: Sending test message via webhook...');
    
    const webhook = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/webhooks/waha',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
        event: 'message',
        session: 'default',
        payload: {
            id: 'test-' + Date.now(),
            from: '6281234567890@c.us',
            to: 'default@c.us',
            type: 'text',
            body: '123',
            timestamp: Math.floor(Date.now() / 1000),
            fromMe: false
        }
    }));
    
    console.log('Webhook response:', webhook);
    
    console.log('\n📋 Now check your backend console for these logs:');
    console.log('   - "=== WEBHOOK RECEIVED ==="');
    console.log('   - "=== HANDLING INCOMING MESSAGE IN RealWAHAService ==="');
    console.log('   - "=== AUTOMATION ENGINE: Processing message ==="');
    console.log('   - "Checking keywords for rule..."');
    console.log('   - "Keyword matched!"');
    console.log('   - "=== EXECUTING AUTOMATION RULE ==="');
    console.log('   - "Automation message queued"');
    
    console.log('\n🔍 If you don\'t see these logs, the autoreply is not working properly.');
    console.log('💡 Make sure your backend server is running and check the console output.');
}

test().catch(console.error);
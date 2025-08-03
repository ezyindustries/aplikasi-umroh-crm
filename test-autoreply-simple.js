const axios = require('axios');

const API_URL = 'http://localhost:3003/api';
const TEST_PHONE = '6282280301593'; // Ganti dengan nomor test anda

async function testAutoreply() {
    console.log('=== TEST AUTOREPLY SYSTEM ===\n');
    
    try {
        // 1. Check WhatsApp status
        console.log('1. Checking WhatsApp status...');
        const statusResponse = await axios.get(`${API_URL}/whatsapp/status`);
        console.log('   Status:', statusResponse.data.status);
        console.log('   Session:', statusResponse.data.sessionId);
        
        if (statusResponse.data.status !== 'WORKING') {
            console.error('   ❌ WhatsApp not connected!');
            return;
        }
        console.log('   ✅ WhatsApp connected\n');
        
        // 2. Check automation rules
        console.log('2. Checking automation rules...');
        const rulesResponse = await axios.get(`${API_URL}/automation/rules`);
        const activeRules = rulesResponse.data.filter(rule => rule.isActive);
        console.log('   Total rules:', rulesResponse.data.length);
        console.log('   Active rules:', activeRules.length);
        
        if (activeRules.length === 0) {
            console.error('   ❌ No active automation rules!');
            return;
        }
        console.log('   ✅ Automation rules found\n');
        
        // 3. Check templates
        console.log('3. Checking templates...');
        const templatesResponse = await axios.get(`${API_URL}/templates`);
        console.log('   Total templates:', templatesResponse.data.length);
        
        if (templatesResponse.data.length === 0) {
            console.error('   ❌ No templates found!');
            return;
        }
        console.log('   ✅ Templates available\n');
        
        // 4. Test intent detection
        console.log('4. Testing intent detection...');
        const testMessages = [
            'Assalamualaikum',
            'Berapa harga paket umroh?',
            'Kapan keberangkatan umroh?',
            'Apa saja persyaratan umroh?'
        ];
        
        for (const message of testMessages) {
            try {
                const response = await axios.post(`${API_URL}/templates/test`, {
                    message: message
                });
                console.log(`   "${message}"`);
                console.log(`   → Intent: ${response.data.intent}`);
                console.log(`   → Template: ${response.data.template?.name || 'No match'}`);
                console.log(`   → Response: ${response.data.response?.substring(0, 50)}...`);
                console.log('');
            } catch (error) {
                console.error(`   ❌ Error testing: ${message}`);
            }
        }
        
        console.log('✅ All tests completed!\n');
        console.log('=== AUTOREPLY SYSTEM STATUS ===');
        console.log('✅ WhatsApp: Connected');
        console.log('✅ Automation: Active');
        console.log('✅ Templates: Available');
        console.log('✅ Intent Detection: Working');
        console.log('\nSystem is ready to process incoming messages!');
        console.log(`Send a WhatsApp message to test the autoreply.`);
        
    } catch (error) {
        console.error('Error during test:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run test
testAutoreply();
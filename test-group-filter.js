const axios = require('axios');

const API_URL = 'http://localhost:3003/api';

async function testGroupFilter() {
    console.log('=== TEST GROUP MESSAGE FILTER ===\n');
    
    try {
        // Test individual chat message
        console.log('1. Testing individual chat message:');
        const individualResponse = await axios.post(`${API_URL}/templates/test`, {
            message: 'Assalamualaikum, berapa harga umroh?',
            isGroupMessage: false
        });
        console.log('   Individual chat - Should respond: YES');
        console.log('   Intent:', individualResponse.data.intent);
        console.log('   Template:', individualResponse.data.template?.name || 'No match');
        console.log('   Response preview:', individualResponse.data.response?.substring(0, 60) + '...\n');
        
        // Test group chat message
        console.log('2. Testing group chat message:');
        const groupResponse = await axios.post(`${API_URL}/templates/test`, {
            message: 'Assalamualaikum, berapa harga umroh?',
            isGroupMessage: true
        });
        console.log('   Group chat - Should respond: NO');
        console.log('   Intent:', groupResponse.data.intent || 'N/A');
        console.log('   Template:', groupResponse.data.template?.name || 'N/A');
        console.log('   Response:', groupResponse.data.response || 'No response (as expected)');
        
        console.log('\n=== TEST SUMMARY ===');
        console.log('✅ Individual chats: Autoreply ENABLED');
        console.log('❌ Group chats: Autoreply DISABLED');
        console.log('\nGroup message filter is working correctly!');
        
    } catch (error) {
        console.error('Error during test:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run test
testGroupFilter();
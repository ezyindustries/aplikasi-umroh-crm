const axios = require('axios');

async function testAPIRaw() {
    console.log('=== TESTING RAW API RESPONSE ===\n');
    
    try {
        // Get conversations
        const convRes = await axios.get('http://localhost:3001/api/conversations?limit=1');
        const conversationId = convRes.data.data[0].id;
        
        // Get messages raw response
        const response = await axios.get(`http://localhost:3001/api/messages/${conversationId}?limit=2`);
        
        console.log('Full response:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAPIRaw();
const axios = require('axios');

async function testAPIDebug() {
    console.log('=== TESTING API WITH DEBUG ===\n');
    
    try {
        // Wait a bit for backend to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get conversations
        const convRes = await axios.get('http://localhost:3001/api/conversations?limit=1');
        const conversationId = convRes.data.data[0].id;
        
        console.log(`Testing conversation: ${conversationId}\n`);
        
        // Get messages - this should trigger our debug log
        const msgRes = await axios.get(`http://localhost:3001/api/messages/${conversationId}?limit=1`);
        
        console.log('API Response:');
        console.log(JSON.stringify(msgRes.data.data[0], null, 2));
        
        console.log('\nCheck the backend console for debug logs!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAPIDebug();
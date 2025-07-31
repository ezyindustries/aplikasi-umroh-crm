const axios = require('axios');

async function testAPIImage() {
    console.log('=== TESTING API WITH IMAGE MESSAGE ===\n');
    
    try {
        // Get conversations
        const convRes = await axios.get('http://localhost:3001/api/conversations?limit=5');
        
        // Find conversation with Muchammad Edo Iskandar
        const conversation = convRes.data.data.find(c => 
            c.contact && c.contact.name === 'Muchammad Edo Iskandar'
        );
        
        if (!conversation) {
            console.log('Could not find Muchammad Edo Iskandar conversation');
            return;
        }
        
        console.log(`Found conversation: ${conversation.id}\n`);
        
        // Get messages including images
        const msgRes = await axios.get(`http://localhost:3001/api/messages/${conversation.id}?limit=10`);
        
        // Find image messages
        const imageMessages = msgRes.data.data.filter(m => m.messageType === 'image');
        
        console.log(`Found ${imageMessages.length} image messages:\n`);
        
        imageMessages.forEach((msg, i) => {
            console.log(`Image ${i + 1}:`);
            console.log(`  ID: ${msg.id}`);
            console.log(`  MediaID: ${msg.mediaId}`);
            console.log(`  MediaURL: ${msg.mediaUrl}`);
            console.log(`  MimeType: ${msg.mediaMimeType}`);
            console.log(`  Has mediaId: ${msg.mediaId !== null && msg.mediaId !== undefined}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAPIImage();
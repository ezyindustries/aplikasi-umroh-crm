const axios = require('axios');

async function testWAHAMedia() {
    console.log('=== TESTING WAHA MEDIA ENDPOINTS ===\n');
    
    try {
        // 1. Get recent chats
        console.log('1. Fetching recent chats...');
        const chatsRes = await axios.get('http://localhost:3000/api/default/chats?limit=5');
        console.log(`Found ${chatsRes.data.length} chats\n`);
        
        // 2. For each chat, get recent messages
        for (const chat of chatsRes.data) {
            if (!chat.id._serialized.includes('@c.us')) continue; // Skip groups
            
            console.log(`\n2. Checking messages for chat: ${chat.id._serialized}`);
            console.log(`   Contact name: ${chat.name || 'Unknown'}`);
            
            try {
                const messagesRes = await axios.get(
                    `http://localhost:3000/api/default/chats/${chat.id._serialized}/messages?limit=10`
                );
                
                console.log(`   Found ${messagesRes.data.length} messages`);
                
                // Look for media messages
                const mediaMessages = messagesRes.data.filter(msg => 
                    msg.type !== 'chat' && msg.type !== 'text'
                );
                
                if (mediaMessages.length > 0) {
                    console.log(`   ✅ Found ${mediaMessages.length} media messages!`);
                    
                    for (const msg of mediaMessages) {
                        console.log(`\n   Media Message Details:`);
                        console.log(`   - ID: ${msg.id?.id || msg.id}`);
                        console.log(`   - Type: ${msg.type}`);
                        console.log(`   - Body: ${msg.body || '[no caption]'}`);
                        console.log(`   - Has media object: ${!!msg.media}`);
                        
                        if (msg.media) {
                            console.log(`   - Media ID: ${msg.media.id}`);
                            console.log(`   - Mimetype: ${msg.media.mimetype}`);
                            console.log(`   - Filename: ${msg.media.filename}`);
                            console.log(`   - Size: ${msg.media.filesize}`);
                            console.log(`   - URL: ${msg.media.url}`);
                        }
                        
                        // Check raw message structure
                        console.log(`\n   Full message structure:`, JSON.stringify(msg, null, 2));
                        
                        // Try to download media
                        if (msg.id) {
                            const mediaId = msg.id?.id || msg.id;
                            console.log(`\n   Trying to download media with ID: ${mediaId}`);
                            
                            try {
                                const downloadRes = await axios.get(
                                    `http://localhost:3000/api/default/messages/${mediaId}/download`,
                                    { responseType: 'arraybuffer' }
                                );
                                console.log(`   ✅ Media download successful! Size: ${downloadRes.data.length} bytes`);
                            } catch (dlError) {
                                console.log(`   ❌ Download failed: ${dlError.response?.status} ${dlError.message}`);
                            }
                        }
                    }
                } else {
                    console.log(`   No media messages found in this chat`);
                }
                
            } catch (error) {
                console.log(`   Error fetching messages: ${error.message}`);
            }
        }
        
        // 3. Check session configuration
        console.log('\n\n3. Checking session configuration...');
        const sessionRes = await axios.get('http://localhost:3000/api/sessions/default');
        console.log('Session config:', JSON.stringify(sessionRes.data.config, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data);
        }
    }
}

// Run the test
testWAHAMedia();
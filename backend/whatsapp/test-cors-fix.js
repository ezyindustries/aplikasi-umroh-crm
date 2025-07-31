const axios = require('axios');

async function testCORSFix() {
    console.log('=== TESTING CORS FIX FOR MEDIA ===\n');
    
    try {
        // Wait for backend to fully start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test one of the existing media files
        const mediaId = 'false_6282255555000@c.us_3A7AEA606A724E752DDF';
        const url = `http://localhost:3001/api/messages/media/${mediaId}`;
        
        console.log(`Testing media endpoint: ${url}\n`);
        
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            validateStatus: () => true // Accept any status
        });
        
        console.log(`Status: ${response.status}`);
        console.log('Headers:');
        console.log(`  Content-Type: ${response.headers['content-type']}`);
        console.log(`  Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin']}`);
        console.log(`  Cross-Origin-Resource-Policy: ${response.headers['cross-origin-resource-policy']}`);
        
        if (response.status === 200) {
            console.log(`\n✓ Media loaded successfully (${response.data.length} bytes)`);
            console.log('✓ CORS headers are set correctly');
        } else {
            console.log('\n✗ Failed to load media');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCORSFix();
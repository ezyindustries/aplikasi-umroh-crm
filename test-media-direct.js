// Test direct route access

const API_URL = 'http://localhost:3003';

// Test if the server is responding
async function testServer() {
    try {
        console.log('🧪 Testing server connection...\n');
        
        // Test health endpoint
        const healthResponse = await fetch(`${API_URL}/api/health`);
        console.log('Health check:', healthResponse.status);
        
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('Server health:', health);
        }
        
        // Test a simple route
        console.log('\n📡 Testing media routes...');
        
        // Test with URL-safe base64 encoding
        const testPath = 'D:\\ezyin\\Documents\\aplikasi umroh\\paket\\#2025_10H_DBX_SEP07\\IMG_1044.jpg';
        const encodedPath = Buffer.from(testPath).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        
        console.log('Original path:', testPath);
        console.log('URL-safe encoded:', encodedPath);
        
        const mediaUrl = `${API_URL}/api/media/local/${encodedPath}`;
        console.log('Full URL:', mediaUrl);
        
        const response = await fetch(mediaUrl);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const error = await response.text();
            console.log('Error response:', error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testServer();
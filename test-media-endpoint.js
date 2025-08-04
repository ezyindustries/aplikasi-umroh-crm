const fs = require('fs').promises;
const path = require('path');

const API_URL = 'http://localhost:3003/api';

// Test local media endpoint
async function testMediaEndpoint() {
    try {
        console.log('🧪 Testing local media endpoint...\n');
        
        // Test with a known media file
        const testPath = 'D:\\ezyin\\Documents\\aplikasi umroh\\paket\\#2025_10H_DBX_SEP07\\#2025_10H_DBX_SEP07_1.jpg';
        const encodedPath = Buffer.from(testPath).toString('base64');
        const mediaUrl = `${API_URL}/media/local/${encodedPath}`;
        
        console.log('📍 Test file path:', testPath);
        console.log('🔐 Encoded path:', encodedPath);
        console.log('🌐 Media URL:', mediaUrl);
        
        // Test the endpoint
        console.log('\n📡 Fetching media from endpoint...');
        const response = await fetch(mediaUrl);
        
        console.log('✅ Response status:', response.status);
        console.log('📋 Content-Type:', response.headers.get('content-type'));
        console.log('📏 Content-Length:', response.headers.get('content-length'));
        
        if (response.ok) {
            console.log('\n✅ Media endpoint is working correctly!');
            
            // Test with invalid path (security test)
            console.log('\n🔒 Testing security (directory traversal protection)...');
            const invalidPath = 'D:\\ezyin\\Documents\\aplikasi umroh\\backend\\whatsapp\\.env';
            const invalidEncoded = Buffer.from(invalidPath).toString('base64');
            const invalidUrl = `${API_URL}/media/local/${invalidEncoded}`;
            
            const invalidResponse = await fetch(invalidUrl);
            if (invalidResponse.status === 403) {
                console.log('✅ Security check passed! Directory traversal blocked.');
            } else {
                console.log('⚠️ Security issue: Expected 403, got', invalidResponse.status);
            }
            
        } else {
            console.error('❌ Media endpoint failed:', response.status, response.statusText);
            const errorData = await response.text();
            console.error('Error response:', errorData);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testMediaEndpoint();
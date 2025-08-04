async function testWAHAConnection() {
    console.log('🔍 Testing WAHA Connection...\n');
    
    const WAHA_URL = 'http://localhost:3000';
    const API_KEY = 'your-api-key';
    
    // Helper function for fetch with timeout
    async function fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }
    
    // Test 1: Health check
    try {
        console.log('1. Testing health endpoint...');
        const health = await fetchWithTimeout(`${WAHA_URL}/health`);
        const data = await health.json();
        console.log('✅ Health:', data);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }
    
    // Test 2: Session status
    try {
        console.log('\n2. Testing session status...');
        const session = await fetchWithTimeout(`${WAHA_URL}/api/sessions/default`, {
            headers: { 'X-Api-Key': API_KEY }
        });
        const data = await session.json();
        console.log('✅ Session:', data);
    } catch (error) {
        console.log('❌ Session check failed:', error.message);
    }
    
    // Test 3: Auth status
    try {
        console.log('\n3. Testing auth status...');
        const auth = await fetchWithTimeout(`${WAHA_URL}/api/sessions/default/auth`, {
            headers: { 'X-Api-Key': API_KEY }
        });
        const data = await auth.json();
        console.log('✅ Auth:', data);
    } catch (error) {
        console.log('❌ Auth check failed:', error.message);
    }
    
    // Test 4: Get QR code if not authenticated
    try {
        console.log('\n4. Checking QR code status...');
        const qr = await fetchWithTimeout(`${WAHA_URL}/api/sessions/default/auth/qr`, {
            headers: { 'X-Api-Key': API_KEY }
        });
        const data = await qr.json();
        if (data.qr) {
            console.log('📱 QR Code available - WhatsApp not connected!');
            console.log('Please scan QR code to authenticate');
        } else {
            console.log('✅ No QR code - WhatsApp should be connected');
        }
    } catch (error) {
        console.log('❌ QR check failed:', error.message);
    }
    
    // Test 5: Check if WAHA is responding slowly
    try {
        console.log('\n5. Testing response time...');
        const start = Date.now();
        const test = await fetchWithTimeout(`${WAHA_URL}/health`, {}, 30000);
        const elapsed = Date.now() - start;
        console.log(`Response time: ${elapsed}ms`);
        if (elapsed > 5000) {
            console.log('⚠️ WAHA is responding very slowly!');
        }
    } catch (error) {
        console.log('❌ Response time test failed:', error.message);
    }
    
    console.log('\n📋 Summary:');
    console.log('- If health check passes but session/auth fails, WAHA is running but not authenticated');
    console.log('- If all checks fail, WAHA is not running or not accessible');
    console.log('- Timeout errors usually mean WAHA is stuck or overloaded');
    console.log('- Slow response times indicate performance issues');
}

testWAHAConnection().catch(console.error);
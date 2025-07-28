/**
 * Dynamic API Configuration
 * Automatically detects the correct backend port
 */

// Function to detect backend port
async function detectBackendPort() {
    const ports = [3001, 3000, 5000]; // Try ports in order
    
    for (const port of ports) {
        try {
            const response = await fetch(`http://localhost:${port}/api/health`, {
                method: 'GET',
                mode: 'cors',
                timeout: 2000
            });
            
            if (response.ok) {
                console.log(`✅ Backend detected on port ${port}`);
                return port;
            }
        } catch (e) {
            console.log(`❌ Port ${port} not available`);
        }
    }
    
    // Default to 3001 if no backend found
    console.warn('⚠️ No backend detected, using default port 3001');
    return 3001;
}

// Initialize API configuration
let API_PORT = 3001; // Default port

// Update API configuration dynamically
(async function initializeAPIConfig() {
    API_PORT = await detectBackendPort();
    
    // Update the global API_CONFIG if it exists
    if (window.API_CONFIG) {
        window.API_CONFIG.BASE_URL = `http://localhost:${API_PORT}/api`;
        console.log(`🔧 API configured to use port ${API_PORT}`);
    }
})();

// Export for use in other scripts
window.getAPIBaseURL = function() {
    return `http://localhost:${API_PORT}/api`;
};
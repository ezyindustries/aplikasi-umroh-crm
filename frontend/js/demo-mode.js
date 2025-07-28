/**
 * Demo Mode - Fallback when backend is not available
 */

window.DemoMode = {
    isActive: false,
    
    // Demo users
    users: [
        { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
        { username: 'user', password: 'user123', role: 'user', name: 'User Demo' }
    ],
    
    // Enable demo mode
    enable() {
        this.isActive = true;
        console.warn('⚠️ Demo Mode Active - Backend not available');
        
        // Override API calls
        this.overrideAPI();
    },
    
    // Override API functions for demo
    overrideAPI() {
        // Override login
        window.ApiService.auth.login = async (username, password) => {
            const user = this.users.find(u => u.username === username && u.password === password);
            if (user) {
                const token = 'demo-token-' + Date.now();
                const userData = { ...user, token };
                
                // Save to localStorage
                localStorage.setItem('umroh_auth_token', token);
                localStorage.setItem('umroh_user_data', JSON.stringify(userData));
                
                return {
                    success: true,
                    data: { token, user: userData }
                };
            }
            throw new Error('Invalid credentials');
        };
        
        // Override other API calls with demo data
        window.ApiService.jamaah = {
            getAll: async () => ({
                success: true,
                data: {
                    rows: [
                        {
                            id: 1,
                            registration_number: 'REG2024001',
                            full_name: 'Ahmad Sulaiman',
                            nik: '3201234567890123',
                            phone: '081234567890',
                            package: { name: 'Paket Reguler' },
                            status: 'active'
                        },
                        {
                            id: 2,
                            registration_number: 'REG2024002',
                            full_name: 'Fatimah Zahra',
                            nik: '3201234567890124',
                            phone: '081234567891',
                            package: { name: 'Paket VIP' },
                            status: 'active'
                        }
                    ],
                    totalPages: 1,
                    currentPage: 1
                }
            })
        };
        
        // Override dashboard stats
        window.loadDashboardData = () => {
            document.getElementById('total-jamaah').textContent = '150';
            document.getElementById('active-packages').textContent = '5';
            document.getElementById('monthly-revenue').textContent = 'Rp 500.000.000';
            document.getElementById('pending-payments').textContent = '12';
            
            // Show demo notification
            showToast('info', 'Running in Demo Mode - Backend not available');
        };
    }
};

// Auto-detect if backend is available
(async function checkBackend() {
    try {
        const response = await fetch('http://localhost:3001/api/health', {
            method: 'GET',
            mode: 'cors',
            signal: AbortSignal.timeout(3000)
        });
        
        if (!response.ok) throw new Error('Backend not healthy');
        
        console.log('✅ Backend detected - Normal mode');
    } catch (error) {
        console.error('❌ Backend not available:', error.message);
        window.DemoMode.enable();
    }
})();
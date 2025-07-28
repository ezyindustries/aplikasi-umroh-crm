// WhatsApp Connection Handler
// Handles WAHA integration for WhatsApp connectivity

const WhatsAppConnection = {
    WAHA_URL: 'http://localhost:3001',
    WAHA_API_KEY: 'your-secret-api-key',
    SESSION_NAME: 'default',
    isConnecting: false,
    checkInterval: null,
    
    // Initialize WhatsApp connection
    async init() {
        console.log('Initializing WhatsApp connection handler...');
        await this.checkStatus();
        
        // Setup periodic status check every 30 seconds
        setInterval(() => this.checkStatus(), 30000);
    },
    
    // Check WhatsApp connection status
    async checkStatus() {
        try {
            const response = await fetch(`${this.WAHA_URL}/api/sessions/${this.SESSION_NAME}`, {
                headers: { 'X-Api-Key': this.WAHA_API_KEY }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('WhatsApp status:', data.status);
                this.updateUI(data.status === 'WORKING', data.status);
                return data.status;
            } else {
                this.updateUI(false, 'DISCONNECTED');
                return 'DISCONNECTED';
            }
        } catch (error) {
            console.error('Error checking WhatsApp status:', error);
            this.updateUI(false, 'ERROR');
            return 'ERROR';
        }
    },
    
    // Connect to WhatsApp
    async connect() {
        if (this.isConnecting) {
            console.log('Already connecting...');
            return;
        }
        
        this.isConnecting = true;
        console.log('Connecting to WhatsApp...');
        
        try {
            // First check if session exists
            const status = await this.checkStatus();
            
            if (status === 'WORKING') {
                alert('WhatsApp is already connected!');
                this.isConnecting = false;
                return;
            }
            
            if (status === 'SCAN_QR_CODE') {
                // Session exists but needs QR scan
                await this.showQRCode();
            } else {
                // Create new session
                const response = await fetch(`${this.WAHA_URL}/api/sessions/start`, {
                    method: 'POST',
                    headers: {
                        'X-Api-Key': this.WAHA_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: this.SESSION_NAME,
                        config: {
                            webhooks: [{
                                url: 'http://localhost:5000/api/crm/webhook',
                                events: ['message', 'message.ack', 'state.change']
                            }]
                        }
                    })
                });
                
                if (response.ok) {
                    console.log('Session created, showing QR code...');
                    setTimeout(() => this.showQRCode(), 2000);
                } else {
                    const error = await response.json();
                    console.error('Failed to create session:', error);
                    alert('Failed to create WhatsApp session: ' + (error.message || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect: ' + error.message);
        } finally {
            this.isConnecting = false;
        }
    },
    
    // Show QR code for scanning
    async showQRCode() {
        console.log('Fetching QR code...');
        
        // Create or show modal
        let modal = document.getElementById('wa-qr-modal');
        if (!modal) {
            modal = this.createQRModal();
        }
        
        modal.style.display = 'flex';
        const qrContainer = document.getElementById('wa-qr-container');
        qrContainer.innerHTML = '<div class="loading"></div><p>Loading QR code...</p>';
        
        try {
            // Get QR code
            const response = await fetch(`${this.WAHA_URL}/api/sessions/${this.SESSION_NAME}/auth/qr`, {
                headers: { 'X-Api-Key': this.WAHA_API_KEY }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                
                qrContainer.innerHTML = `
                    <img src="${imageUrl}" alt="WhatsApp QR Code" style="max-width: 300px; margin: 20px auto;">
                    <p style="color: #94a3b8; margin-top: 20px;">
                        Open WhatsApp on your phone<br>
                        Go to Settings → Linked Devices → Link a Device<br>
                        Scan this QR code
                    </p>
                `;
                
                // Start checking for connection
                this.startConnectionCheck();
            } else {
                qrContainer.innerHTML = '<p style="color: #ef4444;">Failed to load QR code. Please try again.</p>';
            }
        } catch (error) {
            console.error('Error loading QR code:', error);
            qrContainer.innerHTML = '<p style="color: #ef4444;">Error loading QR code: ' + error.message + '</p>';
        }
    },
    
    // Create QR modal if it doesn't exist
    createQRModal() {
        const modal = document.createElement('div');
        modal.id = 'wa-qr-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="background: rgba(30, 41, 59, 0.98); padding: 30px; border-radius: 12px; text-align: center; max-width: 500px; position: relative;">
                <button onclick="WhatsAppConnection.closeQRModal()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #e2e8f0; font-size: 24px; cursor: pointer;">&times;</button>
                <h2 style="margin-bottom: 20px; color: #e2e8f0;">Connect WhatsApp</h2>
                <div id="wa-qr-container"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeQRModal();
            }
        });
        
        return modal;
    },
    
    // Close QR modal
    closeQRModal() {
        const modal = document.getElementById('wa-qr-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.stopConnectionCheck();
    },
    
    // Start checking for successful connection
    startConnectionCheck() {
        this.checkInterval = setInterval(async () => {
            const status = await this.checkStatus();
            if (status === 'WORKING') {
                console.log('WhatsApp connected successfully!');
                this.closeQRModal();
                this.stopConnectionCheck();
                alert('WhatsApp connected successfully!');
                
                // Reload conversations if on WhatsApp page
                if (typeof loadConversations === 'function') {
                    loadConversations();
                }
            }
        }, 3000);
        
        // Stop checking after 5 minutes
        setTimeout(() => this.stopConnectionCheck(), 300000);
    },
    
    // Stop connection check interval
    stopConnectionCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    },
    
    // Disconnect WhatsApp
    async disconnect() {
        if (!confirm('Are you sure you want to disconnect WhatsApp?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.WAHA_URL}/api/sessions/${this.SESSION_NAME}/stop`, {
                method: 'POST',
                headers: { 'X-Api-Key': this.WAHA_API_KEY }
            });
            
            if (response.ok) {
                console.log('WhatsApp disconnected');
                this.updateUI(false, 'DISCONNECTED');
                alert('WhatsApp disconnected successfully');
            } else {
                const error = await response.json();
                alert('Failed to disconnect: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Disconnect error:', error);
            alert('Error disconnecting: ' + error.message);
        }
    },
    
    // Update UI based on connection status
    updateUI(connected, status) {
        // Update status dot
        const statusDot = document.getElementById('wa-status-dot');
        if (statusDot) {
            statusDot.className = 'status-dot ' + (connected ? 'connected' : 'disconnected');
        }
        
        // Update status text
        const statusText = document.getElementById('wa-status-text');
        if (statusText) {
            const statusMessages = {
                'WORKING': 'WhatsApp Connected',
                'SCAN_QR_CODE': 'Scan QR Code',
                'DISCONNECTED': 'WhatsApp Disconnected',
                'ERROR': 'Connection Error',
                'STARTING': 'Starting...',
                'STOPPED': 'WhatsApp Stopped'
            };
            statusText.textContent = statusMessages[status] || 'Unknown Status';
        }
        
        // Update disconnect button
        const disconnectBtn = document.getElementById('wa-disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.disabled = !connected;
        }
        
        // Update chat input
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        if (!connected && chatInput && sendBtn) {
            chatInput.disabled = true;
            sendBtn.disabled = true;
        }
    }
};

// Auto-initialize when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WhatsAppConnection.init());
} else {
    WhatsAppConnection.init();
}

// Make it globally available
window.WhatsAppConnection = WhatsAppConnection;
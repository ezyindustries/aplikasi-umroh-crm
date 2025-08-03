/**
 * WAHA Plus Integration Helper
 * Handles WhatsApp connection via WAHA Plus API
 */

class WAHAPlusIntegration {
    constructor(config) {
        this.apiUrl = config.apiUrl || 'http://localhost:3003/api';
        this.wahaUrl = config.wahaUrl || 'http://localhost:3000';
        this.sessionId = config.sessionId || 'default';
        this.apiKey = config.apiKey || 'your-api-key';
        this.onStatusChange = config.onStatusChange || (() => {});
        this.onQRReceived = config.onQRReceived || (() => {});
    }

    /**
     * Get session status from backend (which calls WAHA)
     */
    async getStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/sessions/${this.sessionId}/status`);
            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting status:', error);
            throw error;
        }
    }

    /**
     * Start WhatsApp session
     */
    async startSession() {
        try {
            const response = await fetch(`${this.apiUrl}/sessions/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to start session: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error starting session:', error);
            throw error;
        }
    }

    /**
     * Get QR code - tries multiple methods
     */
    async getQRCode() {
        console.log('Getting QR code...');
        
        // Method 1: Try backend endpoint first
        try {
            const response = await fetch(`${this.apiUrl}/sessions/${this.sessionId}/qr`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.qr) {
                    console.log('QR received from backend');
                    return data.data.qr;
                }
            }
        } catch (error) {
            console.log('Backend QR endpoint failed:', error);
        }

        // Method 2: Try direct WAHA Plus API with image format
        try {
            const response = await fetch(`${this.wahaUrl}/api/${this.sessionId}/auth/qr?format=image`, {
                headers: {
                    'X-Api-Key': this.apiKey
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const imgUrl = URL.createObjectURL(blob);
                console.log('QR received from WAHA Plus (image)');
                return imgUrl;
            }
        } catch (error) {
            console.log('WAHA Plus image QR failed:', error);
        }

        // Method 3: Try WAHA Plus API with base64 format
        try {
            const response = await fetch(`${this.wahaUrl}/api/${this.sessionId}/auth/qr`, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.mimetype && data.data) {
                    const base64Url = `data:${data.mimetype};base64,${data.data}`;
                    console.log('QR received from WAHA Plus (base64)');
                    return base64Url;
                }
            }
        } catch (error) {
            console.log('WAHA Plus base64 QR failed:', error);
        }

        throw new Error('Failed to get QR code from all sources');
    }

    /**
     * Stop session
     */
    async stopSession() {
        try {
            const response = await fetch(`${this.apiUrl}/sessions/${this.sessionId}/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ logout: true })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to stop session: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error stopping session:', error);
            throw error;
        }
    }

    /**
     * Monitor connection status and QR code
     */
    async monitorConnection() {
        let qrShown = false;
        let checkInterval;
        
        const checkStatus = async () => {
            try {
                const statusResult = await this.getStatus();
                
                if (statusResult.success && statusResult.data) {
                    const status = statusResult.data.status?.toLowerCase() || 'unknown';
                    
                    // Notify status change
                    this.onStatusChange(status, statusResult.data);
                    
                    // Handle different statuses
                    if (status === 'scan_qr_code' || status === 'scan-qr-code' || status === 'qr') {
                        if (!qrShown) {
                            try {
                                const qrCode = await this.getQRCode();
                                this.onQRReceived(qrCode);
                                qrShown = true;
                            } catch (qrError) {
                                console.error('Failed to get QR:', qrError);
                            }
                        }
                    } else if (status === 'working' || status === 'connected' || status === 'authenticated') {
                        // Connected successfully
                        qrShown = false;
                        if (checkInterval) {
                            clearInterval(checkInterval);
                        }
                    } else if (status === 'disconnected' || status === 'failed') {
                        // Reset state
                        qrShown = false;
                    }
                }
            } catch (error) {
                console.error('Monitor error:', error);
            }
        };

        // Initial check
        await checkStatus();
        
        // Set up interval check
        checkInterval = setInterval(checkStatus, 3000);
        
        return () => {
            if (checkInterval) {
                clearInterval(checkInterval);
            }
        };
    }

    /**
     * Connect to WhatsApp (start session and monitor)
     */
    async connect() {
        try {
            // Start session
            await this.startSession();
            
            // Start monitoring
            return await this.monitorConnection();
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }
}

// Export for use in other scripts
window.WAHAPlusIntegration = WAHAPlusIntegration;
/**
 * API Configuration and Service Layer
 * Handles all backend API communications
 */

// API Configuration
const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : '/api',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};

// Token Management
const TokenManager = {
    TOKEN_KEY: 'umroh_auth_token',
    USER_KEY: 'umroh_user_data',
    
    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },
    
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },
    
    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },
    
    setUser(userData) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    },
    
    getUser() {
        const userData = localStorage.getItem(this.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },
    
    isAuthenticated() {
        return !!this.getToken();
    }
};

// Base API Service
class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }
    
    // Helper method for making requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = TokenManager.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };
        
        // Add body if provided
        if (options.body && typeof options.body === 'object') {
            defaultOptions.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(url, defaultOptions);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                TokenManager.removeToken();
                window.location.href = '/login';
                throw new Error('Session expired. Please login again.');
            }
            
            // Parse response
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }
    
    // Convenience methods
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    }
    
    put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    }
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    // File upload method
    async upload(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        const token = TokenManager.getToken();
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }
            
            return data;
        } catch (error) {
            console.error(`Upload Error [${endpoint}]:`, error);
            throw error;
        }
    }
}

// Create API instance
const api = new ApiService();

// Authentication Service
const AuthService = {
    async login(username, password) {
        try {
            const response = await api.post('/auth/login', { username, password });
            
            if (response.success && response.data) {
                TokenManager.setToken(response.data.token);
                TokenManager.setUser(response.data.user);
                return response;
            }
            
            throw new Error(response.message || 'Login failed');
        } catch (error) {
            throw error;
        }
    },
    
    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Continue logout even if API fails
            console.error('Logout API error:', error);
        } finally {
            TokenManager.removeToken();
            window.location.href = '/';
        }
    },
    
    async getCurrentUser() {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    
    async changePassword(oldPassword, newPassword) {
        return api.post('/auth/change-password', { oldPassword, newPassword });
    }
};

// Jamaah Service
const JamaahService = {
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/jamaah${queryString ? '?' + queryString : ''}`);
    },
    
    async getById(id) {
        return api.get(`/jamaah/${id}`);
    },
    
    async create(data) {
        return api.post('/jamaah', data);
    },
    
    async update(id, data) {
        return api.put(`/jamaah/${id}`, data);
    },
    
    async delete(id) {
        return api.delete(`/jamaah/${id}`);
    },
    
    async importExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        return api.upload('/jamaah/import', formData);
    },
    
    async exportExcel(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${api.baseURL}/jamaah/export${queryString ? '?' + queryString : ''}`, {
            headers: {
                'Authorization': `Bearer ${TokenManager.getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jamaah-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
};

// Package Service
const PackageService = {
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/packages${queryString ? '?' + queryString : ''}`);
    },
    
    async getById(id) {
        return api.get(`/packages/${id}`);
    },
    
    async create(data) {
        return api.post('/packages', data);
    },
    
    async update(id, data) {
        return api.put(`/packages/${id}`, data);
    },
    
    async delete(id) {
        return api.delete(`/packages/${id}`);
    },
    
    async getAvailable() {
        return api.get('/packages/available');
    }
};

// Payment Service
const PaymentService = {
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/payments${queryString ? '?' + queryString : ''}`);
    },
    
    async getById(id) {
        return api.get(`/payments/${id}`);
    },
    
    async create(data) {
        return api.post('/payments', data);
    },
    
    async update(id, data) {
        return api.put(`/payments/${id}`, data);
    },
    
    async uploadProof(paymentId, file) {
        const formData = new FormData();
        formData.append('proof', file);
        return api.upload(`/payments/${paymentId}/proof`, formData);
    },
    
    async getByJamaah(jamaahId) {
        return api.get(`/payments/jamaah/${jamaahId}`);
    }
};

// Document Service
const DocumentService = {
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/documents${queryString ? '?' + queryString : ''}`);
    },
    
    async upload(jamaahId, documentType, file) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', documentType);
        formData.append('jamaah_id', jamaahId);
        return api.upload('/documents/upload', formData);
    },
    
    async delete(id) {
        return api.delete(`/documents/${id}`);
    },
    
    async getByJamaah(jamaahId) {
        return api.get(`/documents/jamaah/${jamaahId}`);
    }
};

// Report Service
const ReportService = {
    async getDashboard() {
        return api.get('/reports/dashboard');
    },
    
    async getSummary(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/reports/summary${queryString ? '?' + queryString : ''}`);
    },
    
    async getFinancial(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/reports/financial${queryString ? '?' + queryString : ''}`);
    },
    
    async getJamaahByPackage(packageId) {
        return api.get(`/reports/package/${packageId}/jamaah`);
    },
    
    async exportReport(type, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${api.baseURL}/reports/export/${type}${queryString ? '?' + queryString : ''}`, {
            headers: {
                'Authorization': `Bearer ${TokenManager.getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
};

// Activity Service
const ActivityService = {
    async getRecent(limit = 10) {
        return api.get(`/activities/recent?limit=${limit}`);
    },
    
    async getByUser(userId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/activities/user/${userId}${queryString ? '?' + queryString : ''}`);
    }
};

// Export all services
window.API = {
    config: API_CONFIG,
    TokenManager,
    AuthService,
    JamaahService,
    PackageService,
    PaymentService,
    DocumentService,
    ReportService,
    ActivityService,
    
    // Utility functions
    showToast(type, message) {
        // This should be implemented in the main app
        if (window.showToast) {
            window.showToast(type, message);
        } else {
            console.log(`[${type}] ${message}`);
        }
    },
    
    handleError(error) {
        const message = error.message || 'An unexpected error occurred';
        this.showToast('error', message);
        console.error('API Error:', error);
    }
};
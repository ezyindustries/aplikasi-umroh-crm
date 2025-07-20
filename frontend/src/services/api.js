import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getProfile: () => 
    api.get('/auth/profile'),
  
  updateProfile: (data) => 
    api.put('/auth/profile', data),
  
  changePassword: (data) => 
    api.put('/auth/change-password', data),
  
  verifyToken: () => 
    api.get('/auth/verify-token'),
};

// Jamaah API
export const jamaahAPI = {
  getAll: (params) => 
    api.get('/jamaah', { params }),
  
  getById: (id) => 
    api.get(`/jamaah/${id}`),
  
  create: (data) => 
    api.post('/jamaah', data),
  
  update: (id, data) => 
    api.put(`/jamaah/${id}`, data),
  
  updateStatus: (id, data) => 
    api.patch(`/jamaah/${id}/status`, data),
  
  bulkUpdate: (data) => 
    api.patch('/jamaah/bulk-update', data),
  
  delete: (id) => 
    api.delete(`/jamaah/${id}`),
  
  getStatistics: () => 
    api.get('/jamaah/statistics'),
  
  checkNik: (nik) => 
    api.get(`/jamaah/check-nik/${nik}`),
  
  checkPassport: (passportNumber) => 
    api.get(`/jamaah/check-passport/${passportNumber}`),
};

// Users API
export const usersAPI = {
  getAll: (params) => 
    api.get('/users', { params }),
  
  getById: (id) => 
    api.get(`/users/${id}`),
  
  create: (data) => 
    api.post('/users', data),
  
  update: (id, data) => 
    api.put(`/users/${id}`, data),
  
  getStatistics: () => 
    api.get('/users/statistics/overview'),
};

// Packages API
export const packagesAPI = {
  getAll: (params) => 
    api.get('/packages', { params }),
  
  getById: (id) => 
    api.get(`/packages/${id}`),
  
  create: (data) => 
    api.post('/packages', data),
  
  update: (id, data) => 
    api.put(`/packages/${id}`, data),
  
  delete: (id) => 
    api.delete(`/packages/${id}`),
};

// Payments API
export const paymentsAPI = {
  getAll: (params) => 
    api.get('/payments', { params }),
  
  getByJamaah: (jamaahId) => 
    api.get(`/payments/jamaah/${jamaahId}`),
  
  create: (data) => 
    api.post('/payments', data),
  
  update: (id, data) => 
    api.put(`/payments/${id}`, data),
  
  delete: (id) => 
    api.delete(`/payments/${id}`),
};

// Documents API
export const documentsAPI = {
  getAll: (params) => 
    api.get('/documents', { params }),
  
  getByJamaah: (jamaahId) => 
    api.get(`/documents/jamaah/${jamaahId}`),
  
  upload: (formData) => 
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  delete: (id) => 
    api.delete(`/documents/${id}`),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => 
    api.get('/reports/dashboard'),
  
  exportJamaah: (params) => 
    api.get('/reports/export/jamaah', { params }),
  
  exportPayments: (params) => 
    api.get('/reports/export/payments', { params }),
};

// Family API
export const familyAPI = {
  getAll: (params) => 
    api.get('/family', { params }),
  
  getById: (id) => 
    api.get(`/family/${id}`),
  
  getByJamaah: (jamaahId) => 
    api.get(`/family/jamaah/${jamaahId}`),
  
  getFamilyTree: (jamaahId) => 
    api.get(`/family/jamaah/${jamaahId}/tree`),
  
  getMahramRelations: (jamaahId) => 
    api.get(`/family/jamaah/${jamaahId}/mahram`),
  
  checkMahram: (jamaahId1, jamaahId2) => 
    api.get(`/family/check-mahram/${jamaahId1}/${jamaahId2}`),
  
  getStatistics: () => 
    api.get('/family/statistics'),
  
  getRelationTypes: () => 
    api.get('/family/relation-types'),
  
  getJamaahWithoutFamily: () => 
    api.get('/family/without-family'),
  
  getFamilies: () => 
    api.get('/family/families'),
  
  create: (data) => 
    api.post('/family', data),
  
  bulkCreate: (data) => 
    api.post('/family/bulk-create', data),
  
  validateGroupMahram: (data) => 
    api.post('/family/validate-group-mahram', data),
  
  update: (id, data) => 
    api.put(`/family/${id}`, data),
  
  delete: (id) => 
    api.delete(`/family/${id}`)
};

// Groups API
export const groupAPI = {
  getAll: (params) => 
    api.get('/groups', { params }),
  
  getById: (id) => 
    api.get(`/groups/${id}`),
  
  getStatistics: () => 
    api.get('/groups/statistics'),
  
  getAvailableJamaah: (packageId) => 
    api.get('/groups/available-jamaah', { params: { package_id: packageId } }),
  
  generateManifest: (id) => 
    api.get(`/groups/${id}/manifest`),
  
  create: (data) => 
    api.post('/groups', data),
  
  update: (id, data) => 
    api.put(`/groups/${id}`, data),
  
  delete: (id) => 
    api.delete(`/groups/${id}`),
  
  addMember: (groupId, data) => 
    api.post(`/groups/${groupId}/members`, data),
  
  removeMember: (groupId, jamaahId) => 
    api.delete(`/groups/${groupId}/members/${jamaahId}`),
  
  updateMember: (groupId, jamaahId, data) => 
    api.put(`/groups/${groupId}/members/${jamaahId}`, data),
  
  bulkAddMembers: (groupId, jamaahIds) => 
    api.post(`/groups/${groupId}/members/bulk`, { jamaah_ids: jamaahIds }),
  
  autoAssign: (data) => 
    api.post('/groups/auto-assign', data)
};

// Backup API
export const backupAPI = {
  getStatistics: () => 
    api.get('/backup/statistics'),
  
  getHistory: (limit) => 
    api.get('/backup/history', { params: { limit } }),
  
  getAvailableBackups: () => 
    api.get('/backup/files'),
  
  createBackup: (data) => 
    api.post('/backup/create', data),
  
  restoreDatabase: (data) => 
    api.post('/backup/restore', data),
  
  deleteBackup: (filename) => 
    api.delete(`/backup/files/${filename}`),
  
  testBackup: () => 
    api.post('/backup/test')
};

export default api;
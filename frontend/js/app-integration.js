/**
 * App Integration - Connects frontend demo with backend API
 * This file bridges the demo HTML with real backend functionality
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing App Integration...');
    
    // Initialize app based on authentication status
    if (API.TokenManager.isAuthenticated()) {
        initializeAuthenticatedApp();
    } else {
        showLoginScreen();
    }
});

// Login Handler
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginButton = document.querySelector('.login-btn');
    const loginError = document.querySelector('.login-error');
    
    // Show loading state
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="material-icons spin">refresh</span> Logging in...';
    if (loginError) loginError.style.display = 'none';
    
    try {
        const response = await API.AuthService.login(username, password);
        
        if (response.success) {
            // Store user data
            const userData = response.data.user;
            
            // Update UI with user info
            updateUserInterface(userData);
            
            // Show main app
            showDashboard();
            
            // Load initial data
            loadDashboardData();
            
            API.showToast('success', 'Login berhasil!');
        }
    } catch (error) {
        // Show error message
        if (loginError) {
            loginError.textContent = error.message || 'Login gagal. Silakan coba lagi.';
            loginError.style.display = 'block';
        }
        API.showToast('error', error.message || 'Login gagal');
    } finally {
        // Reset button state
        loginButton.disabled = false;
        loginButton.innerHTML = '<span class="material-icons">login</span> Login';
    }
}

// Logout Handler
async function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        try {
            await API.AuthService.logout();
        } catch (error) {
            // Logout will redirect anyway
            console.error('Logout error:', error);
        }
    }
}

// Initialize authenticated app
function initializeAuthenticatedApp() {
    const user = API.TokenManager.getUser();
    if (user) {
        updateUserInterface(user);
        showDashboard();
        loadDashboardData();
    } else {
        // If no user data, re-authenticate
        API.TokenManager.removeToken();
        showLoginScreen();
    }
}

// Update user interface with user data
function updateUserInterface(userData) {
    // Update user name in header
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = userData.full_name || userData.username;
    });
    
    // Update user role
    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(el => {
        el.textContent = userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User';
    });
    
    // Update avatar initials
    const avatarElements = document.querySelectorAll('.avatar-initials');
    avatarElements.forEach(el => {
        const initials = userData.full_name ? 
            userData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 
            userData.username[0].toUpperCase();
        el.textContent = initials;
    });
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load dashboard statistics
        const dashboardData = await API.ReportService.getDashboard();
        updateDashboardStats(dashboardData.data);
        
        // Load recent activities
        const activities = await API.ActivityService.getRecent(5);
        updateRecentActivities(activities.data);
        
        // Load chart data
        updateCharts(dashboardData.data);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        API.handleError(error);
    }
}

// Update dashboard statistics
function updateDashboardStats(data) {
    // Update stat cards
    const stats = {
        'total-jamaah': data.totalJamaah || 0,
        'active-packages': data.activePackages || 0,
        'monthly-revenue': formatCurrency(data.monthlyRevenue || 0),
        'pending-payments': data.pendingPayments || 0
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Update recent activities
function updateRecentActivities(activities) {
    const container = document.querySelector('.recent-activities-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (activities && activities.length > 0) {
        activities.forEach(activity => {
            const activityItem = createActivityItem(activity);
            container.appendChild(activityItem);
        });
    } else {
        container.innerHTML = '<p class="no-data">Belum ada aktivitas</p>';
    }
}

// Create activity item element
function createActivityItem(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    
    const icon = getActivityIcon(activity.type);
    const time = formatRelativeTime(activity.created_at);
    
    div.innerHTML = `
        <div class="activity-icon ${activity.type}">
            <span class="material-icons">${icon}</span>
        </div>
        <div class="activity-content">
            <p class="activity-text">${activity.description}</p>
            <span class="activity-time">${time}</span>
        </div>
    `;
    
    return div;
}

// Load Jamaah data
async function loadJamaahData(page = 1, search = '') {
    try {
        showLoadingState('jamaah-table-body');
        
        const params = {
            page,
            limit: 10,
            search
        };
        
        const response = await API.JamaahService.getAll(params);
        
        if (response.success) {
            updateJamaahTable(response.data.items);
            updatePagination('jamaah', response.data.pagination);
        }
    } catch (error) {
        console.error('Error loading jamaah data:', error);
        showErrorState('jamaah-table-body', error.message);
    }
}

// Update Jamaah table
function updateJamaahTable(jamaahList) {
    const tbody = document.getElementById('jamaah-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (jamaahList && jamaahList.length > 0) {
        jamaahList.forEach((jamaah, index) => {
            const row = createJamaahRow(jamaah, index);
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Tidak ada data jamaah</td>
            </tr>
        `;
    }
}

// Create Jamaah table row
function createJamaahRow(jamaah, index) {
    const tr = document.createElement('tr');
    
    const statusClass = jamaah.status === 'active' ? 'badge-success' : 'badge-warning';
    const statusText = jamaah.status === 'active' ? 'Aktif' : 'Pending';
    
    tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${jamaah.registration_number || '-'}</td>
        <td>
            <div class="jamaah-info">
                <div class="name">${jamaah.full_name}</div>
                <div class="email">${jamaah.email || '-'}</div>
            </div>
        </td>
        <td>${jamaah.nik}</td>
        <td>${jamaah.phone || '-'}</td>
        <td>${jamaah.package_name || '-'}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>
            <div class="action-buttons">
                <button onclick="viewJamaah('${jamaah.id}')" class="btn-icon" title="View">
                    <span class="material-icons">visibility</span>
                </button>
                <button onclick="editJamaah('${jamaah.id}')" class="btn-icon" title="Edit">
                    <span class="material-icons">edit</span>
                </button>
                <button onclick="deleteJamaah('${jamaah.id}')" class="btn-icon btn-danger" title="Delete">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

// Handle Jamaah form submission
async function handleJamaahSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Convert FormData to object
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-icons spin">refresh</span> Menyimpan...';
    
    try {
        let response;
        if (data.id) {
            // Update existing
            response = await API.JamaahService.update(data.id, data);
        } else {
            // Create new
            response = await API.JamaahService.create(data);
        }
        
        if (response.success) {
            API.showToast('success', 'Data jamaah berhasil disimpan!');
            closeModal('addJamaahModal');
            form.reset();
            loadJamaahData(); // Reload table
        }
    } catch (error) {
        API.handleError(error);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons">save</span> Simpan';
    }
}

// Delete Jamaah
async function deleteJamaah(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data jamaah ini?')) {
        return;
    }
    
    try {
        const response = await API.JamaahService.delete(id);
        
        if (response.success) {
            API.showToast('success', 'Data jamaah berhasil dihapus');
            loadJamaahData(); // Reload table
        }
    } catch (error) {
        API.handleError(error);
    }
}

// Handle Excel import
async function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const importButton = document.querySelector('.import-button');
    importButton.disabled = true;
    importButton.innerHTML = '<span class="material-icons spin">refresh</span> Mengimport...';
    
    try {
        const response = await API.JamaahService.importExcel(file);
        
        if (response.success) {
            API.showToast('success', `${response.data.imported} data berhasil diimport`);
            loadJamaahData(); // Reload table
        }
    } catch (error) {
        API.handleError(error);
    } finally {
        importButton.disabled = false;
        importButton.innerHTML = '<span class="material-icons">upload</span> Import Excel';
        event.target.value = ''; // Clear file input
    }
}

// Handle Excel export
async function handleExcelExport() {
    const exportButton = document.querySelector('.export-button');
    exportButton.disabled = true;
    exportButton.innerHTML = '<span class="material-icons spin">refresh</span> Mengexport...';
    
    try {
        await API.JamaahService.exportExcel();
        API.showToast('success', 'Data berhasil diexport');
    } catch (error) {
        API.handleError(error);
    } finally {
        exportButton.disabled = false;
        exportButton.innerHTML = '<span class="material-icons">download</span> Export Excel';
    }
}

// Utility Functions
function showLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <span class="material-icons spin">refresh</span> Loading...
                </td>
            </tr>
        `;
    }
}

function showErrorState(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    <span class="material-icons">error</span> ${message}
                </td>
            </tr>
        `;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
}

function getActivityIcon(type) {
    const icons = {
        'create': 'add_circle',
        'update': 'edit',
        'delete': 'delete',
        'login': 'login',
        'logout': 'logout',
        'export': 'download',
        'import': 'upload'
    };
    return icons[type] || 'info';
}

// Attach to window for global access
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.loadJamaahData = loadJamaahData;
window.handleJamaahSubmit = handleJamaahSubmit;
window.deleteJamaah = deleteJamaah;
window.handleExcelImport = handleExcelImport;
window.handleExcelExport = handleExcelExport;

// Initialize search functionality
document.addEventListener('DOMContentLoaded', function() {
    // Jamaah search
    const jamaahSearch = document.getElementById('jamaah-search');
    if (jamaahSearch) {
        let searchTimer;
        jamaahSearch.addEventListener('input', function(e) {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                loadJamaahData(1, e.target.value);
            }, 500);
        });
    }
    
    // Add other search handlers here
});
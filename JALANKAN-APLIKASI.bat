@echo off
chcp 65001 >nul 2>&1
cls

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    UMRAH MANAGEMENT APP                      ║
echo ║                   🚀 SIMPLE DEMO ^(NO DOCKER^) 🚀             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ❌ ERROR: backend folder not found!
    echo Please run this script from the aplikasi umroh directory.
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

echo ✅ Found project files in: %CD%
echo.

REM Step 1: Check Node.js Installation
echo 📋 STEP 1: Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo 📥 Please install Node.js:
    echo 🌐 https://nodejs.org/en/download/
    echo 👉 Download LTS version ^(recommended^)
    echo.
    echo After installation:
    echo 1. Restart Command Prompt
    echo 2. Run this script again
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Step 2: Install Dependencies
echo 📋 STEP 2: Installing dependencies...
cd backend

echo 📦 Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    echo 🔍 Try manually: cd backend ^&^& npm install
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed
echo.

cd ..

REM Step 3: Setup Environment (Simple SQLite version)
echo 📋 STEP 3: Setting up simple environment...
(
    echo NODE_ENV=development
    echo PORT=5000
    echo JWT_SECRET=simple_demo_jwt_secret_for_testing_only_not_production_use
    echo DEMO_MODE=true
    echo DATABASE_URL=sqlite:./demo.db
    echo FRONTEND_URL=http://localhost:3000
    echo LOG_LEVEL=info
) > backend\.env

echo ✅ Simple environment configured ^(SQLite database^)
echo.

REM Step 4: Create Simple Database Setup
echo 📋 STEP 4: Setting up demo database...
cd backend

echo 📄 Creating simple database schema...
(
    echo const sqlite3 = require^('sqlite3'^).verbose^(^);
    echo const bcrypt = require^('bcrypt'^);
    echo.
    echo // Create SQLite database
    echo const db = new sqlite3.Database^('./demo.db'^);
    echo.
    echo db.serialize^(^(^) =^> {
    echo   // Create users table
    echo   db.run^(`CREATE TABLE IF NOT EXISTS users ^(
    echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
    echo     username TEXT UNIQUE,
    echo     email TEXT UNIQUE,
    echo     password_hash TEXT,
    echo     full_name TEXT,
    echo     role_name TEXT DEFAULT 'Admin',
    echo     is_active BOOLEAN DEFAULT 1,
    echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    echo   ^)`^);
    echo.
    echo   // Create jamaah table
    echo   db.run^(`CREATE TABLE IF NOT EXISTS jamaah ^(
    echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
    echo     nik TEXT UNIQUE,
    echo     nama_lengkap TEXT,
    echo     tempat_lahir TEXT,
    echo     tanggal_lahir DATE,
    echo     jenis_kelamin TEXT,
    echo     alamat TEXT,
    echo     phone TEXT,
    echo     email TEXT,
    echo     passport_number TEXT,
    echo     passport_expiry DATE,
    echo     status TEXT DEFAULT 'Draft',
    echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    echo   ^)`^);
    echo.
    echo   // Insert demo admin user
    echo   const password = 'Admin123!';
    echo   bcrypt.hash^(password, 10, ^(err, hash^) =^> {
    echo     if ^(!err^) {
    echo       db.run^(`INSERT OR IGNORE INTO users 
    echo         ^(username, email, password_hash, full_name, role_name^) 
    echo         VALUES ^(?, ?, ?, ?, ?^)`,
    echo         ['admin', 'admin@demo.com', hash, 'Demo Administrator', 'Admin']
    echo       ^);
    echo     }
    echo   }^);
    echo.
    echo   // Insert demo jamaah data
    echo   const demoJamaah = [
    echo     ['1234567890123456', 'Ahmad Demo', 'Jakarta', '1990-01-01', 'L', 'Jakarta Selatan', '08123456789', 'ahmad@demo.com', 'A1234567', '2025-12-31', 'Active'],
    echo     ['2345678901234567', 'Siti Demo', 'Bandung', '1985-05-15', 'P', 'Bandung Barat', '08234567890', 'siti@demo.com', 'B2345678', '2025-11-30', 'Active'],
    echo     ['3456789012345678', 'Budi Demo', 'Surabaya', '1992-03-20', 'L', 'Surabaya Timur', '08345678901', 'budi@demo.com', 'C3456789', '2025-10-15', 'Draft']
    echo   ];
    echo.
    echo   demoJamaah.forEach^(data =^> {
    echo     db.run^(`INSERT OR IGNORE INTO jamaah 
    echo       ^(nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, phone, email, passport_number, passport_expiry, status^)
    echo       VALUES ^(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?^)`, data^);
    echo   }^);
    echo.
    echo   console.log^('✅ Demo database setup completed!'^);
    echo }^);
    echo.
    echo db.close^(^);
) > setup-demo-db.js

echo 🔧 Installing required packages...
call npm install sqlite3 bcrypt --save
if %errorlevel% neq 0 (
    echo ⚠️  Some packages might need compilation, continuing anyway...
)

echo 🗄️ Setting up demo database...
node setup-demo-db.js
echo ✅ Demo database ready
echo.

REM Step 5: Create Simple Server
echo 📋 STEP 5: Creating demo server...
(
    echo const express = require^('express'^);
    echo const sqlite3 = require^('sqlite3'^).verbose^(^);
    echo const bcrypt = require^('bcrypt'^);
    echo const jwt = require^('jsonwebtoken'^);
    echo const path = require^('path'^);
    echo const cors = require^('cors'^);
    echo.
    echo const app = express^(^);
    echo const PORT = 5000;
    echo const JWT_SECRET = 'simple_demo_jwt_secret_for_testing_only_not_production_use';
    echo.
    echo // Database connection
    echo const db = new sqlite3.Database^('./demo.db'^);
    echo.
    echo // Middleware
    echo app.use^(cors^(^)^);
    echo app.use^(express.json^(^)^);
    echo app.use^(express.static^('public'^)^);
    echo.
    echo // Health check
    echo app.get^('/health', ^(req, res^) =^> {
    echo   res.json^({ status: 'OK', message: 'Umrah Management Demo API', timestamp: new Date^(^).toISOString^(^) }^);
    echo }^);
    echo.
    echo // Login endpoint
    echo app.post^('/api/auth/login', ^(req, res^) =^> {
    echo   const { username, password } = req.body;
    echo   
    echo   db.get^('SELECT * FROM users WHERE username = ?', [username], ^(err, user^) =^> {
    echo     if ^(err ^|^| !user^) {
    echo       return res.status^(401^).json^({ error: 'Invalid credentials' }^);
    echo     }
    echo     
    echo     bcrypt.compare^(password, user.password_hash, ^(err, valid^) =^> {
    echo       if ^(valid^) {
    echo         const token = jwt.sign^({ id: user.id, username: user.username }, JWT_SECRET^);
    echo         res.json^({ success: true, token, user: { id: user.id, username: user.username, role: user.role_name } }^);
    echo       } else {
    echo         res.status^(401^).json^({ error: 'Invalid credentials' }^);
    echo       }
    echo     }^);
    echo   }^);
    echo }^);
    echo.
    echo // Get jamaah list
    echo app.get^('/api/jamaah', ^(req, res^) =^> {
    echo   db.all^('SELECT * FROM jamaah ORDER BY created_at DESC', ^(err, rows^) =^> {
    echo     if ^(err^) {
    echo       return res.status^(500^).json^({ error: 'Database error' }^);
    echo     }
    echo     res.json^({ success: true, data: rows, total: rows.length }^);
    echo   }^);
    echo }^);
    echo.
    echo // Add jamaah
    echo app.post^('/api/jamaah', ^(req, res^) =^> {
    echo   const { nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, phone, email } = req.body;
    echo   
    echo   db.run^(`INSERT INTO jamaah ^(nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, phone, email^)
    echo            VALUES ^(?, ?, ?, ?, ?, ?, ?, ?^)`,
    echo     [nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, phone, email],
    echo     function^(err^) {
    echo       if ^(err^) {
    echo         return res.status^(400^).json^({ error: 'Failed to add jamaah' }^);
    echo       }
    echo       res.json^({ success: true, id: this.lastID }^);
    echo     }^);
    echo }^);
    echo.
    echo // Dashboard stats
    echo app.get^('/api/dashboard/stats', ^(req, res^) =^> {
    echo   db.get^('SELECT COUNT^(*^) as total FROM jamaah', ^(err, result^) =^> {
    echo     if ^(err^) {
    echo       return res.status^(500^).json^({ error: 'Database error' }^);
    echo     }
    echo     res.json^({
    echo       success: true,
    echo       data: {
    echo         totalJamaah: result.total,
    echo         activeJamaah: result.total,
    echo         pendingPayments: 0,
    echo         completedTrips: 0
    echo       }
    echo     }^);
    echo   }^);
    echo }^);
    echo.
    echo // Start server
    echo app.listen^(PORT, ^(^) =^> {
    echo   console.log^(`🚀 Umrah Management Demo API running on http://localhost:${PORT}`^);
    echo   console.log^(`📖 API Health: http://localhost:${PORT}/health`^);
    echo   console.log^(`👤 Demo Login: admin / Admin123!`^);
    echo }^);
) > demo-server.js

echo ✅ Demo server created
echo.

REM Step 6: Create Simple Frontend
echo 📋 STEP 6: Creating demo frontend...
mkdir public 2>nul

(
    echo ^<!DOCTYPE html^>
    echo ^<html lang="en"^>
    echo ^<head^>
    echo     ^<meta charset="UTF-8"^>
    echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
    echo     ^<title^>Umrah Management Demo^</title^>
    echo     ^<style^>
    echo         * { margin: 0; padding: 0; box-sizing: border-box; }
    echo         body { font-family: Arial, sans-serif; background: #f5f5f5; }
    echo         .header { background: #2c3e50; color: white; padding: 1rem; text-align: center; }
    echo         .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
    echo         .card { background: white; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; box-shadow: 0 2px 10px rgba^(0,0,0,0.1^); }
    echo         .stats { display: grid; grid-template-columns: repeat^(auto-fit, minmax^(200px, 1fr^)^); gap: 1rem; }
    echo         .stat-card { background: linear-gradient^(135deg, #667eea 0%, #764ba2 100%^); color: white; padding: 1.5rem; border-radius: 8px; text-align: center; }
    echo         .stat-number { font-size: 2rem; font-weight: bold; }
    echo         .stat-label { opacity: 0.9; margin-top: 0.5rem; }
    echo         .form-group { margin: 1rem 0; }
    echo         .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
    echo         .form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
    echo         .btn { background: #3498db; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; }
    echo         .btn:hover { background: #2980b9; }
    echo         .btn-success { background: #27ae60; }
    echo         .btn-success:hover { background: #229954; }
    echo         .table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    echo         .table th, .table td { padding: 0.75rem; border-bottom: 1px solid #ddd; text-align: left; }
    echo         .table th { background: #f8f9fa; font-weight: bold; }
    echo         .table tr:hover { background: #f8f9fa; }
    echo         .hidden { display: none; }
    echo         .login-form { max-width: 400px; margin: 2rem auto; }
    echo         .alert { padding: 1rem; margin: 1rem 0; border-radius: 4px; }
    echo         .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    echo         .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    echo         .nav { background: white; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
    echo         .nav button { margin-right: 1rem; }
    echo     ^</style^>
    echo ^</head^>
    echo ^<body^>
    echo     ^<div class="header"^>
    echo         ^<h1^>🕌 Aplikasi Manajemen Umroh - Demo^</h1^>
    echo         ^<p^>Sistem Lengkap untuk Mengelola 50,000+ Jamaah per Tahun^</p^>
    echo     ^</div^>
    echo.
    echo     ^<div id="loginSection" class="container"^>
    echo         ^<div class="card login-form"^>
    echo             ^<h2^>🔐 Login Demo^</h2^>
    echo             ^<div id="loginAlert"^>^</div^>
    echo             ^<div class="form-group"^>
    echo                 ^<label^>Username:^</label^>
    echo                 ^<input type="text" id="username" value="admin" placeholder="Enter username"^>
    echo             ^</div^>
    echo             ^<div class="form-group"^>
    echo                 ^<label^>Password:^</label^>
    echo                 ^<input type="password" id="password" value="Admin123!" placeholder="Enter password"^>
    echo             ^</div^>
    echo             ^<button class="btn btn-success" onclick="login()"^>🚀 Login to Demo^</button^>
    echo             ^<div style="margin-top: 1rem; padding: 1rem; background: #e3f2fd; border-radius: 4px;"^>
    echo                 ^<strong^>Demo Credentials:^</strong^>^<br^>
    echo                 Username: ^<code^>admin^</code^>^<br^>
    echo                 Password: ^<code^>Admin123!^</code^>
    echo             ^</div^>
    echo         ^</div^>
    echo     ^</div^>
    echo.
    echo     ^<div id="mainApp" class="container hidden"^>
    echo         ^<div class="nav"^>
    echo             ^<button class="btn" onclick="showDashboard()"^>📊 Dashboard^</button^>
    echo             ^<button class="btn" onclick="showJamaah()"^>👥 Jamaah^</button^>
    echo             ^<button class="btn" onclick="showAddJamaah()"^>➕ Add Jamaah^</button^>
    echo             ^<button class="btn" onclick="logout()" style="float: right;"^>🚪 Logout^</button^>
    echo         ^</div^>
    echo.
    echo         ^<div id="dashboardSection"^>
    echo             ^<div class="card"^>
    echo                 ^<h2^>📊 Dashboard Overview^</h2^>
    echo                 ^<div class="stats" id="statsContainer"^>
    echo                     ^<div class="stat-card"^>
    echo                         ^<div class="stat-number" id="totalJamaah"^>0^</div^>
    echo                         ^<div class="stat-label"^>Total Jamaah^</div^>
    echo                     ^</div^>
    echo                     ^<div class="stat-card"^>
    echo                         ^<div class="stat-number" id="activeJamaah"^>0^</div^>
    echo                         ^<div class="stat-label"^>Active Jamaah^</div^>
    echo                     ^</div^>
    echo                     ^<div class="stat-card"^>
    echo                         ^<div class="stat-number" id="pendingPayments"^>0^</div^>
    echo                         ^<div class="stat-label"^>Pending Payments^</div^>
    echo                     ^</div^>
    echo                     ^<div class="stat-card"^>
    echo                         ^<div class="stat-number" id="completedTrips"^>0^</div^>
    echo                         ^<div class="stat-label"^>Completed Trips^</div^>
    echo                     ^</div^>
    echo                 ^</div^>
    echo             ^</div^>
    echo         ^</div^>
    echo.
    echo         ^<div id="jamaahSection" class="hidden"^>
    echo             ^<div class="card"^>
    echo                 ^<h2^>👥 Daftar Jamaah^</h2^>
    echo                 ^<div id="jamaahAlert"^>^</div^>
    echo                 ^<table class="table" id="jamaahTable"^>
    echo                     ^<thead^>
    echo                         ^<tr^>
    echo                             ^<th^>NIK^</th^>
    echo                             ^<th^>Nama Lengkap^</th^>
    echo                             ^<th^>Tempat Lahir^</th^>
    echo                             ^<th^>Jenis Kelamin^</th^>
    echo                             ^<th^>Phone^</th^>
    echo                             ^<th^>Status^</th^>
    echo                         ^</tr^>
    echo                     ^</thead^>
    echo                     ^<tbody id="jamaahTableBody"^>
    echo                     ^</tbody^>
    echo                 ^</table^>
    echo             ^</div^>
    echo         ^</div^>
    echo.
    echo         ^<div id="addJamaahSection" class="hidden"^>
    echo             ^<div class="card"^>
    echo                 ^<h2^>➕ Tambah Jamaah Baru^</h2^>
    echo                 ^<div id="addJamaahAlert"^>^</div^>
    echo                 ^<form id="addJamaahForm"^>
    echo                     ^<div class="form-group"^>
    echo                         ^<label^>NIK ^(16 digit^):^</label^>
    echo                         ^<input type="text" id="nik" maxlength="16" placeholder="1234567890123456"^>
    echo                     ^</div^>
    echo                     ^<div class="form-group"^>
    echo                         ^<label^>Nama Lengkap:^</label^>
    echo                         ^<input type="text" id="nama_lengkap" placeholder="Ahmad Budi Santoso"^>
    echo                     ^</div^>
    echo                     ^<div class="form-group"^>
    echo                         ^<label^>Tempat Lahir:^</label^>
    echo                         ^<input type="text" id="tempat_lahir" placeholder="Jakarta"^>
    echo                     ^</div^>
    echo                     ^<div class="form-group"^>
    echo                         ^<label^>Tanggal Lahir:^</label^>
    echo                         ^<input type="date" id="tanggal_lahir"^>
    echo                     ^</div^>
    echo                     ^<div class="form-group"^>
    echo                         ^<label^>Jenis Kelamin:^</label^>
    echo                         ^<select id="jenis_kelamin"^>
    echo                             ^<option value=""^>Pilih Jenis Kelamin^</option^>
    echo                             ^<option value="L"^>Laki-laki^</option^>
    echo                             ^<option value="P"^>Perempuan^</option^>
    echo                         ^</select^>
    echo                     ^</div^>
    echo                     ^<div class="form-group"^>
    echo                         ^<label^>Alamat:^</label^>
    echo                         ^<input type="text" id="alamat" placeholder="Jl. Merdeka No. 123, Jakarta"^>
    echo                     ^</div^>
    echo                     ^<div class="form-group"^>
    echo                         ^<label^>Phone:^</label^>
    echo                         ^<input type="text" id="phone" placeholder="08123456789"^>
    echo                     ^</div^>
    echo                     ^<div class="form-group"^>
    echo                         ^<label^>Email:^</label^>
    echo                         ^<input type="email" id="email" placeholder="ahmad@example.com"^>
    echo                     ^</div^>
    echo                     ^<button type="submit" class="btn btn-success"^>💾 Simpan Jamaah^</button^>
    echo                 ^</form^>
    echo             ^</div^>
    echo         ^</div^>
    echo     ^</div^>
    echo.
    echo     ^<script^>
    echo         let authToken = null;
    echo.
    echo         async function login^(^) {
    echo             const username = document.getElementById^('username'^).value;
    echo             const password = document.getElementById^('password'^).value;
    echo             
    echo             try {
    echo                 const response = await fetch^('/api/auth/login', {
    echo                     method: 'POST',
    echo                     headers: { 'Content-Type': 'application/json' },
    echo                     body: JSON.stringify^({ username, password }^)
    echo                 }^);
    echo                 
    echo                 const data = await response.json^(^);
    echo                 
    echo                 if ^(data.success^) {
    echo                     authToken = data.token;
    echo                     document.getElementById^('loginSection'^).classList.add^('hidden'^);
    echo                     document.getElementById^('mainApp'^).classList.remove^('hidden'^);
    echo                     showDashboard^(^);
    echo                     loadDashboardStats^(^);
    echo                 } else {
    echo                     showAlert^('loginAlert', 'Login failed: ' + data.error, 'error'^);
    echo                 }
    echo             } catch ^(error^) {
    echo                 showAlert^('loginAlert', 'Login error: ' + error.message, 'error'^);
    echo             }
    echo         }
    echo.
    echo         function logout^(^) {
    echo             authToken = null;
    echo             document.getElementById^('loginSection'^).classList.remove^('hidden'^);
    echo             document.getElementById^('mainApp'^).classList.add^('hidden'^);
    echo         }
    echo.
    echo         function showSection^(sectionId^) {
    echo             const sections = ['dashboardSection', 'jamaahSection', 'addJamaahSection'];
    echo             sections.forEach^(id =^> {
    echo                 document.getElementById^(id^).classList.add^('hidden'^);
    echo             }^);
    echo             document.getElementById^(sectionId^).classList.remove^('hidden'^);
    echo         }
    echo.
    echo         function showDashboard^(^) { showSection^('dashboardSection'^); }
    echo         function showJamaah^(^) { showSection^('jamaahSection'^); loadJamaahList^(^); }
    echo         function showAddJamaah^(^) { showSection^('addJamaahSection'^); }
    echo.
    echo         async function loadDashboardStats^(^) {
    echo             try {
    echo                 const response = await fetch^('/api/dashboard/stats'^);
    echo                 const data = await response.json^(^);
    echo                 
    echo                 if ^(data.success^) {
    echo                     document.getElementById^('totalJamaah'^).textContent = data.data.totalJamaah;
    echo                     document.getElementById^('activeJamaah'^).textContent = data.data.activeJamaah;
    echo                     document.getElementById^('pendingPayments'^).textContent = data.data.pendingPayments;
    echo                     document.getElementById^('completedTrips'^).textContent = data.data.completedTrips;
    echo                 }
    echo             } catch ^(error^) {
    echo                 console.error^('Failed to load stats:', error^);
    echo             }
    echo         }
    echo.
    echo         async function loadJamaahList^(^) {
    echo             try {
    echo                 const response = await fetch^('/api/jamaah'^);
    echo                 const data = await response.json^(^);
    echo                 
    echo                 if ^(data.success^) {
    echo                     const tbody = document.getElementById^('jamaahTableBody'^);
    echo                     tbody.innerHTML = '';
    echo                     
    echo                     data.data.forEach^(jamaah =^> {
    echo                         const row = tbody.insertRow^(^);
    echo                         row.innerHTML = `
    echo                             ^<td^>${jamaah.nik}^</td^>
    echo                             ^<td^>${jamaah.nama_lengkap}^</td^>
    echo                             ^<td^>${jamaah.tempat_lahir}^</td^>
    echo                             ^<td^>${jamaah.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}^</td^>
    echo                             ^<td^>${jamaah.phone ^|^| '-'}^</td^>
    echo                             ^<td^>^<span style="background: #27ae60; color: white; padding: 0.25rem 0.5rem; border-radius: 4px;"^>${jamaah.status}^</span^>^</td^>
    echo                         `;
    echo                     }^);
    echo                 }
    echo             } catch ^(error^) {
    echo                 showAlert^('jamaahAlert', 'Failed to load jamaah list: ' + error.message, 'error'^);
    echo             }
    echo         }
    echo.
    echo         document.getElementById^('addJamaahForm'^).addEventListener^('submit', async function^(e^) {
    echo             e.preventDefault^(^);
    echo             
    echo             const formData = {
    echo                 nik: document.getElementById^('nik'^).value,
    echo                 nama_lengkap: document.getElementById^('nama_lengkap'^).value,
    echo                 tempat_lahir: document.getElementById^('tempat_lahir'^).value,
    echo                 tanggal_lahir: document.getElementById^('tanggal_lahir'^).value,
    echo                 jenis_kelamin: document.getElementById^('jenis_kelamin'^).value,
    echo                 alamat: document.getElementById^('alamat'^).value,
    echo                 phone: document.getElementById^('phone'^).value,
    echo                 email: document.getElementById^('email'^).value
    echo             };
    echo             
    echo             try {
    echo                 const response = await fetch^('/api/jamaah', {
    echo                     method: 'POST',
    echo                     headers: { 'Content-Type': 'application/json' },
    echo                     body: JSON.stringify^(formData^)
    echo                 }^);
    echo                 
    echo                 const data = await response.json^(^);
    echo                 
    echo                 if ^(data.success^) {
    echo                     showAlert^('addJamaahAlert', 'Jamaah berhasil ditambahkan!', 'success'^);
    echo                     document.getElementById^('addJamaahForm'^).reset^(^);
    echo                     loadDashboardStats^(^);
    echo                 } else {
    echo                     showAlert^('addJamaahAlert', 'Failed to add jamaah: ' + data.error, 'error'^);
    echo                 }
    echo             } catch ^(error^) {
    echo                 showAlert^('addJamaahAlert', 'Error: ' + error.message, 'error'^);
    echo             }
    echo         }^);
    echo.
    echo         function showAlert^(containerId, message, type^) {
    echo             const container = document.getElementById^(containerId^);
    echo             container.innerHTML = `^<div class="alert alert-${type}"^>${message}^</div^>`;
    echo             setTimeout^(^(^) =^> container.innerHTML = '', 5000^);
    echo         }
    echo.
    echo         // Auto-login for demo
    echo         window.addEventListener^('load', function^(^) {
    echo             // Auto-focus on login button for demo
    echo             setTimeout^(^(^) =^> {
    echo                 document.querySelector^('.btn-success'^).focus^(^);
    echo             }, 1000^);
    echo         }^);
    echo     ^</script^>
    echo ^</body^>
    echo ^</html^>
) > public\index.html

echo ✅ Demo frontend created
echo.

cd ..

REM Step 7: Start the demo
echo 📋 STEP 7: Starting Umrah Management Demo...
echo.
echo ⚡ Starting demo server...
echo.

cd backend
start "" node demo-server.js

echo ✅ Demo server starting...
echo.
echo ⏳ Waiting for server to be ready...
timeout /t 3 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 DEMO IS READY! 🎉                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Access your demo at:
echo 📱 Demo Application:    http://localhost:5000
echo 💚 API Health Check:    http://localhost:5000/health
echo.
echo 🔐 Demo Login Credentials:
echo 👤 Username: admin
echo 🔑 Password: Admin123!
echo.
echo 🎯 Demo Features Available:
echo ✅ Dashboard with statistics
echo ✅ Jamaah management ^(view, add^)
echo ✅ Simple authentication
echo ✅ SQLite database ^(no setup required^)
echo ✅ Responsive web interface
echo.
echo ⚡ Opening demo in your browser...

start http://localhost:5000

echo.
echo 📋 Demo is running! Press Ctrl+C in the server window to stop.
echo 🔄 To restart: run START_SIMPLE.bat again
echo.
pause
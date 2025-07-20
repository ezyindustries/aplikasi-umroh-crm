@echo off
echo ==========================================================
echo              SETUP DATABASE ONLY
echo ==========================================================
echo.

cd backend

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js tidak ditemukan. Silakan install Node.js terlebih dahulu.
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Gagal install dependencies
    pause
    exit /b 1
)

echo.
echo Initializing database...
node scripts/simple-init.js
if %errorlevel% neq 0 (
    echo ERROR: Gagal inisialisasi database
    echo.
    echo Mencoba metode alternatif...
    node -e "
    const sqlite3 = require('sqlite3').verbose();
    const bcrypt = require('bcryptjs');
    
    console.log('Creating database...');
    const db = new sqlite3.Database('./database.db');
    
    db.serialize(() => {
      db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, full_name TEXT, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT \"User\", is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
      
      bcrypt.hash('admin123', 10, (err, hash) => {
        if (err) throw err;
        db.run('INSERT OR IGNORE INTO users (username, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)', 
               ['admin', 'Administrator', 'admin@umroh.com', hash, 'Admin']);
        console.log('Admin user created: admin/admin123');
        db.close();
      });
    });
    "
)

echo.
echo ==========================================================
echo                 DATABASE SETUP SELESAI
echo ==========================================================
echo.
echo Login: admin / admin123
echo.
pause
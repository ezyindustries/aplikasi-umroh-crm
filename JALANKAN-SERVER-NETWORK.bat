@echo off
chcp 65001 >nul 2>&1
cls

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                 UMRAH APP - NETWORK SERVER                   ║
echo ║              🌐 Accessible from Local Network 🌐             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=*" %%b in ("%%a") do set LOCAL_IP=%%b
)

echo 📡 Your Local IP Address: %LOCAL_IP%
echo 🌐 Other computers can access at: http://%LOCAL_IP%:5000
echo.

REM Check if backend exists
if not exist "backend" (
    echo ❌ ERROR: backend folder not found!
    pause
    exit /b 1
)

echo ✅ Starting server for network access...
echo.

REM Setup environment for network access
cd backend
(
    echo NODE_ENV=production
    echo PORT=5000
    echo HOST=0.0.0.0
    echo JWT_SECRET=umrah_app_jwt_secret_2025_secure_key
    echo DATABASE_URL=sqlite:./database.db
    echo FRONTEND_URL=http://%LOCAL_IP%:5000
    echo CORS_ORIGIN=*
    echo LOG_LEVEL=info
) > .env

echo 📦 Installing dependencies...
call npm install --silent

echo.
echo 🚀 Starting network server...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    ACCESS INFORMATION                         ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║ From this computer:    http://localhost:5000                 ║
echo ║ From other computers:  http://%LOCAL_IP%:5000       ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║ Login Credentials:                                           ║
echo ║ Username: admin                                              ║
echo ║ Password: Admin123!                                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ⚠️  Make sure Windows Firewall allows Node.js connections!
echo 💡 Press Ctrl+C to stop the server
echo.

node server.js
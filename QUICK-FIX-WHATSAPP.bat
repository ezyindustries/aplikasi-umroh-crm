@echo off
echo ========================================
echo Quick Fix for WhatsApp Connection
echo ========================================
echo.

echo [1/4] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and make sure it's running.
    pause
    exit /b 1
)

echo [2/4] Starting WAHA WhatsApp API...
docker ps -a | findstr waha-umroh >nul 2>&1
if %errorlevel% equ 0 (
    echo Stopping existing WAHA container...
    docker stop waha-umroh >nul 2>&1
    docker rm waha-umroh >nul 2>&1
)

echo Creating new WAHA container...
docker run -d ^
    --name waha-umroh ^
    -p 3001:3000 ^
    -e WHATSAPP_HOOK_URL=http://host.docker.internal:5000/api/crm/webhook ^
    -e WHATSAPP_HOOK_EVENTS=* ^
    -e WHATSAPP_API_KEY=your-secret-api-key ^
    -e WHATSAPP_SESSIONS_ENABLED=true ^
    -v waha-data:/app/data ^
    devlikeapro/waha

timeout /t 5 >nul

echo [3/4] Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm start"
cd ..

timeout /t 5 >nul

echo [4/4] Testing connections...
echo.
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend server is running on port 5000
) else (
    echo ✗ Backend server is NOT running
)

curl -s http://localhost:3001/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ WAHA API is running on port 3001
) else (
    echo ✗ WAHA API is NOT running
)

echo.
echo ========================================
echo Fix applied! You can now:
echo 1. Open http://localhost:8080/crm-no-login.html
echo 2. Click "Connect to WhatsApp"
echo 3. Scan the QR code with your phone
echo ========================================
echo.
pause
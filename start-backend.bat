@echo off
echo ===============================================
echo    START BACKEND SERVER
echo    WhatsApp CRM Backend
echo ===============================================
echo.

:: Check Node.js installation
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

:: Check if backend directory exists
if not exist "%~dp0backend\whatsapp" (
    echo ERROR: Backend directory not found!
    echo Expected at: %~dp0backend\whatsapp
    pause
    exit /b 1
)

:: Kill existing process on port 3001
echo [2/5] Checking port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo Stopping existing process on port 3001 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

:: Navigate to backend directory
echo.
echo [3/5] Navigating to backend directory...
cd /d "%~dp0backend\whatsapp"

:: Check dependencies
echo.
echo [4/5] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

:: Check environment file
if not exist ".env" (
    echo Creating .env file...
    (
        echo # WhatsApp CRM Backend Configuration
        echo NODE_ENV=development
        echo PORT=3001
        echo.
        echo # WAHA Configuration
        echo WAHA_BASE_URL=http://localhost:3000
        echo WAHA_API_KEY=
        echo.
        echo # Database
        echo DATABASE_PATH=./data/whatsapp-crm.db
        echo.
        echo # Webhook URL for WAHA
        echo WEBHOOK_URL=http://localhost:3001/api/webhooks/waha
    ) > .env
    echo .env file created. Please update with your settings if needed.
)

:: Start backend server
echo.
echo [5/5] Starting backend server...
start "WhatsApp CRM Backend" cmd /k "npm start"

:: Wait for server to start
echo.
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Check backend health
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    BACKEND SERVER STARTED SUCCESSFULLY!
    echo ===============================================
    curl http://localhost:3001/api/health 2>nul
) else (
    echo.
    echo Backend might still be starting...
    echo Check the console window for details.
)

echo.
echo ===============================================
echo    BACKEND INFORMATION
echo ===============================================
echo.
echo Backend API: http://localhost:3001
echo Socket.IO: ws://localhost:3001
echo.
echo Main Endpoints:
echo - Health: http://localhost:3001/api/health
echo - Sessions: http://localhost:3001/api/sessions
echo - Conversations: http://localhost:3001/api/conversations
echo - Messages: http://localhost:3001/api/messages
echo - Contacts: http://localhost:3001/api/contacts
echo.
echo Dashboard Endpoints:
echo - Stats: http://localhost:3001/api/dashboard/stats
echo - Activity: http://localhost:3001/api/dashboard/activity
echo - Analytics: http://localhost:3001/api/dashboard/analytics
echo - Lead Sources: http://localhost:3001/api/dashboard/lead-sources
echo - AI Performance: http://localhost:3001/api/dashboard/ai-performance
echo.
echo WebSocket Events:
echo - message:new
echo - message:status
echo - conversation:update
echo - session:update
echo.
echo To stop the server, close the command window.
echo.
pause
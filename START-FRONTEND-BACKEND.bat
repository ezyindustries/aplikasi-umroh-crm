@echo off
echo ===============================================
echo    START FRONTEND & BACKEND
echo    WhatsApp CRM System
echo ===============================================
echo.

:: Check Node.js installation
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed.

:: Check Python installation for frontend server
echo.
echo [2/6] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Python is not installed!
    echo Will try alternative frontend server...
)

:: Start Backend
echo.
echo [3/6] Starting Backend Server...
cd /d "%~dp0backend\whatsapp"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

:: Start backend in new window
start "WhatsApp CRM Backend" cmd /k "npm start"

:: Wait for backend to initialize
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Check backend health
echo.
echo [4/6] Checking backend health...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend is running successfully!
) else (
    echo Backend might still be starting...
)

:: Start Frontend
echo.
echo [5/6] Starting Frontend Server...
cd /d "%~dp0frontend"

:: Try Python first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    start "WhatsApp CRM Frontend" cmd /k "python -m http.server 8080"
) else (
    :: Fallback to Node.js http-server
    echo Using Node.js http-server...
    npx http-server -p 8080 -c-1 >nul 2>&1
    if %errorlevel% neq 0 (
        echo Installing http-server...
        npm install -g http-server
        start "WhatsApp CRM Frontend" cmd /k "http-server -p 8080 -c-1"
    ) else (
        start "WhatsApp CRM Frontend" cmd /k "npx http-server -p 8080 -c-1"
    )
)

:: Wait a bit
timeout /t 3 /nobreak >nul

:: Open browser
echo.
echo [6/6] Opening browser...
start http://localhost:8080/crm-main.html

:: Show status
echo.
echo ===============================================
echo    SYSTEM STARTED SUCCESSFULLY!
echo ===============================================
echo.
echo Backend API: http://localhost:3001
echo Frontend: http://localhost:8080
echo.
echo Main Pages:
echo - CRM Dashboard: http://localhost:8080/crm-main.html
echo - Conversations: http://localhost:8080/conversations-beautiful.html
echo.
echo API Endpoints:
echo - Health: http://localhost:3001/api/health
echo - Sessions: http://localhost:3001/api/sessions
echo - Conversations: http://localhost:3001/api/conversations
echo - Messages: http://localhost:3001/api/messages
echo.
echo To stop servers, close the command windows.
echo.
pause
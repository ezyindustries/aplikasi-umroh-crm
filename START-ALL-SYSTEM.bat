@echo off
echo ===============================================
echo    START COMPLETE WHATSAPP CRM SYSTEM
echo    WAHA + Backend + Frontend
echo ===============================================
echo.

:: Check Docker
echo [1/8] Checking Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    if %errorlevel% neq 0 (
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe" 2>nul
    )
    
    echo Waiting for Docker to start (this may take a minute)...
    :WAIT_DOCKER
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto WAIT_DOCKER
)
echo Docker is running.

:: Check WAHA container
echo.
echo [2/8] Checking WAHA container...
docker ps --filter "name=whatsapp-http-api" --format "{{.Names}}" | findstr /i "whatsapp-http-api" >nul 2>&1
if %errorlevel% neq 0 (
    echo WAHA container not found. Creating...
    
    :: Create data directory
    if not exist "%~dp0waha-data" mkdir "%~dp0waha-data"
    
    :: Run WAHA
    docker run -d ^
      --name whatsapp-http-api ^
      --restart unless-stopped ^
      -p 3000:3000 ^
      -v "%~dp0waha-data:/app/data" ^
      -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
      -e WHATSAPP_HOOK_EVENTS=* ^
      -e WHATSAPP_API_KEY= ^
      -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
      devlikeapro/whatsapp-http-api:latest
) else (
    echo WAHA container exists. Starting if stopped...
    docker start whatsapp-http-api >nul 2>&1
)

:: Wait for WAHA
echo.
echo [3/8] Waiting for WAHA to be ready...
:WAIT_WAHA
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 goto WAIT_WAHA
echo WAHA is ready!

:: Kill existing backend
echo.
echo [4/8] Stopping existing backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul

:: Start Backend
echo.
echo [5/8] Starting Backend Server...
cd /d "%~dp0backend\whatsapp"
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)
start "WhatsApp CRM Backend" cmd /k "npm start"

:: Wait for backend
echo Waiting for backend to start...
:WAIT_BACKEND
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 goto WAIT_BACKEND
echo Backend is ready!

:: Kill existing frontend
echo.
echo [6/8] Stopping existing frontend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 1 /nobreak >nul

:: Start Frontend
echo.
echo [7/8] Starting Frontend Server...
cd /d "%~dp0frontend"
start "WhatsApp CRM Frontend" cmd /k "python -m http.server 8080"

:: Wait for frontend
echo Waiting for frontend to start...
timeout /t 3 /nobreak >nul

:: Open browser
echo.
echo [8/8] Opening browser...
start http://localhost:8080/crm-main.html

:: Final status
echo.
echo ===============================================
echo    ALL SYSTEMS STARTED SUCCESSFULLY!
echo ===============================================
echo.
echo System Status:
echo ✓ WAHA API: http://localhost:3000
echo ✓ Backend API: http://localhost:3001  
echo ✓ Frontend: http://localhost:8080
echo.
echo Main Features:
echo - Dashboard: http://localhost:8080/crm-main.html
echo - Conversations: http://localhost:8080/conversations-beautiful.html
echo - WAHA Swagger: http://localhost:3000/swagger
echo.
echo WebSocket Connections:
echo - Frontend → Backend: ws://localhost:3001
echo - Backend → WAHA: Webhook at /api/webhooks/waha
echo.
echo To stop all systems:
echo 1. Close all command windows
echo 2. Run: docker stop whatsapp-http-api
echo.
pause
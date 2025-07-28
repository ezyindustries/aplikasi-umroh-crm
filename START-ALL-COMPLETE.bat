@echo off
title Aplikasi Umroh - Complete Startup
color 0A
cls

echo ================================================
echo    APLIKASI UMROH - COMPLETE STARTUP SCRIPT
echo ================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Not running as administrator. Some features may not work.
    echo.
)

echo [STEP 1/6] Checking Prerequisites...
echo ================================================

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js is installed
)

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    echo Make sure Docker Desktop is running before continuing.
    pause
    exit /b 1
) else (
    echo [OK] Docker is installed
)

REM Check PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL might not be running on port 5432
    echo Will attempt to continue...
) else (
    echo [OK] PostgreSQL is running
)

echo.
echo [STEP 2/6] Installing Backend Dependencies...
echo ================================================
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Backend dependencies installed

echo.
echo [STEP 3/6] Setting Up WAHA WhatsApp API...
echo ================================================

REM Stop and remove existing container
docker stop waha-umroh >nul 2>&1
docker rm waha-umroh >nul 2>&1

echo Starting WAHA container...
docker run -d ^
    --name waha-umroh ^
    -p 3001:3000 ^
    -e WHATSAPP_HOOK_URL=http://host.docker.internal:5000/api/crm/webhook ^
    -e WHATSAPP_HOOK_EVENTS=message,message.ack,state.change ^
    -e WHATSAPP_API_KEY=your-secret-api-key ^
    -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
    -e WHATSAPP_SESSIONS_ENABLED=true ^
    -v waha-umroh-data:/app/data ^
    devlikeapro/waha:latest

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start WAHA container
    pause
    exit /b 1
)

echo Waiting for WAHA to initialize...
timeout /t 10 /nobreak >nul

REM Check if WAHA is responding
curl -s http://localhost:3001/api/version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] WAHA might not be ready yet
) else (
    echo [OK] WAHA is running
)

echo.
echo [STEP 4/6] Starting Backend Server...
echo ================================================
cd backend
start "Backend Server - Aplikasi Umroh" /min cmd /c "npm start"
cd ..

echo Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

REM Check if backend is responding
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Backend might not be ready yet
) else (
    echo [OK] Backend is running
)

echo.
echo [STEP 5/6] Starting Frontend Server...
echo ================================================
cd frontend
start "Frontend Server - Aplikasi Umroh" /min cmd /c "python -m http.server 8080"
cd ..

timeout /t 3 /nobreak >nul

echo.
echo [STEP 6/6] Final Status Check...
echo ================================================

REM Backend check
curl -s -o nul -w "Backend API (5000): " http://localhost:5000/health
if %errorlevel% equ 0 (
    echo [RUNNING]
) else (
    echo [NOT RESPONDING]
)

REM WAHA check
curl -s -o nul -w "WAHA API (3001): " http://localhost:3001/api/version
if %errorlevel% equ 0 (
    echo [RUNNING]
) else (
    echo [NOT RESPONDING]
)

REM Frontend check
curl -s -o nul -w "Frontend (8080): " http://localhost:8080
if %errorlevel% equ 0 (
    echo [RUNNING]
) else (
    echo [NOT RESPONDING]
)

echo.
echo ================================================
echo    ALL SERVICES STARTED!
echo ================================================
echo.
echo Access Points:
echo - Main App: http://localhost:8080/index.html
echo - CRM Dashboard: http://localhost:8080/crm-no-login.html
echo - Backend API: http://localhost:5000
echo - WAHA API: http://localhost:3001
echo - WAHA Dashboard: http://localhost:3001/dashboard
echo.
echo Opening CRM Dashboard in browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/crm-no-login.html"

echo.
echo ================================================
echo Press any key to view Docker logs...
pause >nul

echo.
echo WAHA Container Logs:
echo ================================================
docker logs --tail 20 waha-umroh

echo.
echo ================================================
echo To stop all services, close this window and run STOP-ALL.bat
echo ================================================
pause
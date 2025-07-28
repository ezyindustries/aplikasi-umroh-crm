@echo off
title Clean and Restart All Services
color 0A
cls

echo ================================================
echo    CLEANING AND RESTARTING ALL SERVICES
echo ================================================
echo.

echo [1/5] Stopping all existing services...
echo.

REM Kill backend processes
echo Stopping backend servers...
taskkill /F /FI "WINDOWTITLE eq *Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq npm*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq node*" >nul 2>&1

REM Stop and remove ALL Docker containers using port 3001
echo Stopping WAHA containers...
for /f "tokens=*" %%i in ('docker ps -q --filter "publish=3001"') do docker stop %%i >nul 2>&1
for /f "tokens=*" %%i in ('docker ps -aq --filter "publish=3001"') do docker rm %%i >nul 2>&1

REM Also try by name
docker stop waha-umroh >nul 2>&1
docker rm waha-umroh >nul 2>&1

echo [OK] All services stopped
echo.

echo [2/5] Starting WAHA WhatsApp API...
docker run -d ^
    --name waha-umroh ^
    -p 3001:3000 ^
    -e WHATSAPP_HOOK_URL=http://host.docker.internal:5000/api/crm/webhook ^
    -e WHATSAPP_HOOK_EVENTS=* ^
    -e WHATSAPP_API_KEY=your-secret-api-key ^
    -e WHATSAPP_RESTART_ALL_SESSIONS=false ^
    -v waha-umroh-data:/app/data ^
    devlikeapro/waha:latest

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start WAHA
    echo Trying to find what's using port 3001...
    netstat -ano | findstr :3001
    pause
    exit /b 1
) else (
    echo [OK] WAHA container started
)

echo Waiting for WAHA to initialize...
timeout /t 10 /nobreak >nul

echo.
echo [3/5] Starting Backend Server...
cd backend
start "Backend Server - DO NOT CLOSE" /min cmd /c "npm start || (echo Backend failed to start && pause)"
cd ..

echo Waiting for backend to initialize...
timeout /t 20 /nobreak >nul

echo.
echo [4/5] Verifying all services...
echo ================================================

REM Check Backend
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend API is running on port 5000
) else (
    echo [ERROR] Backend API is NOT responding
    echo Opening new window to debug backend...
    cd backend
    start "Backend Debug" cmd /k "npm start"
    cd ..
)

REM Check WAHA
curl -s http://localhost:3001/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] WAHA API is running on port 3001
) else (
    echo [ERROR] WAHA API is NOT responding
)

REM Check Frontend
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend server is running on port 8080
) else (
    echo [INFO] Frontend server not running, starting it...
    cd frontend
    start "Frontend Server" /min cmd /c "python -m http.server 8080 || npx http-server -p 8080"
    cd ..
)

echo.
echo [5/5] Opening Beautiful CRM Dashboard...
timeout /t 3 /nobreak >nul
start "" "http://localhost:8080/crm-beautiful.html"

echo.
echo ================================================
echo    ALL SERVICES STARTED!
echo ================================================
echo.
echo Services Status:
echo - Backend API: http://localhost:5000
echo - WAHA API: http://localhost:3001  
echo - Frontend: http://localhost:8080
echo - CRM Dashboard: http://localhost:8080/crm-beautiful.html
echo.
echo If you still see errors:
echo 1. Check the Backend window for errors
echo 2. Make sure PostgreSQL is running
echo 3. Check firewall settings
echo.
echo ================================================
pause
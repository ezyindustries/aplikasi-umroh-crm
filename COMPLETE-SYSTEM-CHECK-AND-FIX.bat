@echo off
title Complete System Check and Fix
color 0A
cls

echo ================================================
echo    COMPLETE SYSTEM CHECK AND FIX
echo ================================================
echo.

echo [1/6] Checking current service status...
echo ================================================
echo Service          Port    Status
echo --------         ----    ------

netstat -an | findstr :5000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend API      5000    [RUNNING]
) else (
    echo Backend API      5000    [NOT RUNNING] - Will fix
)

netstat -an | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo WAHA WhatsApp    3001    [RUNNING]
) else (
    echo WAHA WhatsApp    3001    [NOT RUNNING] - Will fix
)

netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend         8080    [RUNNING]
) else (
    echo Frontend         8080    [NOT RUNNING] - Will fix
)

netstat -an | findstr :5432 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo PostgreSQL       5432    [RUNNING]
) else (
    echo PostgreSQL       5432    [NOT RUNNING] - Check PostgreSQL service
)

netstat -an | findstr :11434 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo Ollama AI        11434   [RUNNING]
) else (
    echo Ollama AI        11434   [NOT RUNNING] - Optional
)

echo.
echo [2/6] Starting Backend Server...
echo ================================================
cd backend
start "Backend Server - DO NOT CLOSE" /min cmd /c "npm start || (echo Backend failed && pause)"
cd ..

echo Waiting for backend to start (20 seconds)...
timeout /t 20 /nobreak >nul

echo.
echo [3/6] Checking WAHA WhatsApp API...
echo ================================================
curl -s http://localhost:3001/api/version >nul 2>&1
if %errorlevel% neq 0 (
    echo WAHA not responding. Starting fresh container...
    docker stop waha-umroh >nul 2>&1
    docker rm waha-umroh >nul 2>&1
    docker run -d --name waha-umroh -p 3001:3000 -e WHATSAPP_API_KEY=your-secret-api-key devlikeapro/waha
    timeout /t 10 /nobreak >nul
) else (
    echo WAHA is already running
)

echo.
echo [4/6] Starting Frontend Server if needed...
echo ================================================
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
    cd frontend
    start "Frontend Server" /min cmd /c "python -m http.server 8080 || npx http-server -p 8080"
    cd ..
    timeout /t 5 /nobreak >nul
) else (
    echo Frontend already running
)

echo.
echo [5/6] Testing Integration...
echo ================================================

echo Testing Backend API...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend API responding
) else (
    echo [ERROR] Backend API not responding
)

echo.
echo Testing WAHA API...
curl -s http://localhost:3001/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] WAHA API responding
) else (
    echo [ERROR] WAHA API not responding
)

echo.
echo Testing Frontend...
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend server responding
) else (
    echo [ERROR] Frontend server not responding
)

echo.
echo [6/6] Opening dashboard...
echo ================================================
timeout /t 3 /nobreak >nul
start "" "http://localhost:8080/index-whatsapp-fixed.html"

echo.
echo ================================================
echo    SYSTEM CHECK COMPLETE
echo ================================================
echo.
echo Services URLs:
echo - Backend API: http://localhost:5000
echo - WAHA API: http://localhost:3001
echo - Frontend: http://localhost:8080
echo - PostgreSQL: localhost:5432
echo.
echo If Backend still not working:
echo 1. Check PostgreSQL is running
echo 2. Check database 'vauza_tamma_db' exists
echo 3. Run: cd backend && npm install
echo.
echo ================================================
pause
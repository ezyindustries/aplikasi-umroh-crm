@echo off
title Complete Fix and Start - Aplikasi Umroh
color 0A
cls

echo ================================================
echo    COMPLETE FIX AND START ALL SERVICES
echo ================================================
echo.

REM Step 1: Fix wrong ports
echo [STEP 1/4] Fixing wrong port configurations...
cd frontend
powershell -Command "(Get-Content crm-dashboard-pro.html) -replace 'http://localhost:3000/api', 'http://localhost:5000/api' | Set-Content crm-dashboard-pro.html"
powershell -Command "(Get-Content crm-dashboard-pro-safe.html) -replace 'http://localhost:3000/api', 'http://localhost:5000/api' | Set-Content crm-dashboard-pro-safe.html"
powershell -Command "(Get-Content crm-complete.html) -replace 'http://localhost:3000/api', 'http://localhost:5000/api' | Set-Content crm-complete.html"
powershell -Command "(Get-Content crm-simple.html) -replace 'http://localhost:3000/api', 'http://localhost:5000/api' | Set-Content crm-simple.html"
cd ..
echo [OK] Port configurations fixed

echo.
echo [STEP 2/4] Starting Backend Server...
cd backend
start "Backend Server - DO NOT CLOSE" /min cmd /c "npm start || pause"
cd ..
echo [OK] Backend server starting...

echo.
echo Waiting for backend to initialize (20 seconds)...
timeout /t 20 /nobreak >nul

echo.
echo [STEP 3/4] Verifying services...
echo ================================================

REM Check Backend
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend API is running on port 5000
) else (
    echo [ERROR] Backend API is NOT responding!
    echo.
    echo Possible issues:
    echo 1. Check if another window shows backend errors
    echo 2. Database connection might be failing
    echo 3. Missing dependencies
    echo.
    echo Opening backend log window...
    cd backend
    start "Backend Debug" cmd /k "npm start"
    cd ..
)

REM Check WAHA
curl -s http://localhost:3001/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] WAHA WhatsApp is running on port 3001
) else (
    echo [WARNING] WAHA is not responding
)

REM Check Frontend
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend server is running on port 8080
) else (
    echo [WARNING] Frontend server not running
)

echo.
echo [STEP 4/4] Opening CRM Dashboard...
echo ================================================
timeout /t 3 /nobreak >nul
start "" "http://localhost:8080/crm-no-login.html"

echo.
echo ================================================
echo    IMPORTANT NOTES:
echo ================================================
echo.
echo 1. DO NOT CLOSE the Backend Server window!
echo 2. If you see errors in backend window:
echo    - Check PostgreSQL is running
echo    - Check database 'vauza_tamma_db' exists
echo    - Check .env file configuration
echo.
echo 3. Services Status:
echo    - Backend API: http://localhost:5000
echo    - WAHA API: http://localhost:3001
echo    - Frontend: http://localhost:8080
echo.
echo 4. If CRM shows errors, press F12 in browser
echo    to see console errors
echo.
echo ================================================
pause
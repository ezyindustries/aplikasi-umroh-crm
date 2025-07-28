@echo off
title Test Frontend-Backend Integration
color 0A
cls

echo ================================================
echo    TESTING FRONTEND-BACKEND INTEGRATION
echo ================================================
echo.

echo [1/5] Checking Backend Health...
echo ------------------------------------------------
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running on port 5000
    curl -s http://localhost:5000/health
) else (
    echo [ERROR] Backend is not responding on port 5000
    echo Please run COMPLETE-SYSTEM-CHECK-AND-FIX.bat first
    pause
    exit /b 1
)

echo.
echo [2/5] Testing API Endpoints...
echo ------------------------------------------------

echo Testing /api/jamaah endpoint:
curl -s http://localhost:5000/api/jamaah | findstr /C:"[" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Jamaah API endpoint working
) else (
    echo [ERROR] Jamaah API endpoint not working
)

echo.
echo Testing /api/packages endpoint:
curl -s http://localhost:5000/api/packages | findstr /C:"[" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Packages API endpoint working
) else (
    echo [ERROR] Packages API endpoint not working
)

echo.
echo [3/5] Checking WAHA WhatsApp Service...
echo ------------------------------------------------
curl -s http://localhost:3001/api/version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] WAHA WhatsApp API is running
    curl -s http://localhost:3001/api/sessions/default | findstr /C:"status"
) else (
    echo [WARNING] WAHA WhatsApp API not running
)

echo.
echo [4/5] Frontend Server Check...
echo ------------------------------------------------
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend server is running on port 8080
) else (
    echo [WARNING] Frontend server not running
    echo Starting frontend server...
    start "Frontend Server" /min cmd /c "cd frontend && python -m http.server 8080"
    timeout /t 3 /nobreak >nul
)

echo.
echo [5/5] Opening Test Pages...
echo ------------------------------------------------
echo Opening pages with glass morphism theme:
echo.

echo 1. Main Dashboard: http://localhost:8080/index.html
start "" "http://localhost:8080/index.html"

timeout /t 2 /nobreak >nul

echo 2. WhatsApp CRM: http://localhost:8080/crm-beautiful.html
start "" "http://localhost:8080/crm-beautiful.html"

timeout /t 2 /nobreak >nul

echo 3. WhatsApp Only: http://localhost:8080/index-whatsapp-fixed.html
start "" "http://localhost:8080/index-whatsapp-fixed.html"

echo.
echo ================================================
echo    INTEGRATION TEST COMPLETE
echo ================================================
echo.
echo All pages should now be open in your browser.
echo Check that:
echo - Glass morphism theme is consistent
echo - Backend API calls work properly
echo - WhatsApp connection status shows
echo.
echo Press any key to exit...
pause >nul
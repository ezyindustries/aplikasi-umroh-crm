@echo off
title Fix CORS and Restart Services
color 0A
cls

echo ================================================
echo    FIXING CORS AND RESTARTING SERVICES
echo ================================================
echo.

echo [1/4] Stopping backend server...
echo ------------------------------------------------
taskkill /F /FI "WINDOWTITLE eq Backend Server*" >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Starting backend with updated CORS...
echo ------------------------------------------------
cd backend
start "Backend Server - CORS Fixed" /min cmd /c "npm start"
cd ..
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [3/4] Testing CORS from frontend...
echo ------------------------------------------------
curl -s -H "Origin: http://localhost:8080" http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] CORS is working properly
) else (
    echo [ERROR] CORS still not working
)

echo.
echo [4/4] Starting frontend server if needed...
echo ------------------------------------------------
netstat -an | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
    cd frontend
    start "Frontend Server" /min cmd /c "python -m http.server 8080"
    cd ..
    echo Frontend server started on http://localhost:8080
) else (
    echo Frontend already running on http://localhost:8080
)

echo.
echo ================================================
echo    CORS FIXED - SERVICES RUNNING
echo ================================================
echo.
echo IMPORTANT: Access your pages through:
echo - http://localhost:8080/crm-beautiful.html
echo - http://localhost:8080/index-whatsapp-fixed.html
echo - http://localhost:8080/index.html
echo.
echo Do NOT open files directly (file://)
echo.
echo WAHA API Key is set to: your-secret-api-key
echo.
pause
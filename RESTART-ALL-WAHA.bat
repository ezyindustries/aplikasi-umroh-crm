@echo off
title Complete WAHA System Restart
echo ========================================
echo     WAHA Complete System Restart
echo ========================================
echo.

echo [1/8] Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/8] Cleaning up old session data...
cd backend\whatsapp
if exist .wwebjs_auth rmdir /S /Q .wwebjs_auth 2>nul
if exist sessions\default del /Q sessions\default\* 2>nul
cd ..\..

echo.
echo [3/8] Checking Docker status...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not installed!
    pause
    exit /b
)

echo.
echo [4/8] Verifying WAHA container...
docker ps | findstr waha-whatsapp >nul 2>&1
if errorlevel 1 (
    echo [WARNING] WAHA container not running. Starting it...
    docker run -d --name waha-whatsapp -p 3003:3000 devlikeapro/waha
    timeout /t 5 /nobreak >nul
)

echo.
echo [5/8] Testing WAHA API...
curl -s http://localhost:3003/ >nul 2>&1
if errorlevel 1 (
    echo [ERROR] WAHA not responding on port 3003!
    echo Please check Docker logs: docker logs waha-whatsapp
    pause
    exit /b
)
echo [OK] WAHA is running on port 3003

echo.
echo [6/8] Starting WhatsApp CRM Backend...
cd backend\whatsapp
start "WhatsApp CRM Backend" cmd /k "npm start"
cd ..\..
echo Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo.
echo [7/8] Testing backend API...
curl -s http://localhost:3002/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend not responding yet. Give it more time...
    timeout /t 5 /nobreak >nul
)

echo.
echo [8/8] System Status Check...
echo.
echo Port Status:
netstat -an | findstr "3002.*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo - Backend (3002): NOT RUNNING
) else (
    echo - Backend (3002): RUNNING
)

netstat -an | findstr "3003.*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo - WAHA (3003): NOT RUNNING
) else (
    echo - WAHA (3003): RUNNING
)

echo.
echo ========================================
echo          System Ready!
echo ========================================
echo.
echo Services:
echo - WAHA API: http://localhost:3003
echo - Backend API: http://localhost:3002
echo - Frontend: file:///D:/ezyin/Documents/aplikasi%%20umroh/frontend/conversations-beautiful.html
echo.
echo Next Steps:
echo 1. Open the frontend URL in your browser
echo 2. Click "Connect WhatsApp"
echo 3. Scan the QR code with your phone
echo.
echo If you encounter issues:
echo - Check backend window for errors
echo - Run: docker logs waha-whatsapp
echo - Run: CHECK-WAHA-STATUS.bat
echo.
echo ========================================
pause
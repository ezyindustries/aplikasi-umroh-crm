@echo off
title Fix WhatsApp CRM and Start with WAHA
echo ========================================
echo     Fixing WhatsApp CRM for WAHA
echo ========================================
echo.

echo [1/7] Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo.
echo [2/7] Cleaning up locked files...
cd backend\whatsapp

REM Force remove locked files and folders
echo Removing WhatsApp Web session files...
if exist .wwebjs_auth (
    REM Try normal removal first
    rmdir /S /Q .wwebjs_auth 2>nul
    
    REM If failed, force removal
    if exist .wwebjs_auth (
        echo Force removing locked files...
        for /f "delims=" %%i in ('dir /b /s .wwebjs_auth') do (
            del /f /q "%%i" 2>nul
        )
        rmdir /S /Q .wwebjs_auth 2>nul
    )
)

if exist sessions (
    rmdir /S /Q sessions 2>nul
)

if exist chrome_debug.log (
    del /f /q chrome_debug.log 2>nul
)

echo.
echo [3/7] Ensuring WAHA configuration...
REM Update .env to use WAHA on port 3003
powershell -Command "(Get-Content .env) -replace 'WAHA_URL=.*', 'WAHA_URL=http://localhost:3003' -replace 'WAHA_BASE_URL=.*', 'WAHA_BASE_URL=http://localhost:3003' -replace 'USE_WAHA=.*', 'USE_WAHA=true' | Set-Content .env"

echo.
echo [4/7] Switching to RealWAHAService...
REM Update all files to use RealWAHAService
powershell -Command "(Get-Content src/controllers/SessionController.js) -replace 'WhatsAppWebService', 'RealWAHAService' | Set-Content src/controllers/SessionController.js"
powershell -Command "if (Test-Path src/services/MessageQueue.js) { (Get-Content src/services/MessageQueue.js) -replace 'WhatsAppWebService', 'RealWAHAService' | Set-Content src/services/MessageQueue.js }"
powershell -Command "if (Test-Path force-load-chats.js) { (Get-Content force-load-chats.js) -replace 'WhatsAppWebService', 'RealWAHAService' | Set-Content force-load-chats.js }"

echo.
echo [5/7] Checking WAHA status on port 3003...
curl -s http://localhost:3003/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] WAHA not responding on port 3003!
    echo.
    echo Checking Docker...
    docker ps | findstr waha
    echo.
    echo If WAHA is not running, please run:
    echo docker run -d --name waha-whatsapp -p 3003:3000 devlikeapro/waha
    echo.
    pause
    exit /b
)
echo [OK] WAHA is running on port 3003

cd ..\..

echo.
echo [6/7] Starting WhatsApp CRM Backend...
start "WhatsApp CRM Backend" cmd /k "cd backend\whatsapp && npm start"
echo Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo.
echo [7/7] Testing backend connection...
curl -s http://localhost:3002/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend not responding yet. Give it a moment...
) else (
    echo [OK] Backend is running on port 3002
)

echo.
echo ========================================
echo          Setup Complete!
echo ========================================
echo.
echo Status:
echo - WAHA is running on port 3003
echo - Backend is starting on port 3002
echo - Frontend at: http://localhost:8080/conversations-beautiful.html
echo.
echo Next Steps:
echo 1. Wait a few seconds for backend to fully start
echo 2. Open browser to http://localhost:8080/conversations-beautiful.html
echo 3. Press Ctrl+F5 to hard refresh the page
echo 4. Click "Connect WhatsApp" button
echo 5. Scan the QR code with your phone
echo.
echo If you see any errors, check the backend window for details.
echo ========================================
echo.
pause
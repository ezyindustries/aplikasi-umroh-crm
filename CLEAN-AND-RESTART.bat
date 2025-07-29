@echo off
echo ========================================
echo     Cleaning WhatsApp CRM
echo ========================================
echo.

echo [1/5] Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/5] Cleaning WhatsApp session files...
cd backend\whatsapp
if exist .wwebjs_auth (
    echo Removing .wwebjs_auth folder...
    rmdir /S /Q .wwebjs_auth 2>nul
)
if exist sessions (
    echo Removing sessions folder...
    rmdir /S /Q sessions 2>nul
)

echo.
echo [3/5] Switching to WAHA mode...
echo const fs = require('fs'); > switch-config.js
echo // Update .env to use WAHA on port 3003 >> switch-config.js
echo let env = fs.readFileSync('.env', 'utf8'); >> switch-config.js
echo env = env.replace(/WAHA_URL=.*/g, 'WAHA_URL=http://localhost:3003'); >> switch-config.js
echo env = env.replace(/WAHA_BASE_URL=.*/g, 'WAHA_BASE_URL=http://localhost:3003'); >> switch-config.js
echo fs.writeFileSync('.env', env); >> switch-config.js
echo console.log('Updated .env for WAHA on port 3003'); >> switch-config.js
echo. >> switch-config.js
echo // Switch to RealWAHAService >> switch-config.js
echo const files = [ >> switch-config.js
echo   'src/controllers/SessionController.js', >> switch-config.js
echo   'src/services/MessageQueue.js', >> switch-config.js
echo   'force-load-chats.js' >> switch-config.js
echo ]; >> switch-config.js
echo. >> switch-config.js
echo files.forEach(file =^> { >> switch-config.js
echo   if (fs.existsSync(file)) { >> switch-config.js
echo     let content = fs.readFileSync(file, 'utf8'); >> switch-config.js
echo     content = content.replace(/WhatsAppWebService/g, 'RealWAHAService'); >> switch-config.js
echo     fs.writeFileSync(file, content); >> switch-config.js
echo     console.log('Updated', file); >> switch-config.js
echo   } >> switch-config.js
echo }); >> switch-config.js

node switch-config.js
del switch-config.js

cd ..\..

echo.
echo [4/5] Checking WAHA status...
curl -s http://localhost:3003/api/health >nul 2>&1
if errorlevel 1 (
    echo.
    echo [WARNING] WAHA not found on port 3003!
    echo.
    echo Please make sure WAHA Docker is running:
    echo docker run -d --name waha-whatsapp -p 3003:3000 devlikeapro/waha
    echo.
    pause
    exit /b
)
echo [OK] WAHA is running on port 3003

echo.
echo [5/5] Starting WhatsApp CRM...
echo.
start cmd /k "cd backend\whatsapp && npm start"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo          Cleanup Complete!
echo ========================================
echo.
echo Backend is starting...
echo Please wait a moment and then:
echo.
echo 1. Open browser to http://localhost:8080/conversations-beautiful.html
echo 2. Press Ctrl+F5 to hard refresh
echo 3. Click "Connect WhatsApp"
echo 4. Scan QR Code
echo.
echo ========================================
echo.
pause
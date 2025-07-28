@echo off
echo ========================================
echo Starting WhatsApp CRM with Baileys
echo ========================================
echo.
echo This uses Baileys (free WhatsApp Web library)
echo No Docker or WAHA required!
echo.

REM Set Baileys mode
set USE_BAILEYS=true
set NODE_ENV=development

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Starting Backend with Baileys...
cd backend\whatsapp
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

start cmd /k "title WhatsApp CRM Backend (Baileys) && npm start"

REM Wait for backend
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Starting Frontend...
cd ..\..\frontend
start cmd /k "title WhatsApp CRM Frontend && python -m http.server 8080"

echo.
echo [3/3] Application started successfully!
echo.
echo ========================================
echo INSTRUCTIONS:
echo.
echo 1. Open browser: http://localhost:8080/conversations-beautiful.html
echo 2. Click "Connect WhatsApp" button
echo 3. QR Code will appear in the backend window
echo 4. Scan with WhatsApp on your phone:
echo    - Open WhatsApp
echo    - Settings > Linked Devices
echo    - Link a Device > Scan QR
echo.
echo IMPORTANT:
echo - Keep backend window open to see QR code
echo - Phone must stay connected to internet
echo - All compliance rules still apply!
echo ========================================
echo.
pause
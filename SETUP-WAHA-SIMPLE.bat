@echo off
title WAHA Docker Setup
echo ========================================
echo     WAHA WhatsApp API - Easy Setup
echo ========================================
echo.

echo [1/6] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not installed!
    pause
    exit /b
)
echo [OK] Docker installed

echo.
echo [2/6] Checking Docker status...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not running!
    echo Please start Docker Desktop first.
    pause
    exit /b
)
echo [OK] Docker is running

echo.
echo [3/6] Removing old WAHA container...
docker stop waha-whatsapp >nul 2>&1
docker rm waha-whatsapp >nul 2>&1
echo [OK] Cleanup done

echo.
echo [4/6] Downloading WAHA image...
echo This may take a few minutes on first run...
docker pull devlikeapro/waha
if errorlevel 1 (
    echo ERROR: Failed to download WAHA!
    pause
    exit /b
)
echo [OK] WAHA image downloaded

echo.
echo [5/6] Starting WAHA container on port 3003...
docker run -d --name waha-whatsapp -p 3003:3000 devlikeapro/waha
if errorlevel 1 (
    echo ERROR: Failed to start WAHA!
    echo Trying alternative port 3004...
    docker run -d --name waha-whatsapp -p 3004:3000 devlikeapro/waha
    set WAHA_PORT=3004
) else (
    set WAHA_PORT=3003
)
echo [OK] WAHA started on port %WAHA_PORT%

echo.
echo [6/6] Waiting for WAHA to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo          WAHA Setup Complete!
echo ========================================
echo.
echo WAHA is running on: http://localhost:%WAHA_PORT%
echo.
echo Next steps:
echo 1. Close WhatsApp CRM backend if running (Ctrl+C)
echo 2. Run START-WHATSAPP-CRM.bat
echo 3. Click "Connect WhatsApp" in browser
echo 4. Scan QR Code
echo.
echo ========================================
echo.

REM Update the configuration
echo Updating configuration...
cd backend\whatsapp
node -e "const fs=require('fs'); let env=fs.readFileSync('.env','utf8'); env=env.replace(/WAHA_URL=.*/g,'WAHA_URL=http://localhost:%WAHA_PORT%').replace(/WAHA_BASE_URL=.*/g,'WAHA_BASE_URL=http://localhost:%WAHA_PORT%'); fs.writeFileSync('.env',env); console.log('Configuration updated for port %WAHA_PORT%');"
cd ..\..

echo.
pause
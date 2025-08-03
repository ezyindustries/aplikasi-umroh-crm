@echo off
echo === UPDATE WAHA CORE TO WAHA PLUS ===
echo.
echo This script will update your WAHA Core to WAHA Plus
echo Make sure you have your WAHA Plus license key ready!
echo.
pause

echo.
echo Step 1: Stopping current WAHA container...
docker stop waha 2>nul
if %errorlevel% equ 0 (
    echo [OK] WAHA container stopped
) else (
    echo [INFO] No running WAHA container found
)

echo.
echo Step 2: Removing old container (keeping data)...
docker rm waha 2>nul
if %errorlevel% equ 0 (
    echo [OK] Old container removed
) else (
    echo [INFO] No container to remove
)

echo.
echo Step 3: Pulling WAHA Plus image...
docker pull devlikeapro/waha-plus:latest
if %errorlevel% neq 0 (
    echo [ERROR] Failed to pull WAHA Plus image
    pause
    exit /b 1
)

echo.
echo Step 4: Starting WAHA Plus...
echo.
set /p LICENSE_KEY="Enter your WAHA Plus license key: "
set /p API_KEY="Enter API key (or press Enter for default 'your-api-key'): "

if "%API_KEY%"=="" set API_KEY=your-api-key

echo.
echo Starting WAHA Plus with the following configuration:
echo - License Key: %LICENSE_KEY%
echo - API Key: %API_KEY%
echo - Webhook URL: http://host.docker.internal:3003/api/webhook
echo - Data Volume: waha-data
echo.

docker run -d ^
  --name waha ^
  --restart always ^
  -p 3000:3000 ^
  -e WAHA_LICENSE_KEY=%LICENSE_KEY% ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhook ^
  -e WHATSAPP_HOOK_EVENTS=* ^
  -e WHATSAPP_API_KEY=%API_KEY% ^
  -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
  -e WHATSAPP_FILES_MIMETYPES=audio,document,image,video ^
  -e WHATSAPP_FILES_LIFETIME=180 ^
  -v waha-data:/app/data ^
  devlikeapro/waha-plus:latest

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] WAHA Plus is now running!
    echo.
    timeout /t 5 /nobreak >nul
    
    echo Checking WAHA Plus status...
    curl -s http://localhost:3000/api/version
    echo.
    echo.
    echo === WAHA Plus Features ===
    curl -s http://localhost:3000/api/plus/features 2>nul
    if %errorlevel% neq 0 (
        echo [INFO] Plus features endpoint not available yet, container might still be starting...
    )
    echo.
    echo.
    echo WAHA Plus is now running on http://localhost:3000
    echo You may need to re-scan QR code for WhatsApp sessions
) else (
    echo.
    echo [ERROR] Failed to start WAHA Plus container
    echo Please check the error messages above
)

echo.
pause
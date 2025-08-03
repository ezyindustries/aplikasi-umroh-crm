@echo off
echo === SWITCH FROM WAHA CORE TO WAHA PLUS ===
echo.
echo Current container is using WAHA Core (whatsapp-http-api)
echo We need to switch to WAHA Plus for image support
echo.
pause

echo.
echo Step 1: Stop current WAHA Core container...
docker stop whatsapp-http-api
docker rm whatsapp-http-api
echo [OK] Old container removed
echo.

echo Step 2: Start WAHA Plus container...
echo.
set /p LICENSE_KEY="Enter your WAHA Plus License Key: "
set /p API_KEY="Enter API key (or press Enter for 'your-api-key'): "

if "%API_KEY%"=="" set API_KEY=your-api-key

echo.
echo Starting WAHA Plus...
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
    
    echo Checking WAHA Plus...
    docker ps | findstr waha
    echo.
    echo IMPORTANT: You may need to scan QR code again
    echo.
    echo Test image upload at: http://localhost:8080/test-image-upload.html
) else (
    echo.
    echo [ERROR] Failed to start WAHA Plus
    echo Make sure you have:
    echo 1. Valid license key
    echo 2. Docker login with WAHA credentials
    echo 3. Run: docker pull devlikeapro/waha-plus:latest
)

echo.
pause
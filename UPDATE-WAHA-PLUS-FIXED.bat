@echo off
echo === UPDATE WAHA CORE TO WAHA PLUS ===
echo.
echo This script will update your WAHA Core to WAHA Plus
echo.
echo IMPORTANT: You need:
echo 1. WAHA Plus license key
echo 2. Docker Hub credentials (from WAHA team)
echo.
pause

echo.
echo Step 1: Docker Login to WAHA Registry
echo Please enter your Docker Hub credentials provided by WAHA team
echo.
docker login
if %errorlevel% neq 0 (
    echo [ERROR] Docker login failed. Please check your credentials.
    echo.
    echo If you don't have Docker Hub access, please:
    echo 1. Purchase WAHA Plus license at https://waha.devlike.pro/
    echo 2. You'll receive Docker Hub credentials via email
    echo 3. Run this script again with those credentials
    pause
    exit /b 1
)

echo.
echo Step 2: Stopping current WAHA container...
docker stop waha 2>nul
if %errorlevel% equ 0 (
    echo [OK] WAHA container stopped
) else (
    echo [INFO] No running WAHA container found
)

echo.
echo Step 3: Removing old container (keeping data)...
docker rm waha 2>nul
if %errorlevel% equ 0 (
    echo [OK] Old container removed
) else (
    echo [INFO] No container to remove
)

echo.
echo Step 4: Pulling WAHA Plus image...
docker pull devlikeapro/waha-plus:latest
if %errorlevel% neq 0 (
    echo [ERROR] Failed to pull WAHA Plus image
    echo.
    echo Possible reasons:
    echo 1. Docker login failed or expired
    echo 2. No access to WAHA Plus repository
    echo 3. Network connection issues
    echo.
    echo Please ensure you have valid WAHA Plus subscription
    pause
    exit /b 1
)

echo.
echo Step 5: Starting WAHA Plus...
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
    echo WAHA Plus is now running on http://localhost:3000
    echo.
    echo Next steps:
    echo 1. Open http://localhost:3000/dashboard
    echo 2. Re-scan QR code if needed
    echo 3. Test image sending at http://localhost:8080/test-image-upload.html
) else (
    echo.
    echo [ERROR] Failed to start WAHA Plus container
    echo Please check the error messages above
)

echo.
pause
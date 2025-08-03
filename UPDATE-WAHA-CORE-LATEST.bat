@echo off
echo === UPDATE WAHA CORE TO LATEST VERSION ===
echo.
echo This will update WAHA Core (free version) to the latest version
echo Note: WAHA Core does NOT support image sending
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
echo Step 3: Pulling latest WAHA Core image...
docker pull devlikeapro/waha:latest
if %errorlevel% neq 0 (
    echo [ERROR] Failed to pull WAHA Core image
    echo Please check your internet connection
    pause
    exit /b 1
)

echo.
echo Step 4: Starting WAHA Core...
echo.
set /p API_KEY="Enter API key (or press Enter for default 'your-api-key'): "

if "%API_KEY%"=="" set API_KEY=your-api-key

echo.
echo Starting WAHA Core with the following configuration:
echo - API Key: %API_KEY%
echo - Webhook URL: http://host.docker.internal:3003/api/webhook
echo - Data Volume: waha-data
echo.

docker run -d ^
  --name waha ^
  --restart always ^
  -p 3000:3000 ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhook ^
  -e WHATSAPP_HOOK_EVENTS=* ^
  -e WHATSAPP_API_KEY=%API_KEY% ^
  -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
  -v waha-data:/app/data ^
  devlikeapro/waha:latest

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] WAHA Core is now running!
    echo.
    timeout /t 5 /nobreak >nul
    
    echo Checking WAHA Core status...
    curl -s http://localhost:3000/api/version
    echo.
    echo.
    echo === IMPORTANT LIMITATIONS ===
    echo WAHA Core (free version) does NOT support:
    echo - Sending images
    echo - Sending videos
    echo - Sending documents
    echo - Sending audio
    echo - Other media types
    echo.
    echo To enable media sending, you need WAHA Plus license from:
    echo https://waha.devlike.pro/
    echo.
    echo WAHA Core is running on http://localhost:3000
) else (
    echo.
    echo [ERROR] Failed to start WAHA Core container
    echo Please check the error messages above
)

echo.
pause
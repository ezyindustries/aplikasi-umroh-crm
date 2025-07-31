@echo off
echo ===============================================
echo RESTART WAHA WITH WEBHOOK CONFIGURATION
echo ===============================================
echo.

:: Stop existing container
echo [1/3] Stopping existing WAHA container...
docker stop whatsapp-http-api 2>nul
docker rm whatsapp-http-api 2>nul
timeout /t 2 /nobreak >nul

:: Start new container with webhook
echo [2/3] Starting WAHA with webhook configuration...
docker run -d ^
  --name whatsapp-http-api ^
  --restart unless-stopped ^
  -p 3000:3000 ^
  -v "%~dp0waha-data:/app/data" ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
  -e WHATSAPP_HOOK_EVENTS=* ^
  -e WHATSAPP_API_KEY= ^
  -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
  -e WHATSAPP_FILES_MIMETYPES=* ^
  -e WHATSAPP_FILES_LIFETIME=0 ^
  devlikeapro/whatsapp-http-api:latest

if %errorlevel% neq 0 (
    echo ERROR: Failed to start WAHA container
    pause
    exit /b 1
)

echo Waiting for WAHA to start...
timeout /t 10 /nobreak >nul

:: Check status
echo.
echo [3/3] Checking WAHA status...
curl -s http://localhost:3000/api/sessions
echo.
echo.

echo ===============================================
echo WAHA RESTARTED WITH WEBHOOK!
echo ===============================================
echo.
echo Webhook URL: http://host.docker.internal:3001/api/webhooks/waha
echo.
echo Next steps:
echo 1. WhatsApp session should reconnect automatically
echo 2. Send a NEW IMAGE from WhatsApp
echo 3. Check backend console for webhook logs
echo.
pause
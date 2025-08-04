@echo off
echo ===============================================
echo RESTARTING WAHA WITH WEBHOOK CONFIGURATION
echo ===============================================
echo.
echo This will restart WAHA and ensure webhook is set.
echo.

echo [1] Stopping WAHA container...
docker stop waha-plus

echo.
echo [2] Starting WAHA with webhook environment variable...
docker run -d ^
  --name waha-plus ^
  -p 3000:3000 ^
  -v waha-data:/app/data ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhooks/waha ^
  -e WHATSAPP_HOOK_EVENTS=message,message.any,state.change ^
  -e WHATSAPP_API_KEY=your-api-key ^
  --rm ^
  devlikeapro/waha-plus

echo.
echo [3] Waiting for WAHA to start...
timeout /t 10 /nobreak

echo.
echo [4] Container status:
docker ps | findstr waha-plus

echo.
echo ===============================================
echo WAHA restarted with webhook configuration!
echo.
echo Webhook URL: http://host.docker.internal:3003/api/webhooks/waha
echo Events: message, message.any, state.change
echo.
echo Please:
echo 1. Scan QR code if needed
echo 2. Send a test message with package keywords
echo 3. Check Autoreply Management page
echo ===============================================
pause
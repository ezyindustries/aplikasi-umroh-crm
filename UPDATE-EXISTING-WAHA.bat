@echo off
echo Updating existing WAHA container with media download configuration...
echo.

REM Check if the container is running
docker ps | findstr whatsapp-http-api >nul
if %errorlevel% neq 0 (
    echo ERROR: whatsapp-http-api container is not running!
    pause
    exit /b 1
)

echo Current WAHA container found: whatsapp-http-api
echo.

REM Stop the existing container
echo Stopping existing WAHA container...
docker stop whatsapp-http-api

REM Remove the old container but keep volumes
echo Removing old container (keeping data)...
docker rm whatsapp-http-api

REM Start new container with updated environment
echo Starting WAHA with media download enabled...
docker run -d ^
  --name whatsapp-http-api ^
  -p 3000:3000 ^
  -e WHATSAPP_DOWNLOAD_MEDIA=true ^
  -e WHATSAPP_FILES_MIMETYPES=audio,image,video,document,application/pdf ^
  -e WHATSAPP_FILES_LIFETIME=0 ^
  -e WHATSAPP_FILES_FOLDER=/tmp/whatsapp-files ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
  -e WHATSAPP_HOOK_EVENTS=message,message.ack,state.change,group.join,group.leave ^
  -v whatsapp_sessions:/app/sessions ^
  devlikeapro/waha:latest

REM Wait a bit
timeout /t 5 /nobreak >nul

REM Check if container is running
docker ps | findstr whatsapp-http-api >nul
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: WAHA updated and running with media download enabled!
    echo.
    echo Configuration:
    echo - Media download: ENABLED
    echo - File types: audio, image, video, document, PDF
    echo - Files kept: Forever (lifetime=0)
    echo - API URL: http://localhost:3000
    echo.
    echo Your WhatsApp session is preserved!
) else (
    echo.
    echo ERROR: Failed to start updated WAHA!
    echo Check logs with: docker logs whatsapp-http-api
)

echo.
pause
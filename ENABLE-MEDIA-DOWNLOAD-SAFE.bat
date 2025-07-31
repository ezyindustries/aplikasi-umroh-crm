@echo off
echo ========================================
echo Enable Media Download on Existing WAHA
echo ========================================
echo.

REM First check current status
echo Checking current WAHA status...
docker ps | findstr whatsapp-http-api >nul
if %errorlevel% neq 0 (
    echo ERROR: whatsapp-http-api container is not running!
    pause
    exit /b 1
)

echo Found running WAHA: whatsapp-http-api
echo.

REM Check current environment
echo Current media download status:
docker exec whatsapp-http-api printenv | findstr WHATSAPP_DOWNLOAD_MEDIA 2>nul || echo WHATSAPP_DOWNLOAD_MEDIA: Not set (disabled)
echo.

echo WARNING: This will restart WAHA but your WhatsApp session will be preserved.
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

REM Get current container info
echo.
echo Backing up container info...
docker inspect whatsapp-http-api > waha-backup.json

REM Stop container
echo Stopping WAHA...
docker stop whatsapp-http-api

REM Get the image name
for /f "tokens=*" %%i in ('docker inspect whatsapp-http-api --format="{{.Config.Image}}"') do set IMAGE=%%i

REM Remove container (keeping volumes)
docker rm whatsapp-http-api

REM Start with same config + media download
echo Starting WAHA with media download enabled...
docker run -d ^
  --name whatsapp-http-api ^
  -p 3000:3000 ^
  -e WHATSAPP_DOWNLOAD_MEDIA=true ^
  -e WHATSAPP_FILES_MIMETYPES=audio,image,video,document,application/pdf ^
  -e WHATSAPP_FILES_LIFETIME=0 ^
  -e WHATSAPP_FILES_FOLDER=/tmp/whatsapp-files ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
  -e WHATSAPP_HOOK_EVENTS=message,message.ack,state.change,group.join,group.leave,media ^
  -e WHATSAPP_RESTART_ALL_SESSIONS=false ^
  -v whatsapp-sessions:/app/sessions ^
  -v whatsapp-media:/app/media ^
  %IMAGE%

REM Wait for startup
echo.
echo Waiting for WAHA to start...
timeout /t 10 /nobreak >nul

REM Check status
docker ps | findstr whatsapp-http-api >nul
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! WAHA is running with:
    echo ========================================
    echo - Media download: ENABLED
    echo - Auto-download: Images, Videos, Audio, Documents, PDFs
    echo - Storage: Files kept forever
    echo - Session: PRESERVED (no QR scan needed)
    echo.
    echo Test the API: http://localhost:3000/api/sessions
    echo.
    echo New media messages will now be downloaded automatically!
) else (
    echo.
    echo ERROR: WAHA failed to start!
    echo.
    echo Trying to restore original container...
    docker run -d ^
      --name whatsapp-http-api ^
      -p 3000:3000 ^
      -v whatsapp-sessions:/app/sessions ^
      %IMAGE%
    echo.
    echo Check logs: docker logs whatsapp-http-api
)

echo.
del waha-backup.json 2>nul
pause
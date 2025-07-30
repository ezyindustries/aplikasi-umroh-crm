@echo off
echo ===============================================
echo    FRESH WAHA DOCKER SETUP
echo    WhatsApp HTTP API Integration
echo ===============================================
echo.

:: Check Docker
echo [1/7] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed!
    pause
    exit /b 1
)

:: Stop and remove old containers
echo.
echo [2/7] Cleaning up old containers...
docker stop whatsapp-http-api 2>nul
docker rm whatsapp-http-api 2>nul
docker stop waha 2>nul
docker rm waha 2>nul

:: Remove old volumes
echo.
echo [3/7] Removing old volumes...
docker volume rm whatsapp-http-api_data 2>nul
docker volume rm waha_data 2>nul

:: Create fresh data directory
echo.
echo [4/7] Creating fresh data directory...
if exist "%~dp0waha-data" (
    echo Backing up existing data...
    rename "%~dp0waha-data" "waha-data-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%" 2>nul
)
mkdir "%~dp0waha-data"

:: Pull latest WAHA image
echo.
echo [5/7] Pulling latest WAHA image...
docker pull devlikeapro/whatsapp-http-api:latest

:: Create and start WAHA container
echo.
echo [6/7] Creating fresh WAHA container...
docker run -d ^
  --name whatsapp-http-api ^
  --restart unless-stopped ^
  -p 3000:3000 ^
  -v "%~dp0waha-data:/app/data" ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
  -e WHATSAPP_HOOK_EVENTS=* ^
  -e WHATSAPP_API_KEY= ^
  -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
  -e WHATSAPP_FILES_LIFETIME=180 ^
  -e WHATSAPP_ENABLE_WEBHOOK_CALL_RECEIVED=true ^
  -e WHATSAPP_ENABLE_WEBHOOK_MESSAGE_RECEIVED=true ^
  -e WHATSAPP_ENABLE_WEBHOOK_MESSAGE_ACK=true ^
  -e WHATSAPP_ENABLE_WEBHOOK_MESSAGE_REVOKED=true ^
  -e WHATSAPP_ENABLE_WEBHOOK_PRESENCE_UPDATE=true ^
  -e WHATSAPP_ENABLE_WEBHOOK_GROUP_JOIN=true ^
  -e WHATSAPP_ENABLE_WEBHOOK_GROUP_LEAVE=true ^
  devlikeapro/whatsapp-http-api:latest

if %errorlevel% neq 0 (
    echo ERROR: Failed to create container!
    pause
    exit /b 1
)

:: Wait for WAHA to start
echo.
echo [7/7] Waiting for WAHA to be ready...
timeout /t 10 /nobreak >nul

:: Check WAHA health
:CHECK_HEALTH
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo WAHA is still starting, waiting...
    timeout /t 5 /nobreak >nul
    goto CHECK_HEALTH
)

echo.
echo ===============================================
echo    WAHA SETUP COMPLETE!
echo ===============================================
echo.
echo WAHA is running at: http://localhost:3000
echo Swagger UI: http://localhost:3000/swagger
echo.

:: Show container info
docker ps --filter "name=whatsapp-http-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Next steps:
echo 1. Run START-BACKEND.bat to start the backend
echo 2. Run START-FRONTEND.bat to start the frontend
echo 3. Access http://localhost:8080/crm-main.html
echo 4. Start a WhatsApp session from the dashboard
echo.
pause
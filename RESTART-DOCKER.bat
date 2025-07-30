@echo off
echo ===============================================
echo    RESTART DOCKER & WAHA CONTAINER
echo    WhatsApp HTTP API
echo ===============================================
echo.

:: Check if Docker is running
echo [1/4] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    
    :: Try to start Docker Desktop
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    if %errorlevel% neq 0 (
        :: Try alternative path
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe" 2>nul
    )
    
    echo Waiting for Docker to start...
    :WAIT_DOCKER
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto WAIT_DOCKER
)
echo Docker is running.

:: Stop existing container
echo.
echo [2/4] Stopping WAHA container if running...
docker stop whatsapp-http-api >nul 2>&1
if %errorlevel% equ 0 (
    echo WAHA container stopped.
    timeout /t 2 /nobreak >nul
) else (
    echo WAHA container was not running.
)

:: Start container
echo.
echo [3/4] Starting WAHA container...
docker start whatsapp-http-api >nul 2>&1
if %errorlevel% neq 0 (
    echo Container doesn't exist. Creating new one...
    
    :: Create data directory
    if not exist "%~dp0waha-data" mkdir "%~dp0waha-data"
    
    :: Run new container
    docker run -d ^
      --name whatsapp-http-api ^
      --restart=unless-stopped ^
      -p 3000:3000 ^
      -v "%~dp0waha-data:/app/data" ^
      -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
      -e WHATSAPP_HOOK_EVENTS=* ^
      -e WHATSAPP_API_KEY= ^
      -e WHATSAPP_RESTART_ALL=true ^
      devlikeapro/whatsapp-http-api
)

:: Wait for container to be ready
echo.
echo [4/4] Waiting for WAHA to be ready...
timeout /t 5 /nobreak >nul

:: Check health
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    WAHA RESTARTED SUCCESSFULLY!
    echo ===============================================
    echo.
    echo WAHA API: http://localhost:3000
    echo Swagger UI: http://localhost:3000/swagger
    echo.
    
    :: Show container status
    docker ps --filter "name=whatsapp-http-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo.
) else (
    echo.
    echo WARNING: WAHA is starting but not yet responding.
    echo Check logs: docker logs -f whatsapp-http-api
    echo.
)

echo Press any key to exit...
pause >nul
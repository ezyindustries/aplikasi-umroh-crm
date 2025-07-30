@echo off
echo ===============================================
echo    START DOCKER & WAHA CONTAINER
echo    WhatsApp HTTP API
echo ===============================================
echo.

:: Check if Docker is installed
echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker is not installed or not in PATH!
    echo Please install Docker Desktop from https://www.docker.com/
    echo.
    pause
    exit /b 1
)
echo Docker is installed.

:: Check if Docker Desktop is running
echo.
echo [2/5] Checking if Docker Desktop is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Desktop is not running. Starting it now...
    
    :: Try to start Docker Desktop
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    if %errorlevel% neq 0 (
        :: Try alternative path
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe" 2>nul
    )
    
    echo Waiting for Docker to start (this may take a minute)...
    :WAIT_DOCKER
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto WAIT_DOCKER
)
echo Docker Desktop is running.

:: Check if WAHA container exists
echo.
echo [3/5] Checking WAHA container...
docker ps -a --filter "name=whatsapp-http-api" --format "table {{.Names}}\t{{.Status}}" | findstr /i "whatsapp-http-api" >nul 2>&1
if %errorlevel% neq 0 (
    echo WAHA container not found. Creating new container...
    goto CREATE_CONTAINER
)

:: Check if container is running
docker ps --filter "name=whatsapp-http-api" --format "table {{.Names}}" | findstr /i "whatsapp-http-api" >nul 2>&1
if %errorlevel% equ 0 (
    echo WAHA container is already running.
    goto CHECK_HEALTH
)

:: Start existing container
echo WAHA container exists but is stopped. Starting it...
docker start whatsapp-http-api
goto CHECK_HEALTH

:CREATE_CONTAINER
echo.
echo [4/5] Creating and starting WAHA container...
echo.

:: Create data directory for sessions
if not exist "%~dp0waha-data" (
    mkdir "%~dp0waha-data"
    echo Created waha-data directory for session storage.
)

:: Run WAHA container
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

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to create WAHA container!
    echo Please check Docker logs for details.
    pause
    exit /b 1
)

:CHECK_HEALTH
echo.
echo [5/5] Checking WAHA health...
timeout /t 5 /nobreak >nul

:: Check if WAHA is responding
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    WAHA IS RUNNING SUCCESSFULLY!
    echo ===============================================
    echo.
    echo WAHA API: http://localhost:3000
    echo Swagger UI: http://localhost:3000/swagger
    echo.
    echo Session data stored in: %~dp0waha-data
    echo.
    
    :: Show container info
    echo Container Info:
    docker ps --filter "name=whatsapp-http-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo.
    
    :: Show logs hint
    echo To view logs: docker logs -f whatsapp-http-api
    echo To stop: docker stop whatsapp-http-api
    echo.
) else (
    echo.
    echo WARNING: WAHA container is starting but not yet responding.
    echo It may take a few more seconds to be fully ready.
    echo.
    echo Check status with: curl http://localhost:3000/api/health
    echo View logs with: docker logs whatsapp-http-api
    echo.
)

echo Press any key to exit...
pause >nul
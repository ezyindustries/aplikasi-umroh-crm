@echo off
echo ===============================================
echo    WAHA DOCKER SETUP (DEBUG VERSION)
echo ===============================================
echo.

:: Enable command echo for debugging
echo on

:: Check if Docker is installed
echo [STEP 1] Checking Docker installation...
docker --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker is not installed or not in PATH!
    echo Please install Docker Desktop from https://www.docker.com/
    pause
    exit /b 1
)

:: Check if Docker daemon is running
echo.
echo [STEP 2] Checking if Docker daemon is running...
docker info
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker daemon is not running!
    echo Please start Docker Desktop and wait for it to be ready.
    echo.
    echo Trying to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo.
    echo Please wait for Docker Desktop to start, then run this script again.
    pause
    exit /b 1
)

:: List existing containers
echo.
echo [STEP 3] Listing existing containers...
docker ps -a

:: Stop and remove old containers
echo.
echo [STEP 4] Stopping old containers if any...
docker stop whatsapp-http-api
docker stop waha

echo.
echo [STEP 5] Removing old containers if any...
docker rm whatsapp-http-api
docker rm waha

:: Show current directory
echo.
echo [STEP 6] Current directory: %cd%
echo Script directory: %~dp0

:: Create data directory
echo.
echo [STEP 7] Creating data directory...
if not exist "%~dp0waha-data" (
    mkdir "%~dp0waha-data"
    echo Created: %~dp0waha-data
) else (
    echo Directory already exists: %~dp0waha-data
)

:: Pull WAHA image
echo.
echo [STEP 8] Pulling WAHA Docker image...
docker pull devlikeapro/whatsapp-http-api:latest

:: Create container with detailed output
echo.
echo [STEP 9] Creating WAHA container...
echo Running command:
echo docker run -d --name whatsapp-http-api --restart unless-stopped -p 3000:3000 -v "%~dp0waha-data:/app/data" -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha -e WHATSAPP_HOOK_EVENTS=* devlikeapro/whatsapp-http-api:latest

docker run -d ^
  --name whatsapp-http-api ^
  --restart unless-stopped ^
  -p 3000:3000 ^
  -v "%~dp0waha-data:/app/data" ^
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/api/webhooks/waha ^
  -e WHATSAPP_HOOK_EVENTS=* ^
  devlikeapro/whatsapp-http-api:latest

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to create container!
    echo Check the error message above.
    docker logs whatsapp-http-api
    pause
    exit /b 1
)

:: Show container status
echo.
echo [STEP 10] Container status:
docker ps --filter "name=whatsapp-http-api"

:: Wait and check logs
echo.
echo [STEP 11] Waiting 10 seconds for container to start...
timeout /t 10

echo.
echo [STEP 12] Container logs:
docker logs --tail 20 whatsapp-http-api

:: Test API
echo.
echo [STEP 13] Testing WAHA API...
curl -v http://localhost:3000/api/health

echo.
echo ===============================================
echo    SETUP COMPLETE - CHECK OUTPUT ABOVE
echo ===============================================
echo.
echo If successful, WAHA should be running at:
echo - API: http://localhost:3000
echo - Swagger: http://localhost:3000/swagger
echo.
pause
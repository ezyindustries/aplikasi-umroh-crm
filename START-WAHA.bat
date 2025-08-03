@echo off
echo Starting WAHA WhatsApp API...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Create network if it doesn't exist
docker network create aplikasiumroh_vauza-network 2>nul

REM Stop existing container if running
echo Stopping existing WAHA container...
docker-compose -f docker-compose.waha.yml down

REM Start WAHA
echo Starting WAHA with media download enabled...
docker-compose -f docker-compose.waha.yml up -d

REM Wait a bit
timeout /t 5 /nobreak >nul

REM Check if container is running
docker ps | findstr vauza-tamma-waha >nul
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: WAHA is running!
    echo.
    echo WAHA API: http://localhost:3000
    echo Swagger UI: http://localhost:3000/docs
    echo.
    echo Media download is ENABLED with these settings:
    echo - All media types will be downloaded
    echo - Files will be kept forever
    echo - Webhook configured to: http://localhost:3003/api/webhooks/waha
    echo.
    echo Backend API runs on: http://localhost:3003
    echo.
    echo To view logs: docker logs -f vauza-tamma-waha
) else (
    echo.
    echo ERROR: WAHA failed to start!
    echo Check logs with: docker logs vauza-tamma-waha
)

echo.
pause
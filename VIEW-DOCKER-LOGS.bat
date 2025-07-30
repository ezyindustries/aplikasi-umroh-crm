@echo off
echo ===============================================
echo    VIEW DOCKER WAHA LOGS
echo    WhatsApp HTTP API
echo ===============================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

:: Check if WAHA container exists
docker ps -a --filter "name=whatsapp-http-api" --format "{{.Names}}" | findstr /i "whatsapp-http-api" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: WAHA container not found!
    echo Please run START-DOCKER.bat first.
    echo.
    pause
    exit /b 1
)

echo Container Status:
docker ps -a --filter "name=whatsapp-http-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo ===============================================
echo    SHOWING LIVE LOGS (Press Ctrl+C to stop)
echo ===============================================
echo.

:: Show logs with follow
docker logs -f --tail 50 whatsapp-http-api

echo.
echo Logs stopped.
pause
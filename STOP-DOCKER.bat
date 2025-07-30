@echo off
echo ===============================================
echo    STOP DOCKER & WAHA CONTAINER
echo    WhatsApp HTTP API
echo ===============================================
echo.

:: Check if Docker is running
echo [1/3] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running.
    echo.
    pause
    exit /b 0
)

:: Check if WAHA container exists and is running
echo.
echo [2/3] Checking WAHA container...
docker ps --filter "name=whatsapp-http-api" --format "{{.Names}}" | findstr /i "whatsapp-http-api" >nul 2>&1
if %errorlevel% neq 0 (
    echo WAHA container is not running.
    echo.
    pause
    exit /b 0
)

:: Stop WAHA container
echo.
echo [3/3] Stopping WAHA container...
docker stop whatsapp-http-api

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    WAHA CONTAINER STOPPED SUCCESSFULLY!
    echo ===============================================
    echo.
    echo The container has been stopped but not removed.
    echo Session data is preserved in: %~dp0waha-data
    echo.
    echo To start again: run START-DOCKER.bat
    echo To remove container: docker rm whatsapp-http-api
    echo To remove with data: docker rm -v whatsapp-http-api
    echo.
) else (
    echo.
    echo ERROR: Failed to stop WAHA container!
    echo Please check Docker logs for details.
    echo.
)

echo Press any key to exit...
pause >nul
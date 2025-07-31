@echo off
echo Checking WAHA Status...
echo ========================
echo.

REM Check if container is running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr waha
if %errorlevel% neq 0 (
    echo WAHA container is NOT running!
    echo.
    echo To start WAHA, run: START-WAHA.bat
) else (
    echo.
    echo WAHA Environment Variables:
    echo ---------------------------
    docker exec vauza-tamma-waha printenv | findstr WHATSAPP_DOWNLOAD_MEDIA
    docker exec vauza-tamma-waha printenv | findstr WHATSAPP_FILES_MIMETYPES
    docker exec vauza-tamma-waha printenv | findstr WHATSAPP_FILES_LIFETIME
    docker exec vauza-tamma-waha printenv | findstr WHATSAPP_FILES_FOLDER
    
    echo.
    echo WAHA API Health Check:
    echo ----------------------
    curl -s http://localhost:3000/api/sessions 2>nul
    if %errorlevel% equ 0 (
        echo.
        echo API is accessible!
    ) else (
        echo API not responding
    )
)

echo.
pause
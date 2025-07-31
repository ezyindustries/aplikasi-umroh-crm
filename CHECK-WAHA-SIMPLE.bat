@echo off
echo Checking WAHA Status...
echo ======================
echo.

REM Check if container is running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr whatsapp
echo.

REM Check media download setting
echo Checking Media Download Setting:
echo --------------------------------
docker exec whatsapp-http-api printenv WHATSAPP_DOWNLOAD_MEDIA 2>nul
if %errorlevel% neq 0 (
    echo WHATSAPP_DOWNLOAD_MEDIA is NOT SET - Media download is DISABLED
    echo.
    echo To enable media download, run: ENABLE-MEDIA-DOWNLOAD-SAFE.bat
) else (
    echo Media download setting found!
)

echo.
pause
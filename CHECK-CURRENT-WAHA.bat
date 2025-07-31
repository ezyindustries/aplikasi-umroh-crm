@echo off
echo Checking current WAHA configuration...
echo =====================================
echo.

REM Check running container
echo Container Info:
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Ports}}" | findstr -E "waha|whatsapp|3000"
echo.

REM Check environment variables
echo Current Environment Variables:
echo -----------------------------
docker exec whatsapp-http-api printenv | findstr -i download_media 2>nul
if %errorlevel% neq 0 (
    echo WHATSAPP_DOWNLOAD_MEDIA: Not set (default: false)
)

docker exec whatsapp-http-api printenv | findstr -i files_mimetypes 2>nul
if %errorlevel% neq 0 (
    echo WHATSAPP_FILES_MIMETYPES: Not set
)

docker exec whatsapp-http-api printenv | findstr -i files_lifetime 2>nul
if %errorlevel% neq 0 (
    echo WHATSAPP_FILES_LIFETIME: Not set
)

docker exec whatsapp-http-api printenv | findstr -i hook_url 2>nul
echo.

REM Check volumes
echo Volumes:
echo --------
docker inspect whatsapp-http-api --format="{{range .Mounts}}{{.Name}} -> {{.Destination}}{{println}}{{end}}" 2>nul
echo.

REM Test API
echo API Status:
echo -----------
curl -s http://localhost:3000/api/sessions 2>nul
if %errorlevel% neq 0 (
    echo API not responding or no sessions
)

echo.
echo Note: If WHATSAPP_DOWNLOAD_MEDIA is not set or false,
echo       media files will NOT be downloaded automatically.
echo.
pause
@echo off
echo === WAHA PLUS CONTROL PANEL ===
echo.

:menu
echo What would you like to do?
echo.
echo 1. Start WAHA Plus
echo 2. Stop WAHA Plus  
echo 3. Restart WAHA Plus
echo 4. View Logs
echo 5. Check Status
echo 6. Update to Latest Version
echo 7. Remove Container (Clean Install)
echo 8. Exit
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto status
if "%choice%"=="6" goto update
if "%choice%"=="7" goto remove
if "%choice%"=="8" goto end

echo Invalid choice. Please try again.
echo.
goto menu

:start
echo.
echo Starting WAHA Plus...
docker start waha 2>nul
if %errorlevel% neq 0 (
    echo Container not found. Creating new container...
    echo.
    
    if exist .env.waha (
        echo Loading configuration from .env.waha
        for /f "tokens=1,2 delims==" %%a in (.env.waha) do (
            if "%%a"=="WAHA_LICENSE_KEY" set LICENSE_KEY=%%b
            if "%%a"=="WHATSAPP_API_KEY" set API_KEY=%%b
        )
    ) else (
        set /p LICENSE_KEY="Enter WAHA Plus license key: "
        set /p API_KEY="Enter API key: "
    )
    
    docker run -d ^
      --name waha ^
      --restart always ^
      -p 3000:3000 ^
      -e WAHA_LICENSE_KEY=!LICENSE_KEY! ^
      -e WHATSAPP_HOOK_URL=http://host.docker.internal:3003/api/webhook ^
      -e WHATSAPP_HOOK_EVENTS=* ^
      -e WHATSAPP_API_KEY=!API_KEY! ^
      -e WHATSAPP_RESTART_ALL_SESSIONS=true ^
      -e WHATSAPP_FILES_MIMETYPES=audio,document,image,video ^
      -v waha-data:/app/data ^
      devlikeapro/waha-plus:latest
)
echo WAHA Plus started successfully!
echo.
pause
goto menu

:stop
echo.
echo Stopping WAHA Plus...
docker stop waha
echo WAHA Plus stopped.
echo.
pause
goto menu

:restart
echo.
echo Restarting WAHA Plus...
docker restart waha
echo WAHA Plus restarted.
echo.
pause
goto menu

:logs
echo.
echo Showing last 50 lines of logs (Ctrl+C to exit)...
echo.
docker logs -f --tail 50 waha
echo.
pause
goto menu

:status
echo.
echo === WAHA Plus Status ===
echo.
docker ps -a | findstr waha
echo.
echo === Version Info ===
curl -s http://localhost:3000/api/version
echo.
echo.
echo === Health Check ===
curl -s http://localhost:3000/api/health
echo.
echo.
echo === Sessions ===
curl -s -H "X-Api-Key: %API_KEY%" http://localhost:3000/api/sessions
echo.
echo.
pause
goto menu

:update
echo.
echo Updating WAHA Plus to latest version...
docker pull devlikeapro/waha-plus:latest
echo.
echo Update complete. Please restart the container.
echo.
pause
goto menu

:remove
echo.
echo WARNING: This will remove the container (data volume will be preserved)
set /p confirm="Are you sure? (y/n): "
if /i "%confirm%"=="y" (
    docker stop waha 2>nul
    docker rm waha 2>nul
    echo Container removed. Data volume preserved.
) else (
    echo Operation cancelled.
)
echo.
pause
goto menu

:end
echo.
echo Goodbye!
exit /b 0
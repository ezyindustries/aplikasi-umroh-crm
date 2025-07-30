@echo off
setlocal enabledelayedexpansion

echo ========================================
echo        WHATSAPP SESSION MANAGER
echo ========================================
echo.

:menu
echo Choose an option:
echo 1. Check current session status
echo 2. Restore session (no QR needed if backup exists)
echo 3. List session backups
echo 4. Restart WAHA with persistent storage
echo 5. View WAHA logs
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto restore
if "%choice%"=="3" goto backups
if "%choice%"=="4" goto restart_waha
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto exit
echo Invalid choice. Please try again.
echo.
goto menu

:status
echo.
echo === CHECKING SESSION STATUS ===
curl -s http://localhost:3001/api/sessions/default/status
echo.
curl -s http://localhost:3000/api/default
echo.
pause
goto menu

:restore
echo.
echo === RESTORING SESSION ===
curl -X POST http://localhost:3001/api/sessions/restore -H "Content-Type: application/json" -d "{\"sessionName\":\"default\"}"
echo.
echo Session restore attempted. Check status to verify.
pause
goto menu

:backups
echo.
echo === SESSION BACKUPS ===
curl -s http://localhost:3001/api/sessions/backups
echo.
pause
goto menu

:restart_waha
echo.
echo === RESTARTING WAHA WITH PERSISTENT STORAGE ===
call restart-waha-with-session.bat
pause
goto menu

:logs
echo.
echo === WAHA CONTAINER LOGS ===
docker logs waha --tail=50
echo.
pause
goto menu

:exit
echo.
echo Session Manager closed.
exit /b 0
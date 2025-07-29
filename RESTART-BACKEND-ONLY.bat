@echo off
title Restart Backend Only
color 0A

echo ============================================
echo         RESTARTING BACKEND ONLY
echo ============================================
echo.

:: Get backend PID if running
set BACKEND_PID=
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do set BACKEND_PID=%%a

if defined BACKEND_PID (
    echo Stopping backend process (PID: %BACKEND_PID%)...
    taskkill /F /PID %BACKEND_PID% >nul 2>&1
    timeout /t 2 /nobreak > nul
) else (
    echo Backend not currently running on port 3001
)

:: Navigate to backend directory
cd /d "%~dp0backend\whatsapp"

:: Clear any error logs
if exist error.log del error.log

:: Start backend
echo Starting backend server...
echo.
echo Logs will be displayed below:
echo ============================================
echo.

:: Run in current window so we can see logs
node server.js

:: If it exits, pause to see error
pause
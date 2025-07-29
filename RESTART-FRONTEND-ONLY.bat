@echo off
title Restart Frontend Only
color 0D

echo ============================================
echo         RESTARTING FRONTEND ONLY
echo ============================================
echo.

:: Kill existing frontend process on port 8080
set FRONTEND_PID=
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do set FRONTEND_PID=%%a

if defined FRONTEND_PID (
    echo Stopping frontend process (PID: %FRONTEND_PID%)...
    taskkill /F /PID %FRONTEND_PID% >nul 2>&1
    timeout /t 2 /nobreak > nul
) else (
    echo Frontend not currently running on port 8080
)

:: Navigate to frontend directory
cd /d "%~dp0frontend"

echo Starting frontend server on port 8080...
echo.

:: Check if Python is available
python --version >nul 2>&1
if %errorlevel%==0 (
    echo Using Python HTTP Server...
    echo.
    echo ============================================
    echo Frontend running at:
    echo http://localhost:8080/conversations-beautiful.html
    echo ============================================
    echo.
    python -m http.server 8080
) else (
    echo Using Node.js HTTP Server...
    echo.
    echo ============================================
    echo Frontend running at:
    echo http://localhost:8080/conversations-beautiful.html
    echo ============================================
    echo.
    npx http-server -p 8080
)

pause
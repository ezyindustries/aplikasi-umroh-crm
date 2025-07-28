@echo off
title Restart Frontend Server
color 0A
cls

echo ================================================
echo    RESTARTING FRONTEND SERVER
echo ================================================
echo.

echo [1/3] Stopping all processes on port 8080...
echo ------------------------------------------------
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo [2/3] Starting new frontend server...
echo ------------------------------------------------
cd frontend

echo Choose server method:
echo 1. Python HTTP Server (Recommended)
echo 2. Node.js HTTP Server
echo 3. PHP Built-in Server
echo.

REM Try Python first
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting with Python...
    start "Frontend Server - Python" cmd /k "python -m http.server 8080"
    goto :server_started
)

REM Try Node.js if Python not available
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo Python not found, starting with Node.js...
    echo Installing http-server...
    npm install -g http-server >nul 2>&1
    start "Frontend Server - Node" cmd /k "http-server -p 8080 -c-1"
    goto :server_started
)

REM Try PHP if others not available
where php >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js not found, starting with PHP...
    start "Frontend Server - PHP" cmd /k "php -S localhost:8080"
    goto :server_started
)

echo ERROR: No suitable server found! Please install Python, Node.js, or PHP.
pause
exit /b 1

:server_started
cd ..

echo.
echo [3/3] Waiting for server to start...
echo ------------------------------------------------
timeout /t 3 /nobreak >nul

echo Testing server...
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend server is running!
) else (
    echo [WARNING] Server may still be starting...
)

echo.
echo ================================================
echo    FRONTEND SERVER RESTARTED
echo ================================================
echo.
echo You can now access:
echo - http://localhost:8080/
echo - http://localhost:8080/index.html
echo - http://localhost:8080/crm-beautiful.html
echo - http://localhost:8080/index-whatsapp-fixed.html
echo.
echo If browser shows "This site can't be reached":
echo 1. Wait a few seconds and refresh
echo 2. Try http://127.0.0.1:8080 instead
echo 3. Check Windows Firewall settings
echo.
pause
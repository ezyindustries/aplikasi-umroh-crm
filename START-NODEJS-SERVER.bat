@echo off
title Start Node.js Frontend Server
color 0A
cls

echo ================================================
echo    STARTING NODE.JS FRONTEND SERVER
echo ================================================
echo.

echo [1/3] Stopping existing servers on port 8080...
echo ------------------------------------------------
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo [2/3] Starting Node.js server...
echo ------------------------------------------------
cd frontend

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

start "Frontend Server - Node.js" cmd /k "node server.js"

cd ..

echo.
echo [3/3] Waiting for server to start...
echo ------------------------------------------------
timeout /t 3 /nobreak >nul

echo.
echo ================================================
echo    SERVER STARTED SUCCESSFULLY
echo ================================================
echo.
echo Access your application at:
echo - http://localhost:8080
echo - http://127.0.0.1:8080
echo.
echo Available pages:
echo - http://localhost:8080/index.html (Main App)
echo - http://localhost:8080/crm-beautiful.html (WhatsApp CRM)
echo - http://localhost:8080/test.html (Test Page)
echo.
echo Opening test page in browser...
start "" "http://127.0.0.1:8080/test.html"
echo.
pause
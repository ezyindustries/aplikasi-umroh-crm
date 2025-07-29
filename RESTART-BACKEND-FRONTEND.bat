@echo off
title Restart Backend & Frontend (Without Docker)
color 0B

echo ============================================
echo    RESTARTING BACKEND AND FRONTEND
echo    (Docker WAHA will NOT be restarted)
echo ============================================
echo.

:: Kill existing processes
echo [1/5] Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak > nul

:: Kill specific ports if still in use
echo [2/5] Clearing ports...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak > nul

:: Start Backend
echo [3/5] Starting Backend (Port 3001)...
cd /d "%~dp0backend\whatsapp"
start /B cmd /c "node server.js > backend.log 2>&1"
timeout /t 3 /nobreak > nul

:: Check if backend started
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo       Backend started successfully!
) else (
    echo       Backend may still be starting...
)

:: Start Frontend
echo [4/5] Starting Frontend (Port 8080)...
cd /d "%~dp0frontend"

:: Check if Python is available
python --version >nul 2>&1
if %errorlevel%==0 (
    start /B cmd /c "python -m http.server 8080 > frontend.log 2>&1"
    echo       Frontend started with Python HTTP Server
) else (
    start /B cmd /c "npx http-server -p 8080 > frontend.log 2>&1"
    echo       Frontend started with Node HTTP Server
)

echo.
echo [5/5] Services Status:
echo.
echo Docker WAHA:     Running on http://localhost:3000 (NOT restarted)
echo Backend API:     Starting on http://localhost:3001
echo Frontend:        Starting on http://localhost:8080
echo.
echo ============================================
echo Access the application at:
echo http://localhost:8080/conversations-beautiful.html
echo ============================================
echo.
echo Press any key to check service status...
pause > nul

:: Check services
echo.
echo Checking services...
echo.
curl -s http://localhost:3000/api/sessions >nul 2>&1
if %errorlevel%==0 (
    echo [OK] WAHA is running
) else (
    echo [!!] WAHA is not responding - run START-WAHA-DOCKER.bat
)

curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Backend is running
) else (
    echo [!!] Backend is not responding
)

curl -s http://localhost:8080 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Frontend is running
) else (
    echo [!!] Frontend is not responding
)

echo.
pause
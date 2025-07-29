@echo off
title WhatsApp CRM - Start All Services
color 0A

echo ============================================
echo           WHATSAPP CRM LAUNCHER
echo ============================================
echo.

:: Check if Docker is running
echo [1] Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop first
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running
    echo Please start Docker Desktop first
    pause
    exit /b 1
)
echo Docker is running OK!
echo.

:: Kill any existing WAHA container
echo [2] Cleaning up existing WAHA containers...
docker stop waha >nul 2>&1
docker rm waha >nul 2>&1
echo Cleanup complete!
echo.

:: Start WAHA
echo [3] Starting WAHA Docker container...
start "WAHA API" cmd /k "docker run -it --rm -p 3000:3000/tcp --name waha devlikeapro/waha"
echo WAHA starting on port 3000...
echo.

:: Wait for WAHA to be ready
echo [4] Waiting for WAHA to initialize (15 seconds)...
timeout /t 15 /nobreak > nul
echo.

:: Start WhatsApp Backend
echo [5] Starting WhatsApp Backend...
cd /d "%~dp0backend\whatsapp"
start "WhatsApp Backend" cmd /k "npm start"
cd /d "%~dp0"
echo Backend starting on port 3001...
echo.

:: Wait for backend to be ready
echo [6] Waiting for backend to initialize (10 seconds)...
timeout /t 10 /nobreak > nul
echo.

:: Start Frontend Server
echo [7] Starting Frontend Server...
cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "npx http-server -p 8080 -c-1 --cors"
cd /d "%~dp0"
echo Frontend server starting on port 8080...
echo.

:: Wait a bit more
echo [8] Finalizing startup (5 seconds)...
timeout /t 5 /nobreak > nul
echo.

:: Open browser
echo [9] Opening WhatsApp CRM in browser...
start http://localhost:8080/conversations-beautiful.html
echo.

echo ============================================
echo          ALL SERVICES STARTED!
echo ============================================
echo.
echo Service Status:
echo - WAHA API:         http://localhost:3000
echo - WhatsApp Backend: http://localhost:3001
echo - Frontend Server:  http://localhost:8080
echo.
echo Pages:
echo - CRM Dashboard:    http://localhost:8080/crm-main.html
echo - Conversations:    http://localhost:8080/conversations-beautiful.html
echo.
echo To stop all services, close all command windows
echo ============================================
echo.
pause